"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createListing } from "@/lib/api";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { CreateListingPayload } from "@/types";
import { ListingSchema } from "@/validation/listing";

const CreateListingPage = () => {
  const router = useRouter();
  const [error, setError] = useState("");

  const handleSubmit = async (values: CreateListingPayload) => {
    setError("");
    try {
      await createListing(values);
      router.push("/");
    } catch (err) {
      setError("Failed to create listing. Please try again.");
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-4 overflow-hidden">
      {/* Abstract background shapes */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-4xl opacity-30 pointer-events-none"></div>

      <div className="w-full max-w-2xl relative z-10">
        <h1 className="text-4xl font-bold mb-8 text-center text-purple-900">
          Create a New Listing
        </h1>
        <Formik
          initialValues={{
            title: "",
            description: "",
            pricePerDay: 0,
            location: "",
            category: "",
            images: [],
          }}
          validationSchema={ListingSchema}
          onSubmit={handleSubmit}
        >
          {({ setFieldValue }) => (
            <Form className="bg-white/40 backdrop-blur-md p-8 rounded-3xl shadow-2xl space-y-6">
              {error && (
                <p className="text-red-500 text-sm text-center font-semibold">
                  {error}
                </p>
              )}

              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Title:
                </label>
                <Field
                  name="title"
                  className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition"
                />
                <ErrorMessage
                  name="title"
                  component="div"
                  className="text-red-500 text-xs mt-1 font-medium"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Description:
                </label>
                <Field
                  as="textarea"
                  name="description"
                  className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition"
                  rows={4}
                />
                <ErrorMessage
                  name="description"
                  component="div"
                  className="text-red-500 text-xs mt-1 font-medium"
                />
              </div>

              {/* Price */}
              <div>
                <label
                  htmlFor="pricePerDay"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Price per Night (UGX):
                </label>
                <Field
                  name="pricePerDay"
                  type="number"
                  className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition"
                />
                <ErrorMessage
                  name="pricePerDay"
                  component="div"
                  className="text-red-500 text-xs mt-1 font-medium"
                />
              </div>

              {/* Location */}
              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Location:
                </label>
                <Field
                  name="location"
                  className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition"
                />
                <ErrorMessage
                  name="location"
                  component="div"
                  className="text-red-500 text-xs mt-1 font-medium"
                />
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Category:
                </label>
                <Field
                  as="select"
                  name="category"
                  className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition"
                >
                  <option value="">Select a category</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="villa">Villa</option>
                  <option value="guesthouse">Guesthouse</option>
                </Field>
                <ErrorMessage
                  name="category"
                  component="div"
                  className="text-red-500 text-xs mt-1 font-medium"
                />
              </div>

              {/* Images */}
              <div>
                <label
                  htmlFor="images"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Images:
                </label>
                <input
                  type="file"
                  name="images"
                  multiple
                  onChange={(event) => {
                    setFieldValue(
                      "images",
                      Array.from(event.currentTarget.files || [])
                    );
                  }}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                <ErrorMessage
                  name="images"
                  component="div"
                  className="text-red-500 text-xs mt-1 font-medium"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 px-6 bg-purple-600 text-white font-semibold rounded-full shadow-lg hover:bg-purple-700 transition transform hover:scale-105"
              >
                Create Listing
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default CreateListingPage;
