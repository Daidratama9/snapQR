import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { OrganizationRole } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { CreateEventDto, UpdateEventStatusDto } from "./dto/create-event.dto";
import { CreateOrganizationDto } from "./dto/create-organization.dto";

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateOrganizationDto) {
    return this.prisma.organization.create({
      data: { name: dto.name.trim(), slug: dto.slug.toLowerCase(), members: { create: { userId, role: "OWNER" } } },
      include: { members: true },
    });
  }

  listForUser(userId: string) {
    return this.prisma.organization.findMany({ where: { members: { some: { userId } } }, orderBy: { name: "asc" } });
  }

  async createEvent(userId: string, organizationId: string, dto: CreateEventDto) {
    await this.requireRole(userId, organizationId, ["OWNER", "ADMIN", "OPERATOR"]);
    return this.prisma.event.create({
      data: {
        organizationId,
        name: dto.name.trim(),
        eventType: dto.eventType ?? "GENERAL",
        startsAt: new Date(dto.startsAt),
        timezone: dto.timezone ?? "Asia/Jakarta",
        location: dto.location?.trim(),
        retentionDays: dto.retentionDays ?? 60,
      },
    });
  }

  async listEvents(userId: string, organizationId: string) {
    await this.requireRole(userId, organizationId, ["OWNER", "ADMIN", "OPERATOR"]);
    return this.prisma.event.findMany({ where: { organizationId }, orderBy: { startsAt: "desc" } });
  }

  async updateEventStatus(userId: string, organizationId: string, eventId: string, dto: UpdateEventStatusDto) {
    await this.requireRole(userId, organizationId, ["OWNER", "ADMIN"]);
    const event = await this.prisma.event.findFirst({ where: { id: eventId, organizationId } });
    if (!event) throw new NotFoundException("Event not found.");
    return this.prisma.event.update({ where: { id: eventId }, data: { status: dto.status } });
  }

  private async requireRole(userId: string, organizationId: string, roles: OrganizationRole[]) {
    const membership = await this.prisma.organizationMember.findUnique({ where: { organizationId_userId: { organizationId, userId } } });
    if (!membership || !roles.includes(membership.role)) throw new ForbiddenException("You do not have access to this organization.");
    return membership;
  }
}
