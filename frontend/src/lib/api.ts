import axios, { AxiosResponse, AxiosError } from "axios";
import {
  ApiResponse,
  LoginPayload,
  RegisterPayload,
  AuthResponse,
  Listing,
  CreateListingPayload,
  BookingPayload,
  Booking,
  User,
  Message,
  SendMessagePayload,
} from "../types";
import socket from "./socket";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  withCredentials: true,
});

// --- CENTRALIZED ERROR HANDLING MIDDLEWARE ---
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    let errorMessage = "An unexpected error occurred. Please try again.";

    if (error.code === "ERR_NETWORK") {
      errorMessage = "Network error. Please check your internet connection.";
    } else if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 400:
          errorMessage = "Bad Request. Please check your input.";
          break;
        case 401:
          errorMessage = "Unauthorized. Please log in.";
          break;
        case 404:
          errorMessage = "Resource not found.";
          break;
        case 500:
          errorMessage = "Server error. Please try again later.";
          break;
        default:
          errorMessage = `Error: ${error.message}`;
          break;
      }
    }

    console.error("API call failed:", errorMessage);
    return Promise.reject(new Error(errorMessage));
  }
);

// --- AUTH ---
export const getMe = async (): Promise<User> => {
  const response: AxiosResponse<ApiResponse<User>> = await api.get(
    "/api/auth/me"
  );
  const user = response.data.data;
  localStorage.setItem("user", JSON.stringify(user));
  return user;
};

export const loginUser = async (payload: LoginPayload): Promise<string> => {
  const response = await api.post("/api/auth/login", payload);
  return response.data.message;
};

export const registerUser = async (
  payload: RegisterPayload
): Promise<AuthResponse> => {
  const response: AxiosResponse<ApiResponse<AuthResponse>> = await api.post(
    "/api/auth/register",
    payload
  );
  localStorage.setItem("user", JSON.stringify(response.data.user));
  return response.data.data;
};

export const logoutUser = async (): Promise<void> => {
  await api.post("/api/auth/logout");
};

// --- LISTINGS ---
export const getListings = async (): Promise<Listing[]> => {
  const response = await api.get("/api/listings");
  return response.data;
};

export const createListing = async (
  payload: CreateListingPayload
): Promise<Listing> => {
  const formData = new FormData();

  formData.append("title", payload.title);
  formData.append("description", payload.description);
  formData.append("pricePerDay", payload.pricePerDay.toString());
  formData.append("location", payload.location);
  if (payload.category) {
    formData.append("category", payload.category);
  }

  payload.images.forEach((file) => {
    formData.append("images", file);
  });

  const response = await api.post("/api/listings", formData);

  return response.data;
};

export const getListingById = async (id: string): Promise<Listing> => {
  const response = await api.get(`/api/listings/${id}`);
  return response.data as Listing;
};

export const updateListing = async (
  id: string,
  payload: any
): Promise<Listing> => {
  const response = await api.put(`/api/listings/${id}`, payload);
  return response.data.data;
};

export const deleteListing = async (id: string) => {
  await api.delete(`/api/listings/${id}`);
};

// --- BOOKINGS ---
export const createBooking = async (
  payload: BookingPayload
): Promise<Booking> => {
  const response = await api.post("/api/bookings", payload);
  return response.data.data;
};

export const getMyBookings = async (): Promise<Booking[]> => {
  const response = await api.get("/api/bookings/my-bookings");
  return response.data;
};

// Fetch booking for current user + listing
export const getBookingByListing = async (
  listingId: string,
  userId: string
) => {
  const res = await api.get(`/api/bookings/by-listing/${listingId}`, {
    params: { userId },
  });
  return res.data; // booking object
};

// Fetch unread messages count for a booking
export const getUnreadMessages = async (bookingId: string) => {
  const res = await api.get(`/api/messages/${bookingId}/unread`);
  return res.data; // { unreadCount: number }
};

// Fetch messages for a booking
export const getBookingMessages = async (bookingId: string) => {
  const res = await api.get(`/api/messages/${bookingId}`);
  return res.data; // array of messages
};

// Send a message
export const sendMessage = async (
  bookingId: string,
  receiverId: string,
  content: string
) => {
  const res = await api.post(`/api/messages`, {
    bookingId,
    receiverId,
    content,
  });
  return res.data; // new message object
};

// Mark messages as read
export const markMessagesAsRead = async (bookingId: string) => {
  const res = await api.patch(`/api/messages/${bookingId}/read`);
  return res.data;
};

// Join a booking room
export const joinBookingRoom = (bookingId: string) => {
  socket.emit("joinBookingRoom", bookingId);
};

// Send a message via socket
export const sendMessageSocket = (payload: SendMessagePayload) => {
  socket.emit("sendMessage", payload);
};

export const getUnreadMessagesBatch = async (bookingIds: string[]) => {
  const res = await api.post("/api/messages/unread/batch", { bookingIds });
  return res.data; // [{ bookingId: string, unreadCount: number }]
};

// Function to get a user's online status
export const getUserOnlineStatus = async (userId: string) => {
  const response = await api.get(`/api/messages/online-status/${userId}`);
  return response.data.isOnline;
};
