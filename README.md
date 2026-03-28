# OnyaTrips AI Chatbot

An AI-powered travel assistant for [onyatrips.com](https://www.onyatrips.com) — answers trip questions, suggests Himalayan packages, provides live weather and hotel info, and helps users with bookings.

---

## Features

- Real-time streaming AI responses (Groq + Llama 3.3 70B)
- Live weather lookup (Weatherstack API)
- Hotel & attractions lookup (Geoapify API)
- Budget estimation for Himalayan trips
- Visual trip cards with booking prompts
- Chat history with session replay
- Rate limiting & prompt injection protection
- UI branded to match OnyaTrips.com exactly

---

## Project Structure

```
OnyaTrips/
├── backend/
│   ├── index.js              # Express server — all chatbot logic
│   ├── frontend/
│   │   └── index.html        # Chat UI (Outfit font, teal/yellow brand)
│   ├── .env                  # API keys (never commit this)
│   ├── package.json
│   └── conversations.db      # SQLite chat history (auto-created)
├── data/
│   ├── trips.md              # Trip packages knowledge base
│   ├── destinations.md       # Destination guides
│   └── faqs.md               # Frequently asked questions
└── OnyaTrips_Chatbot_Assignment.docx
```

---

## Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

If you get a `better-sqlite3` version error:

```bash
npm rebuild better-sqlite3
```

### 2. Get API keys (all free)

| Key | Where to get it |
|-----|----------------|
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) → API Keys |
| `WEATHERSTACK_API_KEY` | [weatherstack.com](https://weatherstack.com) → Dashboard |
| `GEOAPIFY_API_KEY` | [myprojects.geoapify.com](https://myprojects.geoapify.com) → API Keys |

### 3. Create `.env` file

Create `backend/.env` with:

```env
GROQ_API_KEY=your_groq_key_here
WEATHERSTACK_API_KEY=your_weatherstack_key_here
GEOAPIFY_API_KEY=your_geoapify_key_here
CHAT_MODEL=llama-3.3-70b-versatile
PORT=3000
```

> Only `GROQ_API_KEY` is required to run. The other two enable live weather and hotel features.

### 4. Start the server

```bash
node index.js
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Updating the Knowledge Base

The chatbot's knowledge comes from three Markdown files in `/data/`. Edit them directly — no retraining needed.

| File | What to edit |
|------|-------------|
| `data/trips.md` | Trip packages, prices, durations, highlights |
| `data/destinations.md` | Destination guides, altitude, climate, tips |
| `data/faqs.md` | Frequently asked questions and answers |

After editing, restart the server for changes to take effect.

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| LLM | Groq — Llama 3.3 70B Versatile |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| Weather | Weatherstack API |
| Places | Geoapify API |
| Frontend | HTML / CSS / JS (Outfit font) |
