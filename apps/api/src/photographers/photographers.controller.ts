import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAccessGuard } from "../auth/jwt-access.guard";
import { CreatePhotographerDto } from "./dto/create-photographer.dto";
import { UpdatePhotographerStatusDto } from "./dto/update-photographer-status.dto";
import { PhotographersService } from "./photographers.service";

type AuthenticatedRequest = Request & { user: { sub: string } };

@Controller("organizations/:organizationId/events/:eventId/photographers")
@UseGuards(JwtAccessGuard)
export class PhotographersController {
  constructor(private readonly photographers: PhotographersService) {}

  @Post()
  create(@Req() request: AuthenticatedRequest, @Param("organizationId") organizationId: string, @Param("eventId") eventId: string, @Body() dto: CreatePhotographerDto) {
    return this.photographers.create(request.user.sub, organizationId, eventId, dto);
  }

  @Get()
  list(@Req() request: AuthenticatedRequest, @Param("organizationId") organizationId: string, @Param("eventId") eventId: string) {
    return this.photographers.list(request.user.sub, organizationId, eventId);
  }

  @Patch(":assignmentId/status")
  updateStatus(@Req() request: AuthenticatedRequest, @Param("organizationId") organizationId: string, @Param("eventId") eventId: string, @Param("assignmentId") assignmentId: string, @Body() dto: UpdatePhotographerStatusDto) {
    return this.photographers.updateStatus(request.user.sub, organizationId, eventId, assignmentId, dto);
  }
}
