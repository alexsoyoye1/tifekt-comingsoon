import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const DB_PATH = path.join(__dirname, "contacts.json");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme";

// --- Middleware ---
app.use(helmet());
app.use(cors()); // in production: cors({ origin: "https://tifekt.com" })
app.use(express.json());
app.use(morgan("dev"));

// --- JSON "Database" helpers ---
async function readContacts() {
  try {
    const data = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeContacts(list) {
  await fs.writeFile(DB_PATH, JSON.stringify(list, null, 2));
}

// --- Public Endpoints ---

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "tifekt-comingsoon",
    time: new Date().toISOString(),
  });
});

app.post("/api/subscribe", async (req, res) => {
  try {
    const { name, phone, email } = req.body || {};
    if (!name || !email) {
      return res
        .status(400)
        .json({ ok: false, message: "Name and email are required." });
    }

    const entry = {
      id: crypto.randomUUID(),
      name: name.toString().trim(),
      phone: (phone || "").toString().trim(),
      email: email.toString().trim().toLowerCase(),
      createdAt: new Date().toISOString(),
      source: "tifekt-comingsoon",
    };

    const contacts = await readContacts();

    if (contacts.some((c) => c.email === entry.email)) {
      return res.json({
        ok: true,
        message: "Already subscribed. Welcome back!",
      });
    }

    contacts.push(entry);
    await writeContacts(contacts);

    res.json({ ok: true, message: "Subscribed successfully!", entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error." });
  }
});

// --- Admin Endpoints ---

function requireAdmin(req, res, next) {
  const header = req.headers["authorization"] || "";
  const token = header.replace("Bearer ", "").trim();

  if (!token) {
    return res.status(401).json({
      ok: false,
      message: "Missing admin password in Authorization header.",
    });
  }

  if (token !== ADMIN_PASSWORD) {
    return res.status(401).json({
      ok: false,
      message: `Unauthorized: Password mismatch. Expected value from .env (ADMIN_PASSWORD), got "${token}".`,
    });
  }

  next();
}

app.get("/api/admin/contacts", requireAdmin, async (req, res) => {
  try {
    const contacts = await readContacts();
    res.json({ ok: true, total: contacts.length, contacts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Failed to read contacts." });
  }
});

// --- Serve frontend build in production ---
const clientBuildPath = path.join(__dirname, "client", "dist");
app.use(express.static(clientBuildPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`🔑 Admin password is "${ADMIN_PASSWORD}"`);
});
