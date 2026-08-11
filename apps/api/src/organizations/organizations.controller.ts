import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAccessGuard } from "../auth/jwt-access.guard";
import { CreateEventDto, UpdateEventStatusDto } from "./dto/create-event.dto";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { OrganizationsService } from "./organizations.service";

type AuthenticatedRequest = Request & { user: { sub: string } };

@Controller("organizations")
@UseGuards(JwtAccessGuard)
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateOrganizationDto) {
    return this.organizations.create(request.user.sub, dto);
  }

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.organizations.listForUser(request.user.sub);
  }

  @Post(":organizationId/events")
  createEvent(@Req() request: AuthenticatedRequest, @Param("organizationId") organizationId: string, @Body() dto: CreateEventDto) {
    return this.organizations.createEvent(request.user.sub, organizationId, dto);
  }

  @Get(":organizationId/events")
  listEvents(@Req() request: AuthenticatedRequest, @Param("organizationId") organizationId: string) {
    return this.organizations.listEvents(request.user.sub, organizationId);
  }

  @Patch(":organizationId/events/:eventId/status")
  updateEventStatus(@Req() request: AuthenticatedRequest, @Param("organizationId") organizationId: string, @Param("eventId") eventId: string, @Body() dto: UpdateEventStatusDto) {
    return this.organizations.updateEventStatus(request.user.sub, organizationId, eventId, dto);
  }
}
