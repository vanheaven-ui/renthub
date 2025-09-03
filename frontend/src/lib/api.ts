import axios, { AxiosResponse } from "axios";
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
} from "../types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  withCredentials: true,
});

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

export const getListings = async (): Promise<Listing[]> => {
  const response = await api.get("/api/listings");
  return response.data;
};

export const createListing = async (
  payload: CreateListingPayload
): Promise<Listing> => {
  const response = await api.post("/api/listings", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getListingById = async (id: string): Promise<Listing> => {
  const response = await api.get(`/api/listings/${id}`);
  return response.data.data;
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
