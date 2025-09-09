"use client";

import { Toaster } from "react-hot-toast";

const ToastProvider = () => {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      toastOptions={{
        duration: 3000,
        style: {
          background: "#363636",
          color: "#fff",
        },
      }}
    />
  );
};

export default ToastProvider;
