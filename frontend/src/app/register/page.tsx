"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Formik, Field, Form, ErrorMessage } from "formik";
import { registerUser } from "@/lib/api";
import { RegisterSchema } from "@/validation/auth";
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/solid";

/**
 * Defines the structure of the values in the registration form.
 * This resolves the 'unexpected any' error on the handleSubmit function's 'values' parameter.
 */
interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  role: "RENTER" | "OWNER";
}

const Register = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // if role query param is passed (eg: /register?role=OWNER)
  const initialRole =
    (searchParams.get("role") as "RENTER" | "OWNER") || "RENTER";

  const [role, setRole] = useState<"RENTER" | "OWNER">(initialRole);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Type definition added here
  const handleSubmit = async (values: RegisterFormValues) => {
    setError("");
    try {
      await registerUser({ ...values, role }); // include selected role
      router.push("/login");
    } catch (err) {
      console.error(err);
      setError("Failed to register. Please try again.");
    }
  };

  // --- new flag: disable renter selection if forced owner ---
  const isOwnerOnly = initialRole === "OWNER";

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center overflow-hidden">
      {/* Abstract background shapes */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-4xl opacity-30 pointer-events-none"></div>

      {/* Back to Listings */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-6 z-50 left-6 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white font-semibold rounded-full shadow-lg hover:scale-105 transform transition group"
      >
        <ArrowLeftIcon className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
        Back to Listings
      </button>

      <div className="p-8 pt-20 bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10">
        <h1 className="text-3xl font-bold mb-6 text-center text-purple-700">
          Register
        </h1>

        <Formik<RegisterFormValues> // Type argument added here
          initialValues={{
            name: "",
            email: "",
            password: "",
            role: initialRole,
          }}
          validationSchema={RegisterSchema}
          onSubmit={handleSubmit}
        >
          <Form className="space-y-4">
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name:
              </label>
              <Field
                name="name"
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
              <ErrorMessage
                name="name"
                component="div"
                className="text-red-500 text-xs mt-1"
              />
            </div>

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

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">
                Password:
              </label>
              <Field
                name="password"
                type={showPassword ? "text" : "password"}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm pr-10"
              />
              <div
                className="absolute right-3 top-1/2 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5 text-gray-400" />
                ) : (
                  <EyeIcon className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <ErrorMessage
                name="password"
                component="div"
                className="text-red-500 text-xs mt-1"
              />
            </div>

            {/* Role selection */}
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Role:
              </label>
              <div className="flex justify-between gap-2">
                <button
                  type="button"
                  disabled={isOwnerOnly} // renter disabled if ?role=OWNER
                  className={`flex-1 py-2 rounded-full font-semibold ${
                    role === "RENTER"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  } ${isOwnerOnly ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => !isOwnerOnly && setRole("RENTER")}
                >
                  Renter
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 rounded-full font-semibold ${
                    role === "OWNER"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                  onClick={() => setRole("OWNER")}
                >
                  Owner
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white font-semibold rounded-full shadow-md hover:scale-105 transition transform"
            >
              Register
            </button>

            {/* Link to Login */}
            <p className="text-center text-sm mt-4">
              Already have an account?{" "}
              <button
                type="button"
                className="text-purple-600 font-semibold hover:underline"
                onClick={() => router.push("/login")}
              >
                Log in
              </button>
            </p>
          </Form>
        </Formik>
      </div>
    </div>
  );
};

export default Register;

export const dynamic = "force-dynamic";
