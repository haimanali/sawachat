# 💬 SawaChat

A real-time, privacy-first chat application with **Encryption at Rest (EaR)**, AI-powered toxicity detection, and a modern dark-first UI — built as a graduation project.

---

## 🏗️ Architecture Overview

SawaChat is composed of **three independently running services**:

| Service | Technology | Port |
|---|---|---|
| **Frontend** | React + Vite (TypeScript) | `5173` |
| **Backend** | Node.js + Express + Socket.IO (TypeScript) | `3000` |
| **AI Service** | Python + BERT + gRPC | `50051` |

The Backend communicates with the AI Service over **gRPC**, and the Frontend connects to the Backend via **REST API** and **WebSockets (Socket.IO)**.

```
┌───────────────┐        REST / WS        ┌──────────────────┐        gRPC        ┌─────────────────┐
│   Frontend    │ ◄──────────────────────► │    Backend       │ ◄─────────────────► │   AI-BERT       │
│  React/Vite   │         :3000            │  Express + MySQL  │        :50051       │  toxic-bert     │
│    :5173      │                          └──────────────────┘                     └─────────────────┘
└───────────────┘                                   │
                                                    │ MySQL
                                                    ▼
                                          ┌──────────────────┐
                                          │     MySQL DB     │
                                          │   sawachat DB    │
                                          └──────────────────┘
```

---

## ✅ Prerequisites

Make sure you have the following installed before starting:

