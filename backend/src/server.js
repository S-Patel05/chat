import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

import { ENV } from "./lib/env.js";
import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.route.js";
import { connectDB } from "./lib/db.js";

dotenv.config();

const app = express();

// Fix __dirname correctly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || ENV.PORT || 3000;

app.use(cors({origin:ENV.CLIENT_URL, credentials:true}));

app.use(express.json());

app.use(cookieParser());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Serve frontend (ALWAYS — not only production)
app.use(
  express.static(
    path.join(__dirname, "../../frontend/dist")
  )
);

// React router fallback
app.get("*", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../frontend/dist/index.html")
  );
});

app.listen(PORT, async () => {
  console.log("Server running on port:", PORT);
  await connectDB();
});
