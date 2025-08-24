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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Create a New Listing
      </h1>
      <Formik
        initialValues={{
          title: "",
          description: "",
          pricePerDay: 0,
          location: "",
          images: [],
        }}
        validationSchema={ListingSchema}
        onSubmit={handleSubmit}
      >
        {({ setFieldValue }) => (
          <Form className="bg-white p-6 rounded-lg shadow-md space-y-4">
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Title:
              </label>
              <Field
                name="title"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <ErrorMessage
                name="title"
                component="div"
                className="text-red-500 text-xs mt-1"
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description:
              </label>
              <Field
                as="textarea"
                name="description"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <ErrorMessage
                name="description"
                component="div"
                className="text-red-500 text-xs mt-1"
              />
            </div>
            <div>
              <label
                htmlFor="pricePerDay"
                className="block text-sm font-medium text-gray-700"
              >
                Price per Night:
              </label>
              <Field
                name="pricePerDay"
                type="number"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <ErrorMessage
                name="pricePerDay"
                component="div"
                className="text-red-500 text-xs mt-1"
              />
            </div>
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700"
              >
                Location:
              </label>
              <Field
                name="location"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <ErrorMessage
                name="location"
                component="div"
                className="text-red-500 text-xs mt-1"
              />
            </div>
            <div>
              <label
                htmlFor="images"
                className="block text-sm font-medium text-gray-700"
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
                className="mt-1 block w-full"
              />
              <ErrorMessage
                name="images"
                component="div"
                className="text-red-500 text-xs mt-1"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-md"
            >
              Create Listing
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default CreateListingPage;
