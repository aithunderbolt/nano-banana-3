# AI Photo Editor

An AI-powered photo editor with text-to-image generation, in-painting (edit/remove/replace areas), out-painting (expand image), and image understanding. The app is split into a React frontend (Vite) and a Node.js/Express backend that calls Google's Gemini API (`gemini-2.5-flash-image-preview`).

## Features

- **Text-to-Image**: Generate an image from a text prompt.
- **In‑painting**: Upload an image, paint a mask, and apply an edit prompt to modify masked areas.
- **Out‑painting**: Expand the canvas and describe what should appear in the new regions.
- **Image Understanding**: Ask questions about an uploaded image and get a text answer.
- **Content Safety (NSFW policy)**: Requests are checked for NSFW content. NSFW requests are rejected with a clear message and not processed.

## Project Structure

```
/
|-- client/          # React (Vite) frontend
|   |-- src/
|   |   |-- components/
|   |   |-- config.js  # Centralized API endpoints (reads VITE_API_BASE_URL)
|   |-- .env.example   # Example client env
|
|-- server/          # Node.js/Express backend
|   |-- server.js
|   |-- config.js     # Centralized system prompt & NSFW policy
|   |-- .env          # Backend secrets (create locally)
|
|-- Readme.md
```

## Prerequisites

- Node.js 18+ (LTS recommended)
- A Google Generative AI API key (Gemini)

## Configuration

### Backend (server/.env)

Create `server/.env` with:

```ini
GEMINI_API_KEY=your_google_generative_ai_key
# Optional (defaults to 5000)
PORT=5000
```

The backend also uses `server/config.js` to centralize:

- `SYSTEM_PROMPT`: Instructs the model to identify NSFW requests and refuse them.
- `NSFW_KEYWORDS`: Lightweight pre-filter for obvious NSFW text.
- `NSFW_MESSAGE`: Unified rejection message.

### Frontend (client/.env.*)

Create `client/.env.development` (and/or `.env.production`) with:

```ini
VITE_API_BASE_URL=http://localhost:5000
```

The frontend reads this via `client/src/config.js` and exposes a centralized `ENDPOINTS` object:

- `GENERATE_IMAGE`
- `EDIT_IMAGE`
- `UNDERSTAND_IMAGE`

This avoids hardcoding server URLs in components.

## Install & Run (Windows)

Open two terminals: one for the server and one for the client.

### 1) Install dependencies

Server (in the `server` folder):

```powershell
npm install
```

Client (in the `client` folder):

```powershell
npm install
```

### 2) Start the backend

From the `server` folder:

```powershell
npm start
```

This starts Express on the port configured by `PORT` (default 5000).

### 3) Start the frontend

From the `client` folder:

```powershell
npm run dev
```

Vite will show a local URL (typically `http://localhost:5173`). The frontend will call the backend at `VITE_API_BASE_URL`.

## Usage Notes

- Prompts in the UI are multiline for better authoring.
- Download buttons are provided after images are generated/edited.
- If a request is flagged as NSFW by the server guard, you will receive a `400` with the message from `NSFW_MESSAGE` and the model will not be called.

## Troubleshooting

- **CORS/Network errors**: Ensure `VITE_API_BASE_URL` matches your backend URL and the backend is running.
- **401/403 or model errors**: Verify `GEMINI_API_KEY` in `server/.env` and that the specified model is available on your account.
- **Env changes not taking effect**: Restart both dev servers after editing `.env` files.

## Scripts

Backend (from `server`):

- `npm start` — start Express server.

Frontend (from `client`):

- `npm run dev` — start Vite dev server.
- `npm run build` — build for production.
- `npm run preview` — preview production build.

## Security & Configuration Policy

- Secrets are never committed. Store keys only in `.env` files locally or in your deployment platform’s secret manager.
- Client/server configuration is centralized (`client/src/config.js`, `server/config.js`) to avoid scattered hardcoded values.
