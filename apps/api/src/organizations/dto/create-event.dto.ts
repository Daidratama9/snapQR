import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class CreateEventDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  eventType?: string;

  @IsDateString()
  startsAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  retentionDays?: number;
}

export class UpdateEventStatusDto {
  @IsIn(["DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"])
  status!: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
}
