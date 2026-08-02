import { Router } from "express";
import {
  createSnippet,
  getSnippet,
  listPublicSnippets,
  listMySnippets,
  getHealth,
} from "../controllers/snippetController.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const router = Router();

router.get("/health", getHealth);
router.get("/snippets", listPublicSnippets);
router.get("/snippets/mine", requireAuth, listMySnippets);
router.post("/snippets", requireAuth, createSnippet);
router.get("/snippets/:shortId", optionalAuth, getSnippet);

export default router;
