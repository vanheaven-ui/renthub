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
// Removed: import { convertListingToFormData } from "./formData";

// Interface to allow passing a custom option to silence the interceptor's toast
interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  silenceToast?: boolean;
}

// Interface for backend error responses to replace 'any'
interface BackendErrorResponse {
  message?: string;
}

// ----------------- AXIOS INSTANCE -----------------
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// --- CENTRALIZED ERROR HANDLING ---
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Check for the silenceToast flag on the original request config
    const config = error.config as CustomAxiosRequestConfig;
    const shouldShowToast = !config?.silenceToast;

    let errorMessage = "An unexpected error occurred. Please try again.";

    if (error.code === "ERR_NETWORK") {
      errorMessage = "Network error. Please check your internet connection.";
      if (shouldShowToast) {
        toast.error(errorMessage);
      }
    } else if (error.response) {
      const status = error.response.status;
      // Try to get a specific message from the backend response data (Typing 'as BackendErrorResponse' to resolve the 'any' error)
      const backendErrorMsg = (error.response.data as BackendErrorResponse)
        ?.message;

      switch (status) {
        case 400:
          errorMessage =
            backendErrorMsg || "Bad Request. Please check your input.";
          break;
        case 401:
          errorMessage = "Your session has expired. Please log in again.";
          localStorage.removeItem("user");
          // Always show toast for critical 401 and redirect
          toast.error(errorMessage);
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          // Reject immediately after handling the critical 401
          return Promise.reject(new Error(errorMessage));
        case 404:
          // 404s should typically be handled by the caller, so we suppress the global toast
          errorMessage = backendErrorMsg || "Resource not found.";
          break;
        case 500:
          errorMessage =
            backendErrorMsg || "Server error. Please try again later.";
          break;
        default:
          errorMessage = backendErrorMsg || `Error: ${error.message}`;
      }

      // Only show toast if the flag is NOT set to silence AND it's not a generic 404
      if (shouldShowToast && status !== 404) {
        toast.error(errorMessage);
      }
    }
    console.error("API call failed:", errorMessage);
    // Always reject the promise so the calling function can handle the error.
    return Promise.reject(new Error(errorMessage));
  }
);

// ----------------- MESSAGE APIs -----------------

/**
 * Sends a message via HTTP POST to save it to the database.
 * The server echoes the message (with real ID) via Socket.IO for confirmation.
 */
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

export const getBookingMessages = async (
  bookingId: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedMessages> => {
  const res: AxiosResponse<PaginatedMessages> = await api.get(
    `/api/bookings/${bookingId}/messages`,
    { params: { page, limit } }
  );
  return res.data;
};

export const markMessagesAsRead = async (bookingId: string): Promise<void> => {
  await api.patch(`/api/bookings/${bookingId}/messages/read`);
};

export const getUnreadMessages = async (
  bookingId: string
): Promise<{ unreadCount: number }> => {
  // Use silenceToast: true for a background check
  const res: AxiosResponse<{ unreadCount: number }> = await api.get(
    `/api/bookings/${bookingId}/messages/unread`,
    { silenceToast: true } as CustomAxiosRequestConfig
  );
  return res.data;
};

export const getUnreadMessagesBatch = async (
  bookingIds: string[]
): Promise<UnreadCount[]> => {
  if (!bookingIds || !Array.isArray(bookingIds)) return [];
  // Use silenceToast: true for a background check
  const res = await api.post<UnreadCount[]>(
    "/api/bookings/unread/batch",
    { bookingIds },
    { silenceToast: true } as CustomAxiosRequestConfig
  );
  return res.data;
};

export const getUserOnlineStatus = async (
  userId: string
): Promise<OnlineStatus> => {
  // Use silenceToast: true for a background check
  const res: AxiosResponse<OnlineStatus> = await api.get(
    `/api/bookings/online-status/${userId}`,
    { silenceToast: true } as CustomAxiosRequestConfig
  );
  return res.data;
};

export const getUserProfile = async (userId: string): Promise<User> => {
  const res: AxiosResponse<User> = await api.get(`/api/users/${userId}`);
  return res.data;
};

// ----------------- SOCKET HELPERS -----------------
const socket: Socket = ClientIO(API_BASE, { withCredentials: true });

/**
 * Sends a message object via the Socket.IO connection.
 * @param message The message payload to send, including a client-side tempId.
 */
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
    if (message.bookingId === bookingId) {
      callback(message);
    }
  };

  socket.on("newMessage", handler);

  return () => socket.off("newMessage", handler);
};

export const onUserTyping = (
  bookingId: string,
  userId: string,
  callback: () => void
) => {
  const handler = (data: { bookingId: string; userId: string }) => {
    if (data.bookingId === bookingId && data.userId === userId) {
      callback();
    }
  };

  socket.on("userTyping", handler);

  return () => socket.off("userTyping", handler);
};

