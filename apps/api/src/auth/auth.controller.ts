import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { CredentialsDto } from "./dto/credentials.dto";
import { JwtAccessGuard } from "./jwt-access.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}

  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body() dto: CredentialsDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.register(dto.email, dto.password);
    this.setRefreshCookie(response, result.tokens.refreshToken);
    return { user: result.user, accessToken: result.tokens.accessToken };
  }

  @Post("login")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() dto: CredentialsDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(dto.email, dto.password);
    this.setRefreshCookie(response, result.tokens.refreshToken);
    return { user: result.user, accessToken: result.tokens.accessToken };
  }

  @Post("refresh")
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const token = request.cookies?.snapqr_refresh as string | undefined;
    if (!token) throw new UnauthorizedException("Refresh session is missing.");
    const result = await this.auth.refresh(token);
    this.setRefreshCookie(response, result.tokens.refreshToken);
    return { user: result.user, accessToken: result.tokens.accessToken };
  }

  @Post("logout")
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(request.cookies?.snapqr_refresh as string | undefined);
    response.clearCookie("snapqr_refresh", { httpOnly: true, sameSite: "lax", secure: this.isProduction() });
    return { success: true };
  }

  @Get("me")
  @UseGuards(JwtAccessGuard)
  me(@Req() request: Request & { user: { sub: string } }) {
    return { userId: request.user.sub };
  }

  private setRefreshCookie(response: Response, token: string) {
    response.cookie("snapqr_refresh", token, {
      httpOnly: true,
      secure: this.isProduction(),
      sameSite: "lax",
      path: "/auth",
      maxAge: this.refreshMaxAgeMs(),
    });
  }

  private isProduction() { return this.config.get("NODE_ENV") === "production"; }
  private refreshMaxAgeMs() { return 7 * 24 * 60 * 60 * 1000; }
}
