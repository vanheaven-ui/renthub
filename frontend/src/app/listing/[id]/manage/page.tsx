"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getListingById, updateListing, deleteListing } from "@/lib/api";
import { CreateListingPayload, Listing } from "@/types";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { ListingSchema } from "@/validation/listing";
import { convertListingToFormData } from "@/lib/formData";

type ListingFormValues = Pick<
  Listing,
  "title" | "description" | "pricePerDay" | "location"
>;

const ManageListingPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = params;
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const {
    data: listing,
    isLoading,
    isError,
  } = useQuery<Listing>({
    queryKey: ["listing", id],
    queryFn: () => getListingById(id),
  });

  const updateMutation = useMutation({
    mutationFn: (values: ListingFormValues) => {
      const payload: CreateListingPayload = {
        ...values,
        // Since this form only manages text fields, we pass empty arrays for images/removal
        images: [],
        removedImages: [],
      };

      const formData = convertListingToFormData(payload);

      return updateListing(id, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listing", id] });
      setSuccessMessage("Listing updated successfully!");
      setError("");
    },
    onError: () => {
      setError("Failed to update listing.");
      setSuccessMessage("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      setSuccessMessage("Listing deleted successfully! Redirecting...");
      setError("");
      setTimeout(() => {
        router.push("/");
      }, 1500);
    },
    onError: () => {
      setError("Failed to delete listing.");
      setSuccessMessage("");
    },
  });

  if (isLoading) return <div>Loading listing details...</div>;
  if (isError || !listing) return <div>Error: Listing not found.</div>;

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-800 border-b pb-2">
        Manage Listing
      </h1>
      <Formik
        initialValues={{
          title: listing.title,
          description: listing.description,
          pricePerDay: listing.pricePerDay,
          location: listing.location,
        }}
        validationSchema={ListingSchema}
        onSubmit={(values) => updateMutation.mutate(values)}
      >
        <Form className="bg-white p-8 rounded-xl shadow-2xl space-y-6">
          {error && (
            <p className="p-3 bg-red-100 text-red-700 text-sm rounded-lg border border-red-300 text-center font-medium">
              {error}
            </p>
          )}
          {successMessage && (
            <p className="p-3 bg-green-100 text-green-700 text-sm rounded-lg border border-green-300 text-center font-medium">
              {successMessage}
            </p>
          )}

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              Title:
            </label>
            <Field
              name="title"
              className="mt-1 block w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
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
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              Description:
            </label>
            <Field
              as="textarea"
              name="description"
              rows={4}
              className="mt-1 block w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none"
            />
            <ErrorMessage
              name="description"
              component="div"
              className="text-red-500 text-xs mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="pricePerDay"
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                Price per Night:
              </label>
              <Field
                name="pricePerDay"
                type="number"
                className="mt-1 block w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
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
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                Location:
              </label>
              <Field
                name="location"
                className="mt-1 block w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              />
              <ErrorMessage
                name="location"
                component="div"
                className="text-red-500 text-xs mt-1"
              />
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300 transform hover:scale-[1.01]"
              disabled={updateMutation.isPending || deleteMutation.isPending}
            >
              {updateMutation.isPending ? "Updating..." : "Update Listing"}
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate()}
              className="w-full py-3 px-4 bg-red-600 text-white font-bold rounded-lg shadow-md hover:bg-red-700 transition-colors duration-300 transform hover:scale-[1.01]"
              disabled={updateMutation.isPending || deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Listing"}
            </button>
          </div>
        </Form>
      </Formik>
    </div>
  );
};

export default ManageListingPage;
