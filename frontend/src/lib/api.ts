import axios, { AxiosResponse } from "axios";
import {
  ApiResponse,
  LoginPayload,
  RegisterPayload,
  AuthResponse,
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
