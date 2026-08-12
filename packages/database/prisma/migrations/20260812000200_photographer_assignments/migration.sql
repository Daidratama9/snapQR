ALTER TYPE "OrganizationRole" ADD VALUE 'PHOTOGRAPHER';
CREATE TYPE "PhotographerAssignmentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

ALTER TABLE "users" ADD COLUMN "display_name" VARCHAR(160);

CREATE TABLE "event_photographers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "event_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "status" "PhotographerAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "event_photographers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "event_photographers_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "event_photographers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "event_photographers_event_id_user_id_key" ON "event_photographers"("event_id", "user_id");
CREATE INDEX "event_photographers_user_id_status_idx" ON "event_photographers"("user_id", "status");
