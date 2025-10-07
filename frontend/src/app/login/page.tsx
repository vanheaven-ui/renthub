"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Field, Form, ErrorMessage } from "formik";
import { getMe, loginUser } from "@/lib/api";
import { LoginSchema } from "@/validation/auth";
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/solid";
import { useAuth } from "../context/AuthProvider";
import { LoginPayload } from "@/types";

const Login = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clean, type-safe submit handler
  const handleSubmit = async (values: LoginPayload) => {
    setError("");
    setIsSubmitting(true);

    try {
      // Authenticate user
      await loginUser(values);

      // Fetch authenticated user info
      const user = await getMe();

      // Update frontend auth state
      login(user);

      router.push("/");
    } catch (err) {
      console.error(err);
      setError("Failed to log in. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-4xl opacity-30 pointer-events-none" />

      {/* Back button */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white font-semibold rounded-full shadow-lg hover:scale-105 transform transition group z-50"
      >
        <ArrowLeftIcon className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
        Back to Listings
      </button>

      {/* Login form */}
      <div className="p-8 bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10">
        <h1 className="text-3xl font-bold mb-6 text-center text-purple-700">
          Login
        </h1>

        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={LoginSchema}
          onSubmit={handleSubmit}
        >
          <Form className="space-y-4">
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email:
              </label>
              <Field
                name="email"
                type="email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
              <ErrorMessage
                name="email"
                component="div"
                className="text-red-500 text-xs mt-1"
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">
                Password:
              </label>
              <div className="mt-1 relative flex items-center">
                <Field
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm pr-10"
                />
                <div
                  className="absolute right-3 cursor-pointer flex items-center justify-center h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
              <ErrorMessage
                name="password"
                component="div"
                className="text-red-500 text-xs mt-1"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white font-semibold rounded-full shadow-md hover:scale-105 transition transform disabled:opacity-50"
            >
              {isSubmitting ? "Logging in..." : "Log In"}
            </button>
          </Form>
        </Formik>

        {/* Register link */}
        <p className="mt-4 text-center text-gray-600">
          Don&apos;t have an account?
          <span
            onClick={() => router.push("/register")}
            className="text-purple-600 font-semibold cursor-pointer hover:underline ml-1"
          >
            Register
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
