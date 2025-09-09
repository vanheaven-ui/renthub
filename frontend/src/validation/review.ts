import * as Yup from "yup";

export const ReviewSchema = Yup.object().shape({
  rating: Yup.number()
    .required("Rating is required")
    .min(1, "Minimum rating is 1")
    .max(5, "Maximum rating is 5"),
  comment: Yup.string().optional(),
});
