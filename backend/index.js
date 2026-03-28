require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const Groq = require("groq-sdk");
const { rateLimit } = require("express-rate-limit");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const app = express();
app.set("trust proxy", 1); // Render (and most PaaS) sit behind a reverse proxy
const PORT = process.env.PORT || 3000;
const CHAT_MODEL = process.env.CHAT_MODEL || "llama-3.3-70b-versatile";
const WEATHERSTACK_KEY = process.env.WEATHERSTACK_API_KEY;
const GEOAPIFY_KEY = process.env.GEOAPIFY_API_KEY;

// ─── Load knowledge base once at startup ─────────────────────────────────────
const DATA_DIR = path.join(__dirname, "..", "data");
const KNOWLEDGE_BASE = fs.readdirSync(DATA_DIR)
  .filter(f => f.endsWith(".md"))
  .map(f => fs.readFileSync(path.join(DATA_DIR, f), "utf-8"))
  .join("\n\n---\n\n");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));

// ─── Rate limiting ────────────────────────────────────────────────────────────
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute window
  max: 20,                   // max 20 requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many messages. Please slow down and try again in a minute." },
});

// ─── Input sanitization ───────────────────────────────────────────────────────
const MAX_MESSAGE_LENGTH = 500;

// common prompt injection patterns
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/i,
  /forget\s+(everything|all|your\s+instructions?)/i,
  /you\s+are\s+now\s+(a\s+)?(?!a\s+travel)/i,
  /act\s+as\s+(?!a\s+travel)/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /override\s+(system|prompt|instructions?)/i,
  /new\s+instructions?:/i,
  /system\s*:\s*you/i,
  /\[system\]/i,
  /jailbreak/i,
];

