import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const DB_PATH = path.join(__dirname, "contacts.json");

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

async function readContacts() {
  try {
    const data = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    // If file doesn't exist or is empty, start fresh
    return [];
  }
}

async function writeContacts(list) {
  await fs.writeFile(DB_PATH, JSON.stringify(list, null, 2));
}

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

    // Basic validation
    if (!name || !email) {
      return res
        .status(400)
        .json({ ok: false, message: "Name and email are required." });
    }

    const phoneSanitized = (phone || "").toString().trim();

    const entry = {
      id: crypto.randomUUID(),
      name: name.toString().trim(),
      phone: phoneSanitized,
      email: email.toString().trim().toLowerCase(),
      createdAt: new Date().toISOString(),
      source: "tifekt-comingsoon",
    };

    const contacts = await readContacts();

    // Avoid duplicate by email
    const exists = contacts.some((c) => c.email === entry.email);
    if (exists) {
      return res
        .status(200)
        .json({ ok: true, message: "Already subscribed. Welcome back!" });
    }

    contacts.push(entry);
    await writeContacts(contacts);
    res.json({ ok: true, message: "Subscribed successfully!", entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error." });
  }
});

app.get("/api/contacts", async (req, res) => {
  try {
    const contacts = await readContacts();
    res.json({ ok: true, total: contacts.length, contacts });
  } catch (err) {
    res.status(500).json({ ok: false, message: "Failed to read contacts." });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
