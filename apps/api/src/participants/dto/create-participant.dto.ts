import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateParticipantDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  bibNumber!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;
}
