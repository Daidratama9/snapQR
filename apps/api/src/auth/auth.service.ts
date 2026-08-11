import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { createHash, randomBytes } from "crypto";
import { PrismaService } from "../prisma.service";

export type AuthTokens = { accessToken: string; refreshToken: string };

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService, private readonly config: ConfigService) {}

  async register(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) throw new ConflictException("An account with this email already exists.");
    const user = await this.prisma.user.create({ data: { email: normalizedEmail, passwordHash: await argon2.hash(password) } });
    return { user: this.publicUser(user), tokens: await this.issueTokens(user.id) };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || user.status !== "ACTIVE" || !(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException("Invalid email or password.");
    }
    return { user: this.publicUser(user), tokens: await this.issueTokens(user.id) };
  }

  async refresh(rawToken: string) {
    const session = await this.prisma.refreshSession.findUnique({ where: { tokenHash: this.hash(rawToken) }, include: { user: true } });
    if (!session || session.revokedAt || session.expiresAt <= new Date() || session.user.status !== "ACTIVE") {
      throw new UnauthorizedException("Session is invalid or expired.");
    }
    await this.prisma.refreshSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    return { user: this.publicUser(session.user), tokens: await this.issueTokens(session.user.id) };
  }

  async logout(rawToken?: string) {
    if (rawToken) await this.prisma.refreshSession.updateMany({ where: { tokenHash: this.hash(rawToken), revokedAt: null }, data: { revokedAt: new Date() } });
  }

  private async issueTokens(userId: string): Promise<AuthTokens> {
    const accessToken = await this.jwt.signAsync({ sub: userId }, { secret: this.config.getOrThrow("JWT_ACCESS_SECRET"), expiresIn: this.config.get("ACCESS_TOKEN_TTL") });
    const refreshToken = randomBytes(48).toString("base64url");
    const expiresAt = new Date(Date.now() + this.refreshLifetimeMs());
    await this.prisma.refreshSession.create({ data: { userId, tokenHash: this.hash(refreshToken), expiresAt } });
    return { accessToken, refreshToken };
  }

  private refreshLifetimeMs() {
    const value = this.config.get<string>("REFRESH_TOKEN_TTL", "7d");
    const match = /^(\d+)([dh])$/.exec(value);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    return Number(match[1]) * (match[2] === "d" ? 86_400_000 : 3_600_000);
  }

  private hash(value: string) { return createHash("sha256").update(value).digest("hex"); }
  private publicUser(user: { id: string; email: string; status: string }) { return { id: user.id, email: user.email, status: user.status }; }
}
