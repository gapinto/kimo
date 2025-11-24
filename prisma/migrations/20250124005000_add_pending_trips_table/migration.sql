-- CreateTable
CREATE TABLE "pending_trips" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "earnings" DECIMAL(10,2) NOT NULL,
    "km" DOUBLE PRECISION NOT NULL,
    "fuel" DECIMAL(10,2),
    "estimated_duration" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "evaluated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "reminder_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_trips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pending_trips_user_id_idx" ON "pending_trips"("user_id");

-- CreateIndex
CREATE INDEX "pending_trips_user_id_status_idx" ON "pending_trips"("user_id", "status");

-- CreateIndex
CREATE INDEX "pending_trips_status_evaluated_at_idx" ON "pending_trips"("status", "evaluated_at");

-- AddForeignKey
ALTER TABLE "pending_trips" ADD CONSTRAINT "pending_trips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

