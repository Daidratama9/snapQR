import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import Joi from "joi";
import { AuthModule } from "./auth/auth.module";
import { HealthController } from "./health.controller";
import { PrismaService } from "./prisma.service";
import { OrganizationsModule } from "./organizations/organizations.module";
import { ParticipantsModule } from "./participants/participants.module";
import { PhotographersModule } from "./photographers/photographers.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
        PORT: Joi.number().port().default(4000),
        WEB_ORIGIN: Joi.string().uri().required(),
        DATABASE_URL: Joi.string().required(),
        JWT_ACCESS_SECRET: Joi.string().min(32).required(),
        JWT_REFRESH_SECRET: Joi.string().min(32).required(),
        ACCESS_TOKEN_TTL: Joi.string().default("15m"),
        REFRESH_TOKEN_TTL: Joi.string().default("7d"),
        PUBLIC_APP_URL: Joi.string().uri().default("http://localhost:3000"),
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
    AuthModule,
    OrganizationsModule,
    ParticipantsModule,
    PhotographersModule,
  ],
  controllers: [HealthController],
  providers: [PrismaService],
})
export class AppModule {}