export const onUserStoppedTyping = (
  bookingId: string,
  userId: string,
  callback: () => void
) => {
  const handler = (data: { bookingId: string; userId: string }) => {
    if (data.bookingId === bookingId && data.userId === userId) {
      callback();
    }
  };

  socket.on("userStoppedTyping", handler);

  return () => socket.off("userStoppedTyping", handler);
};

export const onUserOnlineStatus = (
  userId: string,
  callback: (isOnline: boolean) => void
) => {
  const handler = (data: { userId: string; isOnline: boolean }) => {
    if (data.userId === userId) {
      callback(data.isOnline);
    }
  };

  socket.on("userOnlineStatus", handler);

  return () => socket.off("userOnlineStatus", handler);
};

export const onUpdateUnreadCount = (
  bookingId: string,
  callback: (data: { bookingId: string; count: number }) => void
) => {
  const handler = (data: { bookingId: string; count: number }) => {
    if (data.bookingId === bookingId) {
      callback(data);
    }
  };

  socket.on("updateUnreadCount", handler);

  return () => socket.off("updateUnreadCount", handler);
};

export const onMessageRead = (
  bookingId: string,
  callback: (data: {
    messageId: string;
    bookingId: string;
    readAt: string;
  }) => void
) => {
  const handler = (data: {
    messageId: string;
    bookingId: string;
    readAt: string;
  }) => {
    if (data.bookingId === bookingId) {
      callback(data);
    }
  };

  socket.on("messageRead", handler);

  // Return unsubscribe function
  return () => {
    socket.off("messageRead", handler);
  };
};

export const joinBookingRoom = (bookingId: string) => {
  socket.emit("joinRoom", { bookingId });
};

// ----------------- AUTH -----------------
export const getMe = async (): Promise<User> => {
  // Use silenceToast: true, as a failure here often means the user is just logged out,
  // which will be handled by the 401 or the calling component without needing a toast.
  const res: AxiosResponse<ApiResponse<User>> = await api.get("/api/auth/me", {
    silenceToast: true,
  } as CustomAxiosRequestConfig);
  const user = res.data.data;
  localStorage.setItem("user", JSON.stringify(user));
  return user;
};

export const loginUser = async (payload: LoginPayload): Promise<string> => {
  const res: AxiosResponse<ApiResponse<null>> = await api.post(
    "/api/auth/login",
    payload
  );
  return res.data.message ?? "Login successful";
};

export const registerUser = async (
  payload: RegisterPayload
): Promise<AuthResponse> => {
  const res: AxiosResponse<ApiResponse<AuthResponse>> = await api.post(
    "/api/auth/register",
    payload
  );
  localStorage.setItem("user", JSON.stringify(res.data.data.user));
  return res.data.data;
};

export const logoutUser = async (): Promise<void> => {
  await api.post("/api/auth/logout");
};

// ----------------- LISTINGS -----------------
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
  console.log("Updating listing with ID:", id);
  const { data } = await api.patch<{ data: Listing }>(
    `/api/listings/${id}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return data.data;
};

export const getListingById = async (id: string): Promise<Listing> => {
  const res = await api.get<Listing>(`/api/listings/${id}`);
  return res.data;
};

export const deleteListing = async (id: string): Promise<void> => {
  await api.delete(`/api/listings/${id}`);
};

// ----------------- BOOKINGS -----------------
export const createBooking = async (
  payload: BookingPayload
): Promise<Booking> => {
  const res: AxiosResponse<ApiResponse<Booking>> = await api.post(
    "/api/bookings",
    payload
  );
  return res.data.data;
};

export const getMyBookings = async (): Promise<Booking[]> => {
  const res = await api.get<Booking[]>("/api/bookings/my-bookings");
  return res.data;
};

export const getBookingById = async (bookingId: string): Promise<Booking> => {
  const res = await api.get<Booking>(`/api/bookings/${bookingId}`);

  return res.data;
};

export const updateBookingStatus = async (
  bookingId: string,
  status: BookingStatus
): Promise<Booking> => {
  const res = await api.patch<Booking>(`/api/bookings/${bookingId}/status`, {
    status,
  });
  return res.data;
};

// ----------------- REVIEWS -----------------
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

// ----------------- PAYMENTS -----------------
export async function initiatePayment(
  payload: InitiatePaymentPayload
): Promise<PaymentResponse> {
  const { data } = await api.post<PaymentResponse>(
    "/api/payments/initiate",
    payload
  );
  return data;
}

// ------------------------------------------
// 🌟 NEW: AI Hubspot (Uganda Rental Expert) 🌟
// ------------------------------------------

/**
 * Sends a user question to the AI expert, optionally including context
 * about a specific listing for tailored advice.
 *
 * Endpoint: POST /api/ai/ask-expert
 */
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

/**
 * Generates a full, professional listing description based on basic input details.
 * This is a unique feature for listing owners on the P2P app.
 *
 * Endpoint: POST /api/ai/generate-description
 */
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
