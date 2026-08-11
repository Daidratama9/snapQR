import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../src/auth/auth.service";

describe("AuthService", () => {
  const user = { id: "user-1", email: "staff@snapqr.test", passwordHash: "hash", status: "ACTIVE" };
  const prisma: any = {
    user: { findUnique: jest.fn(), create: jest.fn() },
    refreshSession: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  };
  const jwt: any = { signAsync: jest.fn().mockResolvedValue("access-token") };
  const config: any = { getOrThrow: jest.fn().mockReturnValue("a-secret-that-is-long-enough-for-tests"), get: jest.fn((_: string, fallback?: string) => fallback ?? "15m") };
  const service = new AuthService(prisma, jwt, config);

  beforeEach(() => jest.clearAllMocks());

  it("rejects duplicate email during registration", async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    await expect(service.register(user.email, "a-password-that-is-long")).rejects.toBeInstanceOf(ConflictException);
  });

  it("rejects an unknown login", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.login(user.email, "a-password-that-is-long")).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
