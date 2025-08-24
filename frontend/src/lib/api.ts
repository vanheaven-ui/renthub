import axios, { AxiosResponse } from "axios";
import {
  ApiResponse,
  LoginPayload,
  RegisterPayload,
  AuthResponse,
  Listing,
  CreateListingPayload,
} from "../types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  withCredentials: true,
});

export const loginUser = async (
  payload: LoginPayload
): Promise<AuthResponse> => {
  const response: AxiosResponse<ApiResponse<AuthResponse>> = await api.post(
    "/api/auth/login",
    payload
  );
  return response.data.data;
};

export const registerUser = async (
  payload: RegisterPayload
): Promise<AuthResponse> => {
  const response: AxiosResponse<ApiResponse<AuthResponse>> = await api.post(
    "/api/auth/register",
    payload
  );
  return response.data.data;
};

export const getListings = async (): Promise<Listing[]> => {
  const response = await api.get("/api/listings");
  return response.data;
};

export const createListing = async (payload: CreateListingPayload) => {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("description", payload.description);
  formData.append("pricePerDay", payload.pricePerDay.toString());
  formData.append("location", payload.location);

  payload.images.forEach((file) => {
    formData.append("images", file);
  });

  const response = await api.post("/api/listings", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
