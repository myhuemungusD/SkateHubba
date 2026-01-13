import type { InsertUser, Spot, InsertSpot } from "@shared/schema";

export type StoredUser = InsertUser & {
  id: number;
  createdAt: Date;
};

export interface IStorage {
  getUser(id: number): Promise<StoredUser | undefined>;
  getUserByUsername(username: string): Promise<StoredUser | undefined>;
  createUser(user: InsertUser): Promise<StoredUser>;
  // Spot methods - createdBy is a string (UUID from auth)
  createSpot(spot: InsertSpot & { createdBy: string | null }): Promise<Spot>;
  getAllSpots(): Promise<Spot[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, StoredUser>;
  private spots: Map<number, Spot>;
  private currentUserId: number;
  private currentSpotId: number;

  constructor() {
    this.users = new Map();
    this.spots = new Map();
    this.currentUserId = 1;
    this.currentSpotId = 1;
  }

  async getUser(id: number): Promise<StoredUser | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<StoredUser | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<StoredUser> {
    const id = this.currentUserId++;
    const user: StoredUser = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async createSpot(insertSpot: InsertSpot & { createdBy: string | null }): Promise<Spot> {
    const id = this.currentSpotId++;
    const now = new Date();
    const spot: Spot = {
      id,
      name: insertSpot.name,
      description: insertSpot.description ?? null,
      spotType: insertSpot.spotType ?? 'street',
      tier: insertSpot.tier ?? 'bronze',
      lat: insertSpot.lat,
      lng: insertSpot.lng,
      address: insertSpot.address ?? null,
      city: insertSpot.city ?? null,
      state: insertSpot.state ?? null,
      country: insertSpot.country ?? 'USA',
      photoUrl: insertSpot.photoUrl,
      thumbnailUrl: null,
      createdBy: insertSpot.createdBy,
      createdAt: now,
      updatedAt: now,
      verified: false,
      isActive: true,
      checkInCount: 0,
      rating: 0,
      ratingCount: 0,
    };
    this.spots.set(id, spot);
    return spot;
  }

  async getAllSpots(): Promise<Spot[]> {
    return Array.from(this.spots.values());
  }
}

export const storage = new MemStorage();
