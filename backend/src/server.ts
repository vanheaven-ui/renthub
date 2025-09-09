import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import http from "http";
import { initSocket, io } from "./socket"; 
import authRoutes from "./routes/authRoutes";
import listingRoutes from "./routes/listingRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import adminRoutes from "./routes/adminRoutes";
import messageRoutes from "./routes/messageRoutes";
import userRoutes from "./routes/userRoutes";

dotenv.config();

const app = express();

app.set("trust proxy", 1);

const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
};

const server = http.createServer(app);

initSocket(server); // Initialize the socket.io server

app.use(express.json());
app.use(cors(corsOptions));
app.use(cookieParser());

// This middleware is no longer needed since we are importing `io` directly
// and it's a singleton.
// app.use((req, _res, next) => {
//   req.io = io;
//   next();
// });

app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/bookings", messageRoutes);
app.use("/api/users", userRoutes)

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
