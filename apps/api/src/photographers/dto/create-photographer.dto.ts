import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class CreatePhotographerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  displayName!: string;

  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(12)
  password!: string;
}