function sanitizeInput(message) {
  // strip null bytes and control characters (except newlines/tabs)
  return message.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

function detectInjection(message) {
  return INJECTION_PATTERNS.some(pattern => pattern.test(message));
}

// ─── SQLite setup ────────────────────────────────────────────────────────────
const db = new Database(path.join(__dirname, "conversations.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    session    TEXT    NOT NULL,
    role       TEXT    NOT NULL,
    content    TEXT    NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
const insertMsg = db.prepare("INSERT INTO messages (session, role, content) VALUES (?, ?, ?)");
const getHistory = db.prepare("SELECT role, content FROM messages WHERE session = ? ORDER BY id ASC LIMIT 20");

// ─── Shared helper: geocode city → { lat, lon, name } ────────────────────────
async function geocodeCity(city) {
  const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(city)}&limit=1&apiKey=${GEOAPIFY_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const f = data.features?.[0];
  if (!f) return null;
  return { lat: f.properties.lat, lon: f.properties.lon, name: f.properties.city || city };
}

// ─── Trip card data ───────────────────────────────────────────────────────────
const TRIPS = [
  {
    keywords: ["spiti", "spiti valley"],
    name: "Spiti Valley Explorer",
    duration: "8 days / 7 nights",
    price: "₹18,500 – ₹22,000 per person",
    season: "June to September",
    highlights: ["Chandratal Lake", "Key Monastery", "Hikkim Post Office", "Pin Valley National Park"],
    route: "Shimla → Kaza → Chandratal → Manali",
  },
  {
    keywords: ["manali", "leh", "manali leh", "leh manali", "highway"],
    name: "Manali–Leh Highway Adventure",
    duration: "10 days / 9 nights",
    price: "₹24,000 – ₹28,000 per person",
    season: "July to September",
    highlights: ["Rohtang Pass", "Nubra Valley", "Pangong Lake", "Khardung La"],
    route: "Manali → Jispa → Leh → Nubra → Pangong",
  },
  {
    keywords: ["kasol", "kheerganga"],
    name: "Kasol & Kheerganga Trek",
    duration: "4 days / 3 nights",
    price: "₹7,500 – ₹9,500 per person",
    season: "Mar–Jun, Sep–Nov",
    highlights: ["Parvati River walks", "Natural hot springs", "Chalal forest trail", "Kasol cafés"],
    route: "Delhi → Kasol → Kheerganga → Delhi",
  },
  {
    keywords: ["chopta", "tungnath", "chandrashila"],
    name: "Chopta–Tungnath–Chandrashila Trek",
    duration: "5 days / 4 nights",
    price: "₹9,800 – ₹12,000 per person",
    season: "Apr–Jun, Oct–Nov",
    highlights: ["Tungnath Temple (3,680m)", "Chandrashila Peak (4,130m)", "Deoria Tal lake", "Alpine meadows"],
    route: "Haridwar → Chopta → Chandrashila → Haridwar",
  },
  {
    keywords: ["bir", "billing", "paragliding"],
    name: "Bir Billing Paragliding Weekend",
    duration: "3 days / 2 nights",
    price: "₹8,500 per person",
    season: "Mar–May, Sep–Nov",
    highlights: ["Tandem paragliding from Billing", "Tibetan Colony", "Palpung Monastery"],
    route: "Delhi → Bir → Billing → Delhi",
  },
  {
    keywords: ["kedarnath", "kedarnath yatra"],
    name: "Kedarnath Yatra",
    duration: "6 days / 5 nights",
    price: "₹12,500 per person",
    season: "May–Jun, Sep–Oct",
    highlights: ["Kedarnath Temple darshan", "Vasuki Tal trek", "Gaurikund hot springs", "Mandakini River views"],
    route: "Haridwar → Guptkashi → Gaurikund → Kedarnath",
  },
];

function detectTripCard(message) {
  const lower = message.toLowerCase();
  return TRIPS.find(t => t.keywords.some(k => lower.includes(k))) || null;
}

// ─── Budget data from actual trip prices ─────────────────────────────────────
const BUDGET_DATA = {
  "spiti":     { days: 8,  low: 18500, high: 22000 },
  "spiti valley": { days: 8, low: 18500, high: 22000 },
  "manali":    { days: 10, low: 24000, high: 28000 },
  "leh":       { days: 10, low: 24000, high: 28000 },
  "kasol":     { days: 4,  low: 7500,  high: 9500  },
  "kheerganga":{ days: 4,  low: 7500,  high: 9500  },
  "chopta":    { days: 5,  low: 9800,  high: 12000 },
  "tungnath":  { days: 5,  low: 9800,  high: 12000 },
  "bir":       { days: 3,  low: 8500,  high: 8500  },
  "billing":   { days: 3,  low: 8500,  high: 8500  },
  "kedarnath": { days: 6,  low: 12500, high: 12500 },
};
const DEFAULT_PER_DAY = { low: 1800, high: 2500 };

// ─── Tools ───────────────────────────────────────────────────────────────────

function extractCity(message, patterns) {
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return match[1].trim().replace(/[?.!]+$/, "");
  }
  return null;
}

const TOOLS = [
  {
    name: "get_weather",
    detect(msg) {
      return extractCity(msg, [
        /weather\s+(?:in|at|for|of)?\s+([a-zA-Z\s]+)/i,
        /(?:how(?:'s| is)|what(?:'s| is))\s+(?:the\s+)?weather\s+(?:in|at|for)?\s*([a-zA-Z\s]+)/i,
      ]);
    },
    async execute(city) {
      if (!WEATHERSTACK_KEY) return null;
      const url = `http://api.weatherstack.com/current?access_key=${WEATHERSTACK_KEY}&query=${encodeURIComponent(city)}&units=m`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error || !data.current) return null;
      const { temperature, weather_descriptions, humidity, wind_speed, feelslike } = data.current;
      return `[WEATHER] Current weather in ${data.location.name}: ${weather_descriptions[0]}, ${temperature}°C (feels like ${feelslike}°C), humidity ${humidity}%, wind ${wind_speed} km/h.`;
    },
  },

  {
    name: "get_places",
    detect(msg) {
      return extractCity(msg, [
        /(?:places?|attractions?|things?\s+to\s+do|what\s+to\s+(?:see|do|visit)|sights?|spots?)\s+(?:in|at|near|around)?\s*([a-zA-Z\s]+)/i,
        /(?:in|at|near|around)\s+([a-zA-Z\s]+)\s+(?:to\s+(?:see|visit|do)|places?|attractions?)/i,
        /visit\s+(?:in\s+)?([a-zA-Z\s]+)/i,
      ]);
    },
    async execute(city) {
      if (!GEOAPIFY_KEY) return null;
      const geo = await geocodeCity(city);
      if (!geo) return null;
      const url = `https://api.geoapify.com/v2/places?categories=tourism.attraction,tourism.sights&filter=circle:${geo.lon},${geo.lat},10000&limit=8&apiKey=${GEOAPIFY_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      const places = data.features?.map(f => f.properties.name).filter(Boolean);
      if (!places?.length) return null;
      return `[PLACES] Top attractions near ${geo.name}: ${places.join(", ")}.`;
    },
  },

  {
    name: "search_hotels",
    detect(msg) {
      return extractCity(msg, [
        /(?:hotels?|stay|accommodation|where\s+to\s+stay|guesthouses?|hostels?)\s+(?:in|at|near|around)?\s*([a-zA-Z\s]+)/i,
        /(?:in|at|near|around)\s+([a-zA-Z\s]+)\s+(?:hotels?|stay|accommodation)/i,
      ]);
    },
    async execute(city) {
      if (!GEOAPIFY_KEY) return null;
      const geo = await geocodeCity(city);
      if (!geo) return null;
      const url = `https://api.geoapify.com/v2/places?categories=accommodation.hotel,accommodation.guest_house&filter=circle:${geo.lon},${geo.lat},10000&limit=6&apiKey=${GEOAPIFY_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      const hotels = data.features?.map(f => f.properties.name).filter(Boolean);
      if (!hotels?.length) return null;
      return `[HOTELS] Accommodation options near ${geo.name}: ${hotels.join(", ")}.`;
    },
  },

  {
    name: "estimate_budget",
    detect(msg) {
      if (!/budget|cost|price|how\s+much|expensive|cheap|afford/i.test(msg)) return null;
      // try to extract days
      const daysMatch = msg.match(/(\d+)\s*(?:day|night)/i);
      const days = daysMatch ? parseInt(daysMatch[1]) : null;
      // try to extract destination
      const destMatch = msg.match(/(?:for|in|to|at)\s+([a-zA-Z\s]+?)(?:\s+for|\s+trip|\?|$)/i);
      const dest = destMatch ? destMatch[1].trim() : null;
      return { days, dest };
    },
    async execute({ days, dest }) {
      const key = dest?.toLowerCase();
      const known = key ? Object.keys(BUDGET_DATA).find(k => key.includes(k)) : null;
      const data = known ? BUDGET_DATA[known] : null;

      if (data && !days) {
        return `[BUDGET] A ${data.days}-day ${dest} trip with OnyaTrips costs ₹${data.low.toLocaleString("en-IN")}–₹${data.high.toLocaleString("en-IN")} per person (inclusions: accommodation, meals, transport, guide).`;
      }

      if (days) {
        const perDay = data
          ? { low: Math.round(data.low / data.days), high: Math.round(data.high / data.days) }
          : DEFAULT_PER_DAY;
        const total = { low: perDay.low * days, high: perDay.high * days };
        const location = dest || "a Himalayan destination";
        return `[BUDGET] Estimated cost for a ${days}-day trip to ${location}: ₹${total.low.toLocaleString("en-IN")}–₹${total.high.toLocaleString("en-IN")} per person (covers accommodation, meals, transport, and guide).`;
      }

      return `[BUDGET] OnyaTrips prices start from ₹7,500 (short treks) up to ₹28,000 (Manali–Leh highway) per person, all inclusive. Share your destination and number of days for an exact estimate.`;
    },
  },
];

// ─── Agent: detect and run all relevant tools in parallel ────────────────────
async function runAgent(message) {
  const tasks = [];

  for (const tool of TOOLS) {
    const input = tool.detect(message);
    if (input !== null && input !== undefined) {
      tasks.push(
        tool.execute(input).catch(err => {
          console.error(`Tool ${tool.name} failed:`, err.message);
          return null;
        })
      );
    }
  }

  const results = await Promise.all(tasks);
  return results.filter(Boolean).join("\n");
}

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", model: CHAT_MODEL });
});

