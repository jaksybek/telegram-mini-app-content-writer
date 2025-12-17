import express from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { createThread, getThread } from "./db";

const router = express.Router();

const createSchema = z.object({
  title: z.string().min(3),
  body: z.string().min(10).max(5000),
  tags: z.array(z.string()).optional(),
});

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(limiter);
router.use(express.json());

router.post("/", (req, res) => {
  try {
    const parsed = createSchema.parse(req.body);
    const thread = createThread({
      title: parsed.title,
      body: parsed.body,
      authorId: null,
      status: "published",
    });
    return res.status(201).json(thread);
  } catch (err: any) {
    if (err?.issues) {
      return res.status(400).json({ error: "validation_error", details: err.issues });
    }
    return res.status(500).json({ error: "server_error", message: String(err?.message ?? err) });
  }
});

router.get("/:id", (req, res) => {
  const id = req.params.id;
  const thread = getThread(id);
  if (!thread) return res.status(404).json({ error: "not_found" });
  return res.json(thread);
});

export default router;
