export interface User {
  id: string;
  email: string;
  password?: string; // Optional for safety
  name?: string;
  profilePicture?: string;
  role?: Role;
}

export enum Role {
  RENTER = "RENTER",
  OWNER = "OWNER",
  ADMIN = "ADMIN",
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  data: T;
  user: T;
  message: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export enum ListingStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  SUSPENDED = "SUSPENDED",
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  pricePerDay: number;
  location: string;
  category: string;
  images: string[];
  status: ListingStatus;
  ownerId: string;
}

export interface CreateListingPayload {
  title: string;
  description: string;
  pricePerDay: number;
  location: string;
  images: File[];
}

export enum BookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  REJECTED = "REJECTED",
}

export interface BookingPayload {
  listingId: string;
  startDate: Date;
  endDate: Date;
}

export interface Booking {
  id: string;
  listingId: string;
  renterId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  totalPrice: number;
}
