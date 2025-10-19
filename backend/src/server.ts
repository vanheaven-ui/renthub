import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import http from "http";
import { initSocket } from "./socket";
import authRoutes from "./routes/authRoutes";
import listingRoutes from "./routes/listingRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import adminRoutes from "./routes/adminRoutes";
import messageRoutes from "./routes/messageRoutes";
import userRoutes from "./routes/userRoutes";
import aiRoutes from "./routes/aiRoutes";
import { prisma } from "./lib/prisma";

dotenv.config();

const app = express();

// Trust proxy (important for cookies and secure headers in production)
app.set("trust proxy", 1);

// CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
};
app.use(cors(corsOptions));

// Core middleware
app.use(express.json());
app.use(cookieParser());

// HTTP + Socket setup
const server = http.createServer(app);
initSocket(server);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/bookings", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ai", aiRoutes);

// Health check endpoint
app.get("/", (_req, res) => {
  res.status(200).json({
    message: "RentHub API is live and running!",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(2)} seconds`,
    documentation: "https://renthub-docs.vercel.app",
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const serverInstance = server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

//  Graceful Shutdown Handling (Centralized) ---
const shutdown = async () => {
  console.log("Shutting down gracefully...");
  await prisma.$disconnect();
  serverInstance.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
};

// Handle common shutdown signals
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("beforeExit", shutdown);
