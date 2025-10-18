import axios, { AxiosResponse, AxiosError, AxiosRequestConfig } from "axios";
import { toast } from "react-hot-toast";
import {
  ApiResponse,
  LoginPayload,
  RegisterPayload,
  AuthResponse,
  Listing,
  BookingPayload,
  Booking,
  User,
  BookingStatus,
  Review,
  InitiatePaymentPayload,
  PaymentResponse,
  OnlineStatus,
  SendMessagePayload,
  PaginatedMessages,
  AskExpertPayload,
  AskExpertResponse,
  GenerateDescriptionPayload,
  GenerateDescriptionResponse,
  UnreadCount,
} from "../types";

// ----------------- Types -----------------
export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  silenceToast?: boolean;
}

interface BackendErrorResponse {
  message?: string;
}

// ----------------- Axios Instance -----------------
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// ----------------- Centralized Error Handling -----------------
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
            backendErrorMsg || "Bad Request. Please check your input.";
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

// ----------------- AUTH API -----------------
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

// ----------------- Listings -----------------
export const getListings = async (): Promise<Listing[]> => {
  const res = await api.get<Listing[]>("/api/listings");
  return res.data;
};

export const getMyListings = async (): Promise<Listing[]> => {
  const res: AxiosResponse<Listing[]> = await api.get(
    "/api/listings/my-listings"
  );
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
    { headers: { "Content-Type": "multipart/form-data" } }
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
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.data;
};

export const deleteListing = async (id: string): Promise<void> => {
  await api.delete(`/api/listings/${id}`);
};

// ----------------- Bookings -----------------
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

export const getMyBookings = async (): Promise<Booking[]> => {
  const res = await api.get<Booking[]>("/api/bookings/my-bookings");
  return res.data;
};

export const updateBookingStatus = async (
  bookingId: string,
  status: BookingStatus
): Promise<Booking> => {
  const res: AxiosResponse<Booking> = await api.patch(
    `/api/bookings/${bookingId}/status`,
    { status }
  );
  return res.data;
};

// ----------------- Reviews -----------------
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

export const getListingReviews = async (
  listingId: string
): Promise<Review[]> => {
  const res: AxiosResponse<ApiResponse<Review[]>> = await api.get(
    `/api/listings/${listingId}/reviews`
  );
  return res.data.data;
};

// ----------------- Payments -----------------
export const initiatePayment = async (
  payload: InitiatePaymentPayload
): Promise<PaymentResponse> => {
  const { data } = await api.post<PaymentResponse>(
    "/api/payments/initiate",
    payload
  );
  return data;
};

// ----------------- Users -----------------
export const getUserProfile = async (userId: string): Promise<User> => {
  const res: AxiosResponse<ApiResponse<User>> = await api.get(
    `/api/users/${userId}`
  );
  return res.data.data;
};

export const getUserOnlineStatus = async (
  userId: string
): Promise<OnlineStatus> => {
  const res: AxiosResponse<OnlineStatus> = await api.get(
    `/api/bookings/online-status/${userId}`
  );
  return res.data;
};

// ----------------- Messaging -----------------
export const getBookingMessages = async (
  bookingId: string,
  page = 1,
  limit = 20
): Promise<PaginatedMessages> => {
  const res: AxiosResponse<PaginatedMessages> = await api.get(
    `/api/bookings/${bookingId}/messages`,
    { params: { page, limit } } as CustomAxiosRequestConfig
  );
  return res.data;
};

export const sendMessageHttp = async (
  payload: SendMessagePayload & { tempId: string }
): Promise<{ success: boolean; tempId: string }> => {
  const res: AxiosResponse<{ success: boolean; tempId: string }> =
    await api.post(`/api/bookings/${payload.bookingId}/messages`, payload);
  return res.data;
};

export const getUnreadMessages = async (
  bookingId: string
): Promise<{ bookingId: string; unreadCount: number }> => {
  const res: AxiosResponse<{ bookingId: string; unreadCount: number }> =
    await api.get(`/api/bookings/${bookingId}/messages/unread`);
  return res.data;
};

export const getUnreadMessagesBatch = async (
  bookingIds: string[]
): Promise<UnreadCount[]> => {
  const res: AxiosResponse<UnreadCount[]> = await api.post(
    `/api/bookings/unread/batch`,
    { bookingIds },
    { withCredentials: true }
  );
  return res.data;
};

export const markMessagesAsRead = async (
  bookingId: string
): Promise<{ success: boolean }> => {
  const res: AxiosResponse<{ success: boolean }> = await api.patch(
    `/api/bookings/${bookingId}/messages/read`
  );
  return res.data;
};

// ----------------- AI / Generative -----------------
export const askUgandaRentalExpert = async (
  payload: AskExpertPayload
): Promise<AskExpertResponse> => {
  const res: AxiosResponse<AskExpertResponse> = await api.post(
    "/api/ai/ask-expert",
    payload,
    { silenceToast: true } as CustomAxiosRequestConfig
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
