"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { Listing, CreateListingPayload } from "@/types";
import { ListingSchema } from "@/validation/listing";
import { createListing, updateListing } from "@/lib/api";
import { convertListingToFormData } from "@/lib/formData";
import Image from "next/image";

interface ListingFormProps {
  initialData?: Listing;
}

const ListingForm: React.FC<ListingFormProps> = ({ initialData }) => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = !!initialData;

  const handleSubmit = async (values: CreateListingPayload) => {
    setError("");
    setIsLoading(true);

    try {
      const formData = convertListingToFormData(values);

      if (isEdit && initialData?.id) {
        await updateListing(initialData.id, formData);
      } else {
        await createListing(formData);
      }

      router.push("/");
    } catch (err) {
      console.error(err);
      setError(
        isEdit
          ? "Failed to update listing. Please try again."
          : "Failed to create listing. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => router.back();

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-4 overflow-hidden">
      {/* Background shapes */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-4xl opacity-30 pointer-events-none"></div>

      <div className="w-full max-w-2xl relative z-10">
        <h1 className="text-4xl font-bold mb-8 text-center text-purple-900">
          {isEdit ? "Edit Listing" : "Create a New Listing"}
        </h1>

        <Formik
          initialValues={{
            title: initialData?.title || "",
            description: initialData?.description || "",
            pricePerDay: initialData?.pricePerDay || 0,
            location: initialData?.location || "",
            category: initialData?.category || "",
            images: [] as File[],
            removedImages: [] as string[],
          }}
          validationSchema={ListingSchema}
          onSubmit={handleSubmit}
        >
          {({ setFieldValue, values }) => {
            const handleRemoveExisting = (imgUrl: string) => {
              if (!values.removedImages.includes(imgUrl)) {
                setFieldValue("removedImages", [
                  ...values.removedImages,
                  imgUrl,
                ]);
              }
            };

            return (
              <Form className="bg-white/40 backdrop-blur-md p-8 rounded-3xl shadow-2xl space-y-6 relative">
                {error && (
                  <p className="text-red-500 text-sm text-center font-semibold">
                    {error}
                  </p>
                )}

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Title:
                  </label>
                  <Field
                    name="title"
                    className="w-full px-4 py-3 caret-purple-600 bg-white/50 backdrop-blur-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition"
                  />
                  <ErrorMessage
                    name="title"
                    component="div"
                    className="text-red-500 text-xs mt-1 font-medium"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Description:
                  </label>
                  <Field
                    as="textarea"
                    name="description"
                    rows={4}
                    className="w-full px-4 py-3 caret-purple-600 bg-white/50 backdrop-blur-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition"
                  />
                  <ErrorMessage
                    name="description"
                    component="div"
                    className="text-red-500 text-xs mt-1 font-medium"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Price per Night (UGX):
                  </label>
                  <Field
                    name="pricePerDay"
                    type="number"
                    className="w-full px-4 py-3 caret-purple-600 bg-white/50 backdrop-blur-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition"
                  />
                  <ErrorMessage
                    name="pricePerDay"
                    component="div"
                    className="text-red-500 text-xs mt-1 font-medium"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Location:
                  </label>
                  <Field
                    name="location"
                    className="w-full px-4 py-3 caret-purple-600 bg-white/50 backdrop-blur-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition"
                  />
                  <ErrorMessage
                    name="location"
                    component="div"
                    className="text-red-500 text-xs mt-1 font-medium"
                  />
                </div>

                {/* Category */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Category:
                  </label>
                  <div className="relative">
                    <Field
                      as="select"
                      name="category"
                      className="w-full px-4 py-3 pr-10 bg-white/50 backdrop-blur-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition appearance-none"
                    >
                      <option value="">Select a category</option>
                      <option value="apartment">Apartment</option>
                      <option value="single-room">Single Room</option>
                      <option value="self-contained">
                        Self-Contained Room
                      </option>
                      <option value="bedsitter">Bedsitter</option>
                      <option value="house">House</option>
                      <option value="bungalow">Bungalow</option>
                      <option value="flat">Flat</option>
                      <option value="duplex">Duplex</option>
                      <option value="mansion">Mansion</option>
                      <option value="villa">Villa</option>
                      <option value="guesthouse">Guesthouse</option>
                      <option value="hostel">Hostel</option>
                      <option value="boys-quarter">Boys Quarter (BQ)</option>
                      <option value="shop">Shop / Retail Space</option>
                      <option value="office">Office Space</option>
                      <option value="warehouse">Warehouse / Store</option>
                      <option value="commercial-building">
                        Commercial Building
                      </option>
                      <option value="lodges">Lodge / Inn</option>
                      <option value="short-stay">Short Stay / Airbnb</option>
                      <option value="farmhouse">
                        Farmhouse / Country Home
                      </option>
                      <option value="plot">Plot / Land</option>
                    </Field>

                    {/* Dropdown indicator properly aligned */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-700 pointer-events-none">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 01.02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <ErrorMessage
                    name="category"
                    component="div"
                    className="text-red-500 text-xs mt-1 font-medium"
                  />
                </div>

                {/* Existing Images */}
                {isEdit && initialData?.images?.length ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Existing Images:
                    </label>
                    <div className="flex flex-wrap gap-4">
                      {initialData.images.map((imgUrl) =>
                        values.removedImages.includes(imgUrl) ? null : (
                          <div key={imgUrl} className="relative w-24 h-24">
                            <Image
                              src={imgUrl}
                              alt={initialData?.title || "listing"}
                              fill
                              sizes="96px"
                              className="object-cover rounded-xl border border-gray-300"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveExisting(imgUrl)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                            >
                              &times;
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ) : null}

                {/* New Images */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Add Images:
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) =>
                      setFieldValue(
                        "images",
                        Array.from(e.currentTarget.files || [])
                      )
                    }
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  <ErrorMessage
                    name="images"
                    component="div"
                    className="text-red-500 text-xs mt-1 font-medium"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-4 mt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`flex-1 py-3 px-6 bg-purple-600 text-white font-semibold rounded-full shadow-lg transition transform hover:scale-105 ${
                      isLoading
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-purple-700"
                    }`}
                  >
                    {isLoading
                      ? "Processing..."
                      : isEdit
                      ? "Update Listing"
                      : "Create Listing"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 py-3 px-6 bg-gray-300 text-gray-800 font-semibold rounded-full shadow-lg hover:bg-gray-400 transition transform hover:scale-105"
                  >
                    Cancel
                  </button>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
};

export default ListingForm;
