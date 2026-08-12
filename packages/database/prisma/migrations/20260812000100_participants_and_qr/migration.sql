CREATE TYPE "ParticipantStatus" AS ENUM ('ACTIVE', 'CANCELLED');
CREATE TYPE "QrCodeStatus" AS ENUM ('ACTIVE', 'REVOKED');

CREATE TABLE "participants" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "event_id" UUID NOT NULL,
  "bib_number" VARCHAR(64) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "email" VARCHAR(320),
  "phone" VARCHAR(40),
  "status" "ParticipantStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "participants_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "participants_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "participants_event_id_bib_number_key" ON "participants"("event_id", "bib_number");
CREATE INDEX "participants_event_id_status_idx" ON "participants"("event_id", "status");

CREATE TABLE "participant_qr_codes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "participant_id" UUID NOT NULL,
  "token" VARCHAR(128) NOT NULL,
  "status" "QrCodeStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revoked_at" TIMESTAMPTZ(6),
  CONSTRAINT "participant_qr_codes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "participant_qr_codes_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "participant_qr_codes_token_key" ON "participant_qr_codes"("token");
CREATE INDEX "participant_qr_codes_participant_id_status_idx" ON "participant_qr_codes"("participant_id", "status");
