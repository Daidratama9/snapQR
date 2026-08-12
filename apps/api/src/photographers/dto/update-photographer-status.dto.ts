import { IsIn } from "class-validator";

export class UpdatePhotographerStatusDto {
  @IsIn(["ACTIVE", "INACTIVE"])
  status!: "ACTIVE" | "INACTIVE";
}