- **Node.js** v18+ — [nodejs.org](https://nodejs.org)
- **MySQL** v8+ — [mysql.com](https://dev.mysql.com/downloads/)
- **Python** 3.10+ — [python.org](https://python.org)
- **pip** (comes with Python)

---

## 🗄️ Step 1 — Set Up the Database

1. Open your MySQL client (MySQL Workbench, HeidiSQL, or the command line).

2. Import the schema file (it creates the database and all tables for you):

```bash
mysql -u root -p < sawachat_finalized_1_snapshot.sql
```

> This creates the `sawachat` database and all 8 tables (`Client`, `Session`, `ChatRoom`, `RoomMembers`, `Message`, `Contact`, `Request`, `Notification`) from scratch. It uses `IF NOT EXISTS` so it is safe to re-run.

> [!IMPORTANT]
> The backend is configured with the following MySQL credentials:
> - **Host:** `localhost`
> - **User:** `root`
> - **Password:** `SawaChat10@`
> - **Database:** `sawachat`
>
> If your MySQL `root` password is different, update it in `backend/repository/DBConn.ts` before running.

---

## 🤖 Step 2 — Run the AI Service (Python / gRPC)

The AI service loads a **Toxic-BERT** model and listens for gRPC calls from the backend on port `50051`.

### 2.1 — Create a Python virtual environment (recommended)

```bash
cd AI-BERT
python -m venv venv
```

Activate it:

- **Windows:** `venv\Scripts\activate`
- **macOS/Linux:** `source venv/bin/activate`

### 2.2 — Install Python dependencies

```bash
pip install grpcio grpcio-tools transformers torch cryptography
```

> [!NOTE]
> The `torch` and `transformers` libraries are large (~1–2 GB). The `toxic-bert` model weights will be downloaded automatically from HuggingFace on the **first run**.

### 2.3 — Start the AI service

```bash
python main.py
```

You should see:

```
Loading Toxic-BERT model into memory...
Model loaded successfully.
Async gRPC Server is listening on port 50051...
```

> Keep this terminal window open. Leave the AI service running in the background.

---

## ⚙️ Step 3 — Run the Backend (Node.js)

Open a **new terminal**.

### 3.1 — Install dependencies

```bash
cd backend
npm install
```

### 3.2 — Start the backend server

```bash
npm run dev
```

You should see:

```
server listening....
```

The backend REST API and WebSocket server is now running at **http://localhost:3000**.

> [!TIP]
> `npm run dev` uses `tsx --watch` which auto-restarts on file changes. Use `npm start` for a one-shot run without watch mode.

---

## 🖥️ Step 4 — Run the Frontend (React / Vite)

Open a **new terminal**.

### 4.1 — Install dependencies

```bash
cd frontend
npm install
npm install react-easy-crop   # required for profile picture cropping
```

### 4.2 — Start the development server

```bash
npm run dev
```

You should see something like:

```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser to use the app.

---

## 🚀 Running All Services — Quick Reference

Open **3 separate terminals** and run each command:

```bash
# Terminal 1 — AI Service
cd AI-BERT
venv\Scripts\activate        # Windows
python main.py

# Terminal 2 — Backend
cd backend
npm run dev

# Terminal 3 — Frontend
cd frontend
npm run dev
```

---

## 📁 Project Structure

```
sawachat/
├── frontend/                  # React + Vite frontend (TypeScript)
│   ├── src/
│   ├── index.html
│   └── package.json
│
├── backend/                   # Express + Socket.IO backend (TypeScript)
│   ├── Application/           # App layer (routing setup)
│   ├── controller/            # HTTP + WebSocket controllers
│   ├── service/               # Business logic services
│   ├── repository/            # Database access layer (MySQL)
│   ├── domain/                # Domain models & types
│   ├── entity/                # Entity definitions
│   ├── main.ts                # Entry point (runs on port 3000)
│   └── package.json
│
├── AI-BERT/                   # Python gRPC AI microservice
│   ├── gRPC/                  # Generated proto files
│   ├── main.py                # gRPC server entry point (port 50051)
│   ├── model.py               # Toxic-BERT model wrapper
│   └── serviceContract.proto  # gRPC service definition
│
├── automated_tests/           # Vitest automated test suite (see automated_tests/README.md)
│   ├── core.test.ts           # Unit tests (bcrypt, uuid, zod)
│   ├── integration.test.ts    # DB integration tests
│   ├── socket.test.ts         # Socket.IO handshake & event tests
│   ├── latency.test.ts        # HTTP + WebSocket latency benchmarks
│   ├── concurrency.test.ts    # 10,000-connection scalability test
│   ├── vitest.config.ts
│   └── package.json
│
└── sawachat_finalized_1_snapshot.sql  # MySQL database schema (creates all tables)
```

---

## 🧪 Automated Tests

The `automated_tests/` folder contains a standalone Vitest suite that covers unit, integration, WebSocket, latency, and concurrency testing. Full details in [`automated_tests/README.md`](automated_tests/README.md).

**Quick start:**

```bash
cd automated_tests
npm install
npm test           # runs unit + integration + socket + latency
```

> [!NOTE]
> The test suite requires the backend running on `http://localhost:3000` for live WebSocket tests, and MySQL on `localhost` with the default credentials.

---

## 🔑 Key Features

- 🔒 **Encryption at Rest (EaR)** — Messages encrypted with AES-GCM and stored encrypted in the database
- 🤖 **AI Toxicity Detection** — Messages analyzed by `unitary/toxic-bert` via gRPC
- ⚡ **Real-Time Messaging** — Powered by Socket.IO WebSockets
- 👥 **Contact & Room Management** — Friend system with secure 1-on-1 private rooms
- 🔐 **Secure Authentication** — Bcrypt password hashing + session cookies
- 📝 **Annotated Codebase** — Fully documented with student-style lowercase comments for academic transparency and university submission
- 🖼️ **Profile Customization** — Upload, crop, and zoom profile pictures
- 🎨 **Chat Wallpapers** — Per-room gradient wallpaper picker
- 🌍 **Multi-Language Support** — English and Arabic with full RTL layout
- 🌙 **Dark-First UI** — Modern glassmorphism design with light mode toggle
- ✅ **Read Receipts** — Configurable message read status

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router, Socket.IO Client, Vite, TypeScript, react-easy-crop |
| Backend | Node.js, Express 5, Socket.IO, MySQL2, Bcrypt, Zod, UUID |
| AI Service | Python, HuggingFace Transformers, Toxic-BERT, gRPC, AES-GCM |
| Database | MySQL 8 |
| Communication | REST API, WebSockets, gRPC |

---

## ⚠️ Troubleshooting

| Problem | Solution |
|---|---|
| `ER_ACCESS_DENIED_ERROR` | Check MySQL credentials in `backend/repository/DBConn.ts` |
| `ECONNREFUSED :50051` | Make sure the Python AI service is running before the backend |
| `ECONNREFUSED :3000` | Make sure the backend is running before opening the frontend |
| Model download stuck | Check internet connection; `toxic-bert` is ~400MB from HuggingFace |
| `npm install` fails | Ensure Node.js v18+ is installed (`node --version`) |
| Python `ModuleNotFoundError` | Activate the virtual environment before running `pip install` |
