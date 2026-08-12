import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { OrganizationRole } from "@prisma/client";
import * as argon2 from "argon2";
import { PrismaService } from "../prisma.service";
import { CreatePhotographerDto } from "./dto/create-photographer.dto";
import { UpdatePhotographerStatusDto } from "./dto/update-photographer-status.dto";

@Injectable()
export class PhotographersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, organizationId: string, eventId: string, dto: CreatePhotographerDto) {
    await this.requireAdmin(userId, organizationId);
    await this.requireEvent(organizationId, eventId);
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    const photographer = existing ?? await this.prisma.user.create({ data: { email, displayName: dto.displayName.trim(), passwordHash: await argon2.hash(dto.password) } });
    await this.prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId, userId: photographer.id } },
      create: { organizationId, userId: photographer.id, role: "PHOTOGRAPHER" },
      update: {},
    });
    try {
      return await this.prisma.eventPhotographer.create({ data: { eventId, userId: photographer.id }, include: { user: { select: { id: true, email: true, displayName: true } } } });
    } catch (error: unknown) {
      if (this.isUniqueConstraint(error)) throw new ConflictException("This photographer is already assigned to the event.");
      throw error;
    }
  }

  async list(userId: string, organizationId: string, eventId: string) {
    await this.requireEventAccess(userId, organizationId, eventId);
    return this.prisma.eventPhotographer.findMany({ where: { eventId }, include: { user: { select: { id: true, email: true, displayName: true } } }, orderBy: { createdAt: "asc" } });
  }

  async updateStatus(userId: string, organizationId: string, eventId: string, assignmentId: string, dto: UpdatePhotographerStatusDto) {
    await this.requireAdmin(userId, organizationId);
    const assignment = await this.prisma.eventPhotographer.findFirst({ where: { id: assignmentId, eventId, event: { organizationId } } });
    if (!assignment) throw new NotFoundException("Photographer assignment not found.");
    return this.prisma.eventPhotographer.update({ where: { id: assignmentId }, data: { status: dto.status } });
  }

  private async requireAdmin(userId: string, organizationId: string) {
    const membership = await this.prisma.organizationMember.findUnique({ where: { organizationId_userId: { organizationId, userId } } });
    const admins: OrganizationRole[] = ["OWNER", "ADMIN"];
    if (!membership || !admins.includes(membership.role)) throw new ForbiddenException("You do not have permission to manage photographers.");
  }

  private async requireEventAccess(userId: string, organizationId: string, eventId: string) {
    const membership = await this.prisma.organizationMember.findUnique({ where: { organizationId_userId: { organizationId, userId } } });
    if (!membership) throw new ForbiddenException("You do not have access to this organization.");
    const event = await this.prisma.event.findFirst({ where: { id: eventId, organizationId } });
    if (!event) throw new NotFoundException("Event not found.");
  }

  private async requireEvent(organizationId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({ where: { id: eventId, organizationId } });
    if (!event) throw new NotFoundException("Event not found.");
  }
  private isUniqueConstraint(error: unknown): error is { code: string } { return typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002"; }
}
