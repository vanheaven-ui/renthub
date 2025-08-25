"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getListingById, updateListing, deleteListing } from "@/lib/api";
import { Listing } from "@/types";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { ListingSchema } from "@/validation/listing";

const ManageListingPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = params;
  const [error, setError] = useState("");

  const {
    data: listing,
    isLoading,
    isError,
  } = useQuery<Listing>({
    queryKey: ["listing", id],
    queryFn: () => getListingById(id),
  });

  const updateMutation = useMutation({
    mutationFn: (values: any) => updateListing(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listing", id] });
      alert("Listing updated successfully!");
    },
    onError: () => {
      setError("Failed to update listing.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      router.push("/");
      alert("Listing deleted successfully!");
    },
    onError: () => {
      setError("Failed to delete listing.");
    },
  });

  if (isLoading) return <div>Loading listing details...</div>;
  if (isError || !listing) return <div>Error: Listing not found.</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Manage Listing</h1>
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
        <Form className="bg-white p-6 rounded-lg shadow-md space-y-4">
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
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
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-md"
          >
            Update Listing
          </button>
          <button
            type="button"
            onClick={() => deleteMutation.mutate()}
            className="w-full py-2 px-4 bg-red-600 text-white font-semibold rounded-md shadow-md"
          >
            Delete Listing
          </button>
        </Form>
      </Formik>
    </div>
  );
};

export default ManageListingPage;
