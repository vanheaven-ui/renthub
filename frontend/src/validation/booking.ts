import * as Yup from "yup";

export const BookingSchema = Yup.object().shape({
  listingId: Yup.string().required("Listing ID is required"),
  renterId: Yup.string().required("Renter ID is required"),
  ownerId: Yup.string().required("Owner ID is required"),
  startDate: Yup.date()
    .required("Start date is required")
    .typeError("Start date is invalid"),
  endDate: Yup.date()
    .required("End date is required")
    .min(Yup.ref("startDate"), "End date cannot be before start date")
    .typeError("End date is invalid"),
});
