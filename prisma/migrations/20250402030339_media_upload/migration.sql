-- CreateTable
CREATE TABLE "Media" (
    "name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "data" BYTEA NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("name")
);
