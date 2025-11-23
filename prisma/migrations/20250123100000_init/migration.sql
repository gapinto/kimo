-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_configs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "profile" TEXT NOT NULL,
    "car_value" DECIMAL(10,2),
    "fuel_consumption" DOUBLE PRECISION NOT NULL,
    "avg_fuel_price" DECIMAL(10,2) NOT NULL,
    "avg_km_per_day" DOUBLE PRECISION NOT NULL,
    "work_days_per_week" INTEGER NOT NULL,
    "financing_balance" DECIMAL(10,2),
    "financing_monthly_payment" DECIMAL(10,2),
    "financing_remaining_months" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "earnings" DECIMAL(10,2) NOT NULL,
    "km" DOUBLE PRECISION NOT NULL,
    "time_online_minutes" INTEGER NOT NULL DEFAULT 0,
    "is_personal_use" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixed_costs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "frequency" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixed_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_summaries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_earnings" DECIMAL(10,2) NOT NULL,
    "total_expenses" DECIMAL(10,2) NOT NULL,
    "profit" DECIMAL(10,2) NOT NULL,
    "km" DOUBLE PRECISION NOT NULL,
    "fuel_expenses" DECIMAL(10,2) NOT NULL,
    "other_expenses" DECIMAL(10,2) NOT NULL,
    "cost_per_km" DECIMAL(10,2),
    "trips_count" INTEGER NOT NULL DEFAULT 0,
    "weekly_goal" DECIMAL(10,2),
    "weekly_goal_status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "driver_configs_user_id_key" ON "driver_configs"("user_id");

-- CreateIndex
CREATE INDEX "driver_configs_user_id_idx" ON "driver_configs"("user_id");

-- CreateIndex
CREATE INDEX "trips_user_id_idx" ON "trips"("user_id");

-- CreateIndex
CREATE INDEX "trips_user_id_date_idx" ON "trips"("user_id", "date");

-- CreateIndex
CREATE INDEX "trips_date_idx" ON "trips"("date");

-- CreateIndex
CREATE INDEX "expenses_user_id_idx" ON "expenses"("user_id");

-- CreateIndex
CREATE INDEX "expenses_user_id_date_idx" ON "expenses"("user_id", "date");

-- CreateIndex
CREATE INDEX "expenses_date_idx" ON "expenses"("date");

-- CreateIndex
CREATE INDEX "fixed_costs_user_id_idx" ON "fixed_costs"("user_id");

-- CreateIndex
CREATE INDEX "fixed_costs_user_id_is_active_idx" ON "fixed_costs"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "daily_summaries_user_id_date_key" ON "daily_summaries"("user_id", "date");

-- CreateIndex
CREATE INDEX "daily_summaries_user_id_idx" ON "daily_summaries"("user_id");

-- CreateIndex
CREATE INDEX "daily_summaries_user_id_date_idx" ON "daily_summaries"("user_id", "date");

-- CreateIndex
CREATE INDEX "daily_summaries_date_idx" ON "daily_summaries"("date");

-- AddForeignKey
ALTER TABLE "driver_configs" ADD CONSTRAINT "driver_configs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_costs" ADD CONSTRAINT "fixed_costs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_summaries" ADD CONSTRAINT "daily_summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

