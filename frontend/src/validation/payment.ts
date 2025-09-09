import * as Yup from "yup";

export const PaymentSchema = Yup.object().shape({
  full_name: Yup.string().required("Full name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  phone_number: Yup.string()
    .matches(/^[0-9]+$/, "Must be only digits")
    .min(10, "Phone number must be at least 10 digits")
    .required("Phone number is required"),
});
