# Developer Setup Guide

This guide provides step-by-step instructions for setting up the Othrhalff project development environment, configuring environment variables, running the application locally, and deploying it to production.

---

## 📋 System Prerequisites

Before starting, ensure you have the following installed and configured:

*   **Node.js**: `v18.x` or higher is recommended. Check your version with:
    ```bash
    node -v
    ```
*   **npm**: `v9.x` or higher is recommended. Check your version with:
    ```bash
    npm -v
    ```
*   **Supabase Project**: You need an active Supabase project for database storage, real-time sync, and authentication services.
*   **Agora Project Account**: Create a developer account at [Agora.io](https://www.agora.io/) to get an App ID and App Certificate. This is required to generate RTC (Real-Time Communication) tokens for video and audio calling features.

---

## 🚀 Project Installation

The Othrhalff project uses **npm Workspaces** to manage the root, frontend client (`client/`), and backend API server (`server/`) environments in a monorepo structure.

### 1. Clone the Repository
Clone the repository to your local machine and navigate into the root directory:
```bash
git clone <repository-url>
cd othrhalff
```

### 2. Install Dependencies
Run the install command in the root folder. This helper script triggers package installations concurrently across the workspaces:
```bash
npm run install:all
```

> [!NOTE]
> Under the hood, `npm run install:all` runs `npm install && npm install --prefix client && npm install --prefix server`. This ensures all global dependencies (such as `concurrently`), frontend React/Vite requirements, and backend Express modules are fully resolved.

---

## ⚙️ Environment Configuration

You must create and configure two separate `.env` files—one for the client and one for the server.

### 1. Frontend Configuration (`client/.env`)

Create a `.env` file inside the `client/` directory:
```bash
touch client/.env
```

Add the following environment variables:

```env
# Supabase API Settings
# Found in Supabase Dashboard -> Project Settings -> API
VITE_SUPABASE_URL=https://your-supabase-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-supabase-anonymous-key-here

# Express API Backend URL
# Development: http://localhost:5000 | Production: Deployed backend URL
VITE_API_URL=http://localhost:5000
```

| Environment Variable | Description |
| :--- | :--- |
| `VITE_SUPABASE_URL` | The secure endpoint URL for your Supabase database instance. |
| `VITE_SUPABASE_ANON_KEY` | The anonymous public key that allows frontend queries under Row-Level Security rules. |
| `VITE_API_URL` | The endpoint address for the Express server (used to request RTC tokens or trigger RLS bypasses). |

---

### 2. Backend Configuration (`server/.env`)

Create a `.env` file inside the `server/` directory:
```bash
touch server/.env
```

Add the following environment variables:

```env
# Server Running Port
PORT=5000

# Supabase Auth Setup (Must match the client configuration)
SUPABASE_URL=https://your-supabase-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-supabase-anonymous-key-here

# Supabase Service Role Secret Key (CRITICAL - DO NOT LEAK TO CLIENT)
# Found in Supabase Dashboard -> Project Settings -> API -> service_role (secret)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-supabase-service-role-key-here

# Agora RTC Service Credentials
# Found in Agora Console -> Project Management -> Project Details
AGORA_APP_ID=your-agora-app-id-here
AGORA_APP_CERTIFICATE=your-agora-app-certificate-here
```

> [!WARNING]
> The `SUPABASE_SERVICE_ROLE_KEY` bypasses all Row-Level Security (RLS) policies. It is absolutely critical for backend operations like automated match approvals and guest confession submissions. **Never** expose this key to the frontend client or commit it to version control.

| Environment Variable | Description |
| :--- | :--- |
| `PORT` | The network port the Express server listens on (default is `5000`). |
| `SUPABASE_URL` | The endpoint URL for your Supabase database instance. |
| `SUPABASE_ANON_KEY` | The anonymous public key used by the token-verification middleware. |
| `SUPABASE_SERVICE_ROLE_KEY` | High-privilege API key used to write match database states. |
| `AGORA_APP_ID` | App identifier key used to build WebRTC channels. |
| `AGORA_APP_CERTIFICATE` | Certificate used by the token builder to sign access permissions. |

---

## 💻 Running Locally

Once dependencies are installed and the environment files are configured, launch the development environment.

### Run Command
In the root directory of the project, run:
```bash
npm run dev
```

This starts both servers simultaneously using `concurrently`:
*   **Vite Frontend Development Server**: Runs on `http://localhost:5173`
*   **Express API Server**: Runs on `http://localhost:5000` (monitored by `nodemon`)

### 🔄 Local API Proxying
To prevent CORS errors and simplify local development URLs, the Vite configuration (`client/vite.config.ts`) includes a proxy mapping for API calls:

```typescript
// client/vite.config.ts (snippet)
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
}
```

This proxy forwards any request to `/api/*` from the frontend directly to `http://localhost:5000/api/*` in the local workspace.

---

## 🌐 Production Deployment Guide

Deploying the Othrhalff application requires hosting the frontend client and the backend server separately.

### 1. Frontend Deployment (Vercel)

The React single-page application is optimized to run on Vercel.

#### **Deployment Setup**:
1. Sign in to your [Vercel Dashboard](https://vercel.com/) and click **Add New** -> **Project**.
2. Import the Othrhalff repository.
3. Configure the following project parameters:
    *   **Root Directory**: `client`
    *   **Framework Preset**: `Vite`
    *   **Build Command**: `npm run build` or `vite build`
    *   **Output Directory**: `dist`
4. Expand the **Environment Variables** section and add:
    *   `VITE_SUPABASE_URL`
    *   `VITE_SUPABASE_ANON_KEY`
    *   `VITE_API_URL` (Set this to your production backend server address, e.g., `https://othrhalff-server.onrender.com`)
5. Click **Deploy**.

#### **SPA Routing & Security Configuration (`client/vercel.json`)**:
Vercel reads the `vercel.json` file to establish API request rewrites and enforce response security headers.

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://testing-of.onrender.com/api/$1"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

> [!NOTE]
> The rewrite section redirects standard `/api` calls to the specified production backend. Remember to update this destination URL in your local `client/vercel.json` when deploying to a custom server environment.

---

### 2. Backend Deployment (Render or Railway)

The Node.js/Express token and match backend runs on cloud hosting providers like Render or Railway.

#### **Manual Setup**:
*   **Root Directory**: `server`
*   **Build Command**: `npm install`
*   **Start Command**: `npm run start` or `node index.js`
*   **Environment Variables**:
    *   `PORT`
    *   `SUPABASE_URL`
    *   `SUPABASE_ANON_KEY`
    *   `SUPABASE_SERVICE_ROLE_KEY`
    *   `AGORA_APP_ID`
    *   `AGORA_APP_CERTIFICATE`
    *   `NODE_ENV=production`

#### **Render Infrastructure-as-Code Setup (`render.yaml`)**:
The repository includes a `render.yaml` configuration in the root directory. If you connect your repository to Render using a Blueprint, the backend service is automatically provisioned with the correct commands:

```yaml
services:
  - type: web
    name: other-half-server
    runtime: node
    rootDirectory: server      # Tells Render to look in the server folder
    buildCommand: npm install  # Installs backend dependencies
    startCommand: node index.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: DAILY_API_KEY
        sync: false  # Set this in Render Dashboard along with Supabase and Agora keys
```

> [!IMPORTANT]
> Make sure to manually add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AGORA_APP_ID`, and `AGORA_APP_CERTIFICATE` to your backend environment settings inside the Render or Railway Dashboard. These values are marked as secret and should never be saved in source files.
