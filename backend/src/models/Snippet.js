import mongoose from "mongoose";
import { createShortId } from "../utils/shortId.js";

const snippetSchema = new mongoose.Schema(
  {
    shortId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: createShortId,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "Untitled Snippet",
    },
    code: {
      type: String,
      required: true,
      maxlength: 100000,
    },
    language: {
      type: String,
      trim: true,
      maxlength: 40,
      default: "plaintext",
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    expireAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

snippetSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
snippetSchema.index({ visibility: 1, createdAt: -1 });

export const Snippet = mongoose.model("Snippet", snippetSchema);
