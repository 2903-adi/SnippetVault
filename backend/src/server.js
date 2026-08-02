import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import snippetRoutes from "./routes/snippets.js";
import authRoutes from "./routes/auth.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", authRoutes);
app.use("/api", snippetRoutes);

app.use(notFound);
app.use(errorHandler);

function maskMongoUri(uri) {
  try {
    const parsed = new URL(uri);
    if (parsed.password) parsed.password = "***";
    return parsed.toString();
  } catch {
    return "(invalid URI format)";
  }
}

async function start() {
  const uri = process.env.MONGODB_URI?.trim();

  console.log("Starting SnippetVault API...");
  console.log(`Node: ${process.version}`);
  console.log(`PORT: ${PORT}`);
  console.log(`MONGODB_URI set: ${Boolean(uri)}`);
  if (uri) {
    console.log(`MONGODB_URI host: ${maskMongoUri(uri)}`);
  }

  if (!uri) {
    throw new Error("MONGODB_URI is not set in Render Environment");
  }

  if (uri.includes("127.0.0.1") || uri.includes("localhost")) {
    throw new Error(
      "MONGODB_URI points to localhost. Use your MongoDB Atlas mongodb+srv:// URI on Render."
    );
  }

  await connectDB(uri);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SnippetVault API running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err?.message || err);
  if (err?.reason) console.error("Mongo reason:", err.reason);
  process.exit(1);
});
