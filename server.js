import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

const SITES = {
  eksidocom: {
    vectorStoreId: process.env.VECTOR_STORE_ID_SITE_1,
    systemPrompt:
      "You are Eksido.com's AI concierge. Answer ONLY from the provided knowledge base. If not found, say you don't know and suggest contacting support.",
    token: process.env.CONCIERGE_TOKEN_SITE_1,
  },
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";
const MAX_TURNS = 6;
const MAX_MESSAGES = MAX_TURNS * 2;

app.use(express.json({ limit: "1mb" }));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
  })
);

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/chat", async (req, res, next) => {
  try {
    const siteKey = String(req.query.site || "").toLowerCase().trim();
    if (!siteKey) {
      return res.status(400).json({ error: "Missing required query param: site" });
    }

    const site = SITES[siteKey];
    if (!site) {
      return res.status(400).json({ error: `Unknown site: ${siteKey}` });
    }

    if (!site.vectorStoreId) {
      return res.status(500).json({ error: "Vector store not configured for this site" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY is not configured" });
    }

    const requireToken = String(process.env.REQUIRE_TOKEN || "").toLowerCase() === "true";
    if (requireToken) {
      if (!site.token) {
        return res
          .status(500)
          .json({ error: "CONCIERGE_TOKEN_SITE_1 is required when REQUIRE_TOKEN=true" });
      }
      const provided = req.get("X-Concierge-Token");
      if (!provided || provided !== site.token) {
        return res.status(401).json({ error: "Invalid or missing X-Concierge-Token" });
      }
    }

    const body = req.body || {};
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) {
      return res.status(400).json({ error: "message is required and must be a non-empty string" });
    }

    let history = [];
    if (typeof body.history !== "undefined") {
      if (!Array.isArray(body.history)) {
        return res.status(400).json({ error: "history must be an array when provided" });
      }

      history = body.history.map((item, idx) => {
        const role = item?.role;
        const content = typeof item?.content === "string" ? item.content.trim() : "";
        if (!role || (role !== "user" && role !== "assistant") || !content) {
          throw new Error(`Invalid history item at index ${idx}`);
        }
        return { role, content };
      });
    }

    const trimmedHistory = history.slice(-MAX_MESSAGES);
    const messages = [...trimmedHistory, { role: "user", content: message }];

    const response = await openai.responses.create({
      model: MODEL,
      instructions: site.systemPrompt,
      input: messages,
      tools: [
        {
          type: "file_search",
          vector_store_ids: [site.vectorStoreId],
        },
      ],
    });

    const answer =
      response?.output_text?.trim() ||
      "I'm sorry, I don't know. Please contact support.";

    res.json({ answer });
  } catch (err) {
    if (err?.message?.startsWith("Invalid history item")) {
      return res.status(400).json({ error: err.message });
    }
    return next(err);
  }
});

app.use((err, req, res, next) => {
  if (err?.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS: Origin not allowed" });
  }
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON body" });
  }
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Eksido Simple Web Agent API listening on port ${port}`);
});