// list all sessions with preview of first user message
app.get("/api/sessions", (_req, res) => {
  const sessions = db.prepare(`
    SELECT
      session,
      MIN(created_at) AS started,
      COUNT(*) AS message_count,
      (SELECT content FROM messages m2
       WHERE m2.session = m.session AND m2.role = 'user'
       ORDER BY m2.id ASC LIMIT 1) AS preview
    FROM messages m
    GROUP BY session
    ORDER BY MAX(created_at) DESC
    LIMIT 50
  `).all();
  res.json(sessions);
});

// full message list for one session
app.get("/api/sessions/:session", (req, res) => {
  const messages = db.prepare(
    "SELECT role, content FROM messages WHERE session = ? ORDER BY id ASC"
  ).all(req.params.session);
  res.json(messages);
});

app.post("/api/chat", chatLimiter, async (req, res) => {
  const { message, session_id } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  const clean = sanitizeInput(message);

  if (clean.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: `Message too long. Please keep it under ${MAX_MESSAGE_LENGTH} characters.` });
  }

  if (detectInjection(clean)) {
    console.warn(`[SECURITY] Prompt injection attempt from ${req.ip}: "${clean.slice(0, 100)}"`);
    return res.status(400).json({ error: "Invalid message." });
  }

  const session = session_id || "default";

  try {
    const [liveData, history] = await Promise.all([
      runAgent(clean),
      Promise.resolve(getHistory.all(session)),
    ]);

    const systemPrompt = `You are a travel assistant for OnyaTrips, an adventure travel company offering trips in the Indian Himalayas.

RULES — follow without exception:
1. ONLY answer questions about OnyaTrips' trips, destinations, pricing, bookings, hotels, weather, and budget.
2. Use the LIVE DATA and CONTEXT below. Do NOT use outside knowledge.
3. If the question is off-topic (science, history, coding, jokes, or anything unrelated to travel), respond with ONLY: "Sorry, I'm not able to help with that. I can only assist with questions about OnyaTrips' trips and destinations."
4. Do NOT offer to help with anything outside travel.
5. Keep answers concise and friendly.
${liveData ? `\nLIVE DATA (use this for accurate, real-time answers):\n${liveData}\n` : ""}
CONTEXT:
${KNOWLEDGE_BASE}`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: clean },
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // send trip card if relevant
    const tripCard = detectTripCard(clean);
    if (tripCard) {
      res.write(`data: ${JSON.stringify({ card: tripCard })}\n\n`);
    }

    let fullResponse = "";
    const stream = await groq.chat.completions.create({ model: CHAT_MODEL, messages, stream: true });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || "";
      fullResponse += token;
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

    insertMsg.run(session, "user", clean);
    insertMsg.run(session, "assistant", fullResponse);
  } catch (err) {
    console.error("Chat error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate response. Please try again." });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
});

app.get("/{*path}", (_req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

app.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
