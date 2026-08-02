import { Snippet } from "../models/Snippet.js";
import { User } from "../models/User.js";

const EXPIRY_PRESETS = {
  "10m": 10 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

function resolveExpireAt(expiresIn) {
  const ms = EXPIRY_PRESETS[expiresIn] ?? EXPIRY_PRESETS["1h"];
  return new Date(Date.now() + ms);
}

function isExpired(snippet) {
  return snippet.expireAt && new Date(snippet.expireAt) <= new Date();
}

function serializeSnippet(snippet, author) {
  return {
    shortId: snippet.shortId,
    title: snippet.title,
    code: snippet.code,
    language: snippet.language,
    visibility: snippet.visibility,
    expireAt: snippet.expireAt,
    createdAt: snippet.createdAt,
    author: author
      ? {
          id: author._id,
          name: author.name || author.email?.split("@")[0],
          email: author.email,
        }
      : undefined,
    url: `/s/${snippet.shortId}`,
  };
}

export async function createSnippet(req, res, next) {
  try {
    const { code, title, language, expiresIn, visibility } = req.body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({
        success: false,
        error: "Code is required and must be a non-empty string",
      });
    }

    if (expiresIn && !EXPIRY_PRESETS[expiresIn]) {
      return res.status(400).json({
        success: false,
        error: `Invalid expiresIn. Allowed: ${Object.keys(EXPIRY_PRESETS).join(", ")}`,
      });
    }

    const vis = visibility === "public" ? "public" : "private";

    const snippet = await Snippet.create({
      code: code.trim(),
      title: title?.trim() || "Untitled Snippet",
      language: language?.trim() || "plaintext",
      visibility: vis,
      author: req.user._id,
      expireAt: resolveExpireAt(expiresIn),
    });

    res.status(201).json({
      success: true,
      data: {
        shortId: snippet.shortId,
        title: snippet.title,
        language: snippet.language,
        visibility: snippet.visibility,
        expireAt: snippet.expireAt,
        createdAt: snippet.createdAt,
        url: `/s/${snippet.shortId}`,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getSnippet(req, res, next) {
  try {
    const { shortId } = req.params;

    if (!shortId || typeof shortId !== "string") {
      return res.status(400).json({
        success: false,
        error: "shortId route parameter is required",
      });
    }

    const snippet = await Snippet.findOne({ shortId }).lean();

    if (!snippet || isExpired(snippet)) {
      return res.status(404).json({
        success: false,
        error: "Snippet not found or has expired",
      });
    }

    const author = await User.findById(snippet.author).lean();

    res.json({
      success: true,
      data: serializeSnippet(snippet, author),
    });
  } catch (err) {
    next(err);
  }
}

export async function listPublicSnippets(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const now = new Date();

    const filter = {
      visibility: "public",
      expireAt: { $gt: now },
    };

    const [items, total] = await Promise.all([
      Snippet.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name email")
        .lean(),
      Snippet.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        items: items.map((snippet) => ({
          shortId: snippet.shortId,
          title: snippet.title,
          language: snippet.language,
          visibility: snippet.visibility,
          expireAt: snippet.expireAt,
          createdAt: snippet.createdAt,
          preview: snippet.code.slice(0, 160),
          author: snippet.author
            ? {
                id: snippet.author._id,
                name: snippet.author.name || snippet.author.email?.split("@")[0],
              }
            : null,
          url: `/s/${snippet.shortId}`,
        })),
        page,
        total,
        hasMore: skip + items.length < total,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function listMySnippets(req, res, next) {
  try {
    const now = new Date();
    const items = await Snippet.find({
      author: req.user._id,
      expireAt: { $gt: now },
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        items: items.map((snippet) => ({
          shortId: snippet.shortId,
          title: snippet.title,
          language: snippet.language,
          visibility: snippet.visibility,
          expireAt: snippet.expireAt,
          createdAt: snippet.createdAt,
          preview: snippet.code.slice(0, 160),
          url: `/s/${snippet.shortId}`,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getHealth(req, res) {
  res.json({
    success: true,
    data: { status: "ok", service: "SnippetVault API" },
  });
}
