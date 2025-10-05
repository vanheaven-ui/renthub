// frontend/lib/api.ts
import axios, { AxiosResponse, AxiosError, AxiosRequestConfig } from "axios";
import { toast } from "react-hot-toast";
import { io as ClientIO, Socket } from "socket.io-client";
import {
  ApiResponse,
  LoginPayload,
  RegisterPayload,
  AuthResponse,
  Listing,
  BookingPayload,
  Booking,
  User,
  Message,
  SendMessagePayload,
  BookingStatus,
  Review,
  InitiatePaymentPayload,
  PaginatedMessages,
  PaymentResponse,
  UnreadCount,
  OnlineStatus,
  AskExpertPayload,
  AskExpertResponse,
  GenerateDescriptionPayload,
  GenerateDescriptionResponse,
} from "../types";

// Types for custom axios config and backend errors
interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  silenceToast?: boolean;
}

interface BackendErrorResponse {
  message?: string;
}

// Axios instance
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Centralized error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const config = error.config as CustomAxiosRequestConfig;
    const shouldShowToast = !config?.silenceToast;
    let errorMessage = "An unexpected error occurred. Please try again.";

    if (error.code === "ERR_NETWORK") {
      errorMessage = "Network error. Please check your internet connection.";
      if (shouldShowToast) toast.error(errorMessage);
    } else if (error.response) {
      const status = error.response.status;
      const backendErrorMsg = (error.response.data as BackendErrorResponse)
        ?.message;

      switch (status) {
        case 400:
          errorMessage =
            backendErrorMsg || "Bad request. Please check your input.";
          break;
        case 401:
          errorMessage = "Your session has expired. Please log in again.";
          if (shouldShowToast) toast.error(errorMessage);
          break;
        case 404:
          errorMessage = backendErrorMsg || "Resource not found.";
          break;
        case 500:
          errorMessage =
            backendErrorMsg || "Server error. Please try again later.";
          break;
        default:
          errorMessage = backendErrorMsg || `Error: ${error.message}`;
      }

      if (shouldShowToast && status !== 404) toast.error(errorMessage);
    }

    console.error("API call failed:", errorMessage);
    return Promise.reject(new Error(errorMessage));
  }
);

// Auth APIs
export const getMe = async (): Promise<User> => {
  const res: AxiosResponse<ApiResponse<User>> = await api.get("/api/auth/me", {
    silenceToast: true,
  } as CustomAxiosRequestConfig);
  return res.data.data;
};

export const loginUser = async (
  payload: LoginPayload
): Promise<AuthResponse> => {
  const res: AxiosResponse<ApiResponse<AuthResponse>> = await api.post(
    "/api/auth/login",
    payload
  );
  return res.data.data;
};

export const registerUser = async (
  payload: RegisterPayload
): Promise<AuthResponse> => {
  const res: AxiosResponse<ApiResponse<AuthResponse>> = await api.post(
    "/api/auth/register",
    payload
  );
  return res.data.data;
};

export const logoutUser = async (): Promise<void> => {
  await api.post("/api/auth/logout");
};

// Socket instance for messaging
const socket: Socket = ClientIO(API_BASE, { withCredentials: true });

// Messaging APIs
export const sendMessageHttp = async (
  payload: SendMessagePayload & { tempId: string }
): Promise<Message & { tempId: string }> => {
  const { bookingId } = payload;
  const res: AxiosResponse<Message & { tempId: string }> = await api.post(
    `/api/bookings/${bookingId}/messages`,
    payload
  );
  return res.data;
};

export const sendMessageSocket = (
  message: SendMessagePayload & { tempId: string }
) => {
  socket.emit("sendMessage", message);
};

export const onNewMessage = (
  bookingId: string,
  callback: (message: Message & { tempId?: string }) => void
) => {
  const handler = (message: Message & { tempId?: string }) => {
    if (message.bookingId === bookingId) callback(message);
  };
  socket.on("newMessage", handler);
  return () => socket.off("newMessage", handler);
};

export const joinBookingRoom = (bookingId: string) => {
  socket.emit("joinRoom", { bookingId });
};

// Get messages for a booking (paginated)
export const getBookingMessages = async (
  bookingId: string,
  page = 1,
  limit = 20
): Promise<PaginatedMessages> => {
  const res: AxiosResponse<PaginatedMessages> = await api.get(
    `/api/bookings/${bookingId}/messages?page=${page}&limit=${limit}`
  );
  return res.data;
};

// Mark all messages in a booking as read
export const markMessagesAsRead = async (bookingId: string): Promise<void> => {
  await api.post(`/api/bookings/${bookingId}/messages/read`);
};

// Bookings API
export const getMyBookings = async (): Promise<Booking[]> => {
  const res = await api.get<Booking[]>("/api/bookings/my-bookings");
  return res.data;
};

export const createBooking = async (
  payload: BookingPayload
): Promise<Booking> => {
  const res: AxiosResponse<ApiResponse<Booking>> = await api.post(
    "/api/bookings",
    payload
  );
  return res.data.data;
};

export const getBookingById = async (bookingId: string): Promise<Booking> => {
  const res = await api.get<Booking>(`/api/bookings/${bookingId}`);
  return res.data;
};

// Listings API
export const getListings = async (): Promise<Listing[]> => {
  const res = await api.get<Listing[]>("/api/listings");
  return res.data;
};

export const getListingById = async (id: string): Promise<Listing> => {
  const res = await api.get<Listing>(`/api/listings/${id}`);
  return res.data;
};

export const createListing = async (formData: FormData): Promise<Listing> => {
  const { data } = await api.post<{ data: Listing }>(
    "/api/listings",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return data.data;
};

export const updateListing = async (
  id: string,
  formData: FormData
): Promise<Listing> => {
  const { data } = await api.patch<{ data: Listing }>(
    `/api/listings/${id}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return data.data;
};

// Reviews API
export const createReview = async (
  listingId: string,
  payload: { rating: number; comment?: string }
): Promise<Review> => {
  const res: AxiosResponse<ApiResponse<Review>> = await api.post(
    `/api/listings/${listingId}/reviews`,
    payload
  );
  return res.data.data;
};

// Payments API
export const initiatePayment = async (
  payload: InitiatePaymentPayload
): Promise<PaymentResponse> => {
  const { data } = await api.post<PaymentResponse>(
    "/api/payments/initiate",
    payload
  );
  return data;
};

// User Profile / Status
export const getUserProfile = async (userId: string): Promise<User> => {
  const res: AxiosResponse<ApiResponse<User>> = await api.get(
    `/api/users/${userId}`
  );
  return res.data.data;
};

export const getUserOnlineStatus = async (
  userId: string
): Promise<OnlineStatus> => {
  const res: AxiosResponse<ApiResponse<OnlineStatus>> = await api.get(
    `/api/users/${userId}/status`
  );
  return res.data.data;
};

// AI Endpoints
export const askUgandaRentalExpert = async (
  payload: AskExpertPayload
): Promise<AskExpertResponse> => {
  const res: AxiosResponse<AskExpertResponse> = await api.post(
    "/api/ai/ask-expert",
    payload,
    {
      silenceToast: true,
    } as CustomAxiosRequestConfig
  );
  return res.data;
};

export const generateListingDescription = async (
  payload: GenerateDescriptionPayload
): Promise<GenerateDescriptionResponse> => {
  const res: AxiosResponse<GenerateDescriptionResponse> = await api.post(
    "/api/ai/generate-description",
    payload,
    { silenceToast: true } as CustomAxiosRequestConfig
  );
  return res.data;
};
