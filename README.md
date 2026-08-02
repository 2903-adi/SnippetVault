# SnippetVault

Secure temporary code snippet sharing ΓÇö Node.js, Express.js, MongoDB, Nodemailer auth, and a React frontend.

## Structure

```
SnippetVault/
Γö£ΓöÇΓöÇ backend/     # Express REST API + MongoDB
Γö£ΓöÇΓöÇ frontend/    # React (Vite) app
ΓööΓöÇΓöÇ README.md
```

## Features

- Email OTP login via Nodemailer (no passwords)
- Only logged-in users can create snippets
- Public / private visibility at post time
- Public posts feed (`/posts`)
- Private posts: visible to the owner when logged in, or anyone with the shareable link
- Unique short-URL IDs (nanoid)
- Self-destructing snippets with MongoDB TTL indexes



## Local setup



### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API: `http://localhost:5000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

## Deploy (Vercel + Render + MongoDB Atlas)



### 1. MongoDB Atlas (database)

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Database Access ΓåÆ create a user
3. Network Access ΓåÆ allow `0.0.0.0/0` (or Render IPs)
4. Connect ΓåÆ copy the connection string (`MONGODB_URI`)



### 2. Render (backend)

1. Push this repo to GitHub
2. Render ΓåÆ **New Web Service** ΓåÆ connect the repo
3. Settings:
  - **Root Directory:** `backend`
  - **Build Command:** `npm install`
  - **Start Command:** `npm start`
4. Environment variables:

```
MONGODB_URI=your-atlas-uri
JWT_SECRET=long-random-secret
CORS_ORIGIN=https://your-app.vercel.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=email@gmail.com
SMTP_PASS=gmail-app-password
MAIL_FROM=SnippetVault <email@gmail.com>
```

1. Deploy and copy the backend URL, e.g. `https://snippetvault-api.onrender.com`



### 3. Vercel (frontend)

1. Vercel ΓåÆ **Add New Project** ΓåÆ import the same GitHub repo
2. Settings:
  - **Root Directory:** `frontend`
  - **Framework Preset:** Vite
  - **Build Command:** `npm run build`
  - **Output Directory:** `dist`
3. Environment variable:

```
VITE_API_URL=https://your-render-url.onrender.com/api
```

1. Deploy, then put that Vercel URL into Render `CORS_ORIGIN` and redeploy backend if needed



## API


| Method | Endpoint                 | Description            |
| ------ | ------------------------ | ---------------------- |
| `POST` | `/api/auth/otp/request`  | Send login OTP         |
| `POST` | `/api/auth/otp/verify`   | Verify OTP and get JWT |
| `GET`  | `/api/auth/me`           | Current user           |
| `GET`  | `/api/snippets`          | List public posts      |
| `GET`  | `/api/snippets/mine`     | My posts (auth)        |
| `POST` | `/api/snippets`          | Create snippet (auth)  |
| `GET`  | `/api/snippets/:shortId` | Retrieve snippet       |




### Create snippet body

```json
{
  "title": "Quick sort",
  "language": "javascript",
  "code": "function sort(arr) { ... }",
  "expiresIn": "1h",
  "visibility": "public"
}
```

`expiresIn`: `10m`, `1h`, `24h`, `7d`  
`visibility`: `public` | `private`
