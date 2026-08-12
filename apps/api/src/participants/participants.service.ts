import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OrganizationRole } from "@prisma/client";
import { randomBytes } from "crypto";
import { PrismaService } from "../prisma.service";
import { CreateParticipantDto } from "./dto/create-participant.dto";

@Injectable()
export class ParticipantsService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async create(userId: string, organizationId: string, eventId: string, dto: CreateParticipantDto) {
    await this.requireAccess(userId, organizationId);
    await this.requireEvent(organizationId, eventId);
    try {
      return await this.prisma.participant.create({ data: {
        eventId, bibNumber: dto.bibNumber.trim(), name: dto.name.trim(), email: dto.email?.trim().toLowerCase(), phone: dto.phone?.trim(),
      } });
    } catch (error: unknown) {
      if (this.isUniqueConstraint(error)) throw new ConflictException("This BIB number already exists for the event.");
      throw error;
    }
  }

  async list(userId: string, organizationId: string, eventId: string) {
    await this.requireAccess(userId, organizationId);
    await this.requireEvent(organizationId, eventId);
    return this.prisma.participant.findMany({ where: { eventId }, include: { qrCodes: { where: { status: "ACTIVE" }, select: { id: true, token: true, createdAt: true } } }, orderBy: { bibNumber: "asc" } });
  }

  async generateMissingQrCodes(userId: string, organizationId: string, eventId: string) {
    await this.requireAccess(userId, organizationId);
    await this.requireEvent(organizationId, eventId);
    const participants = await this.prisma.participant.findMany({
      where: { eventId, status: "ACTIVE", qrCodes: { none: { status: "ACTIVE" } } }, select: { id: true },
    });
    if (!participants.length) return { generated: 0 };
    await this.prisma.participantQrCode.createMany({ data: participants.map(({ id }) => ({ participantId: id, token: this.newToken() })) });
    return { generated: participants.length };
  }

  async regenerateQrCode(userId: string, organizationId: string, eventId: string, participantId: string) {
    await this.requireAccess(userId, organizationId);
    const participant = await this.prisma.participant.findFirst({ where: { id: participantId, eventId, event: { organizationId } } });
    if (!participant) throw new NotFoundException("Participant not found.");
    if (participant.status !== "ACTIVE") throw new ForbiddenException("A cancelled participant cannot receive a QR code.");
    const qrCode = await this.prisma.$transaction(async (tx) => {
      await tx.participantQrCode.updateMany({ where: { participantId, status: "ACTIVE" }, data: { status: "REVOKED", revokedAt: new Date() } });
      return tx.participantQrCode.create({ data: { participantId, token: this.newToken() } });
    });
    return { ...qrCode, url: this.toQrUrl(qrCode.token) };
  }

  private async requireAccess(userId: string, organizationId: string) {
    const membership = await this.prisma.organizationMember.findUnique({ where: { organizationId_userId: { organizationId, userId } } });
    const allowed: OrganizationRole[] = ["OWNER", "ADMIN", "OPERATOR"];
    if (!membership || !allowed.includes(membership.role)) throw new ForbiddenException("You do not have access to this organization.");
  }

  private async requireEvent(organizationId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({ where: { id: eventId, organizationId } });
    if (!event) throw new NotFoundException("Event not found.");
  }

  private newToken() { return randomBytes(24).toString("base64url"); }
  private toQrUrl(token: string) { return `${this.config.getOrThrow<string>("PUBLIC_APP_URL").replace(/\/$/, "")}/p/${token}`; }
  private isUniqueConstraint(error: unknown): error is { code: string } { return typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002"; }
}
