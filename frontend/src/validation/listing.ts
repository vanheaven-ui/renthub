import * as Yup from "yup";

export const ListingSchema = Yup.object().shape({
  title: Yup.string().required("Title is required"),
  description: Yup.string().required("Description is required"),
  pricePerDay: Yup.number()
    .required("Price is required")
    .positive("Price must be a positive number"),
  location: Yup.string().required("Location is required"),
  images: Yup.mixed().required("At least one image is required"),
});
