import { CreateListingPayload } from "@/types";

/**
 * Converts a CreateListingPayload (for create or edit) into FormData
 * Supports images and removedImages for editing listings
 */
export const convertListingToFormData = (
  payload: CreateListingPayload
): FormData => {
  const formData = new FormData();

  formData.append("title", payload.title);
  formData.append("description", payload.description);
  formData.append("pricePerDay", payload.pricePerDay.toString());
  formData.append("location", payload.location);

  if (payload.category) {
    formData.append("category", payload.category);
  }

  // Append new images
  payload.images.forEach((file) => {
    formData.append("images", file);
  });

  // Append removed images (only for edit)
  if (payload.removedImages && payload.removedImages.length > 0) {
    payload.removedImages.forEach((imgPath) => {
      formData.append("removedImages", imgPath);
    });
  }

  return formData;
};
