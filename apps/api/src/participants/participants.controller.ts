import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAccessGuard } from "../auth/jwt-access.guard";
import { CreateParticipantDto } from "./dto/create-participant.dto";
import { ParticipantsService } from "./participants.service";

type AuthenticatedRequest = Request & { user: { sub: string } };

@Controller("organizations/:organizationId/events/:eventId/participants")
@UseGuards(JwtAccessGuard)
export class ParticipantsController {
  constructor(private readonly participants: ParticipantsService) {}

  @Post()
  create(@Req() request: AuthenticatedRequest, @Param("organizationId") organizationId: string, @Param("eventId") eventId: string, @Body() dto: CreateParticipantDto) {
    return this.participants.create(request.user.sub, organizationId, eventId, dto);
  }

  @Get()
  list(@Req() request: AuthenticatedRequest, @Param("organizationId") organizationId: string, @Param("eventId") eventId: string) {
    return this.participants.list(request.user.sub, organizationId, eventId);
  }

  @Post("generate-missing-qr")
  generateMissing(@Req() request: AuthenticatedRequest, @Param("organizationId") organizationId: string, @Param("eventId") eventId: string) {
    return this.participants.generateMissingQrCodes(request.user.sub, organizationId, eventId);
  }

  @Post(":participantId/regenerate-qr")
  regenerate(@Req() request: AuthenticatedRequest, @Param("organizationId") organizationId: string, @Param("eventId") eventId: string, @Param("participantId") participantId: string) {
    return this.participants.regenerateQrCode(request.user.sub, organizationId, eventId, participantId);
  }
}
