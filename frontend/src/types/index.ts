// ----------------- GENERIC API RESPONSE -----------------
export interface ApiResponse<T> {
  message?: string;
  data: T;
}

// ----------------- AUTH -----------------
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role: "RENTER" | "OWNER";
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface User {
  id: string;
  name?: string | null;
  email: string;
  token?: string;
  profilePicture?: string | null;
  role?: "RENTER" | "OWNER" | "ADMIN";
  lastSeen?: string | null; // ISO string
}

// ----------------- LISTINGS -----------------
export interface Listing {
  id: string;
  title: string;
  description: string;
  pricePerDay: number;
  location: string;
  images: string[];
  reviews?: Review[];
  category?: string | null;
  status?: "PENDING" | "APPROVED" | "SUSPENDED";
  owner?: User | null;
  alreadyBooked?: boolean;
  bookings?: Booking[];
  rating?: number;
  createdAt: string;
}

// Updated payload to support editing removed images
export interface CreateListingPayload {
  title: string;
  description: string;
  pricePerDay: number;
  location: string;
  images: File[];
  category?: string;
  removedImages?: string[]; // Optional for edit
}

// ----------------- BOOKINGS -----------------
export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELED" | "COMPLETED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED";

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
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  transactionId?: string | null;
  listing?: {
    id: string;
    title: string;
    location: string;
    images: string[];
    owner?: User | null;
  };
  renter?: User | null;
  owner?: User | null;
  messages?: Message[];
  totalAmount?: number;
  createdAt: string;
}

export interface BookingDetails {
  id: string;
  listingId: string;
  renterId: string;
  renterName: string;
  renterProfile?: string | null;
  ownerId: string;
  ownerName: string;
  ownerProfile?: string | null;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  totalPrice: number;
}

// ----------------- MESSAGES -----------------
export interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  read: boolean;
  readAt?: string | null;
  sender?: {
    id: string;
    name?: string | null;
    profilePicture?: string | null;
  };
  receiver?: {
    id: string;
    name?: string | null;
    profilePicture?: string | null;
  };
  tempId?: string; // For optimistic UI updates
}

export interface PaginatedMessages {
  messages: Message[];
  hasMore: boolean;
  nextPage: number;
}

export interface SendMessagePayload {
  bookingId: string;
  senderId: string;
  content: string;
  receiverId?: string;
  tempId: string;
}

// ----------------- REVIEWS -----------------
export interface Review {
  id: string;
  listingId: string;
  authorId: string;
  author: User;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

// ----------------- PAYMENTS -----------------
export interface InitiatePaymentPayload {
  bookingId: string;
  amount: number;
  currency: string;
  full_name: string;
  email: string;
  phone_number: string;
}

export interface PaymentRequest {
  bookingId: string;
  full_name: string;
  email: string;
  phone_number: string;
}

export interface PaymentResponse {
  message: string;
  data?: {
    link?: string;
  };
}

// ----------------- CHAT / SOCKET TYPES -----------------
export interface OnlineStatus {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface UnreadCount {
  bookingId: string;
  unreadCount: number;
}

// ----------------- AI / GENERATIVE TYPES -----------------
export interface AskExpertPayload {
  question: string;
  listingId?: string;
}

export interface AskExpertResponse {
  success: boolean;
  question: string;
  answer: string;
  source: string;
  contextUsed: boolean;
}

export interface GenerateDescriptionPayload {
  basicDetails: string;
}

export interface GenerateDescriptionResponse {
  success: boolean;
  generatedDescription: string;
}

export interface MessageWithDelivered extends Message {
  delivered?: boolean;
}
