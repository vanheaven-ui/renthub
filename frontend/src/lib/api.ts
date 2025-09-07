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
} from "../types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  withCredentials: true,
});

// --- CENTRALIZED ERROR HANDLING MIDDLEWARE ---
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // This function will run for any response with a status code that falls outside the range of 2xx
    let errorMessage = "An unexpected error occurred. Please try again.";

    if (error.code === "ERR_NETWORK") {
      // Handles cases where the request never reaches the server (e.g., no internet connection)
      errorMessage = "Network error. Please check your internet connection.";
    } else if (error.response) {
      // The server responded with a status code outside the 2xx range
      const status = error.response.status;
      switch (status) {
        case 400:
          errorMessage = "Bad Request. Please check your input.";
          break;
        case 401:
          errorMessage = "Unauthorized. Please log in.";
          // You could also add a redirect to the login page here
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
    // You must return a rejected promise to propagate the error to the calling function
    return Promise.reject(new Error(errorMessage));
  }
);

// --- API FUNCTIONS ---

export const getMe = async (): Promise<User> => {
  const response: AxiosResponse<ApiResponse<User>> = await api.get(
    "/api/auth/me"
  );
  const user = response.data.data;
  // This line is a side effect and can be removed if you handle user state elsewhere
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
  // This line is a side effect and can be removed
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
