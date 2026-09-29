# MarketLens

> AI-powered e-commerce market intelligence platform

MarketLens helps e-commerce sellers understand markets before investing. It collects live market data via SerpApi, structures and analyzes it, and presents evidence-backed market intelligence reports.

Built for the **SerpApi India Hackathon 2026 — Track 4: Commerce & Market Intelligence**.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + Tailwind CSS v4 + Recharts |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | Firebase Authentication |
| Search Data | SerpApi (Google Shopping) |
| AI | Google Gemini API |

## Project Structure

```
MarketLens/
├── client/          # React frontend
│   ├── src/
│   └── package.json
├── server/          # Express backend
│   ├── src/
│   └── package.json
└── README.md
```

## Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Firebase project
- SerpApi API key
- Google Gemini API key

### Backend

```bash
cd server
cp .env.example .env    # Fill in your keys
npm install
npm run dev
```

### Frontend

```bash
cd client
cp .env.example .env    # Fill in Firebase config
npm install
npm run dev
```

## Environment Variables

See `server/.env.example` and `client/.env.example` for required configuration.

## License

MIT
