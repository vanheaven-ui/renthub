import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { AuthProvider } from "./context/AuthProvider";
import FloatingClientButtons from "../components/FloatingClientButtons";
import ToastProvider from "../components/ToastProvider";

const dmSans = DM_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RentHub",
  description: "Find your next perfect rental home.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={dmSans.className}>
        <Providers>
          <AuthProvider>
            <main>{children}</main>
            <FloatingClientButtons />
            <ToastProvider />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
