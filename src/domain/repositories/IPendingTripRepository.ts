import { PendingTrip, PendingTripStatus } from '../entities/PendingTrip';

export interface IPendingTripRepository {
  save(pendingTrip: PendingTrip): Promise<void>;
  update(pendingTrip: PendingTrip): Promise<void>;
  findById(id: string): Promise<PendingTrip | null>;
  findLatestPendingByUserId(userId: string): Promise<PendingTrip | null>;
  findPendingByUserId(userId: string): Promise<PendingTrip[]>;
  findPendingForReminders(): Promise<PendingTrip[]>;
  deleteById(id: string): Promise<void>;
  deleteOldCompleted(daysOld: number): Promise<number>;
}

