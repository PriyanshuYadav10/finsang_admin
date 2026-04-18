# Railway.app Deployment Guide

This project consists of two separate Node.js applications that need to be deployed to Railway:

1. **Backend API** (Express server in `/api` folder)
2. **Frontend** (Next.js app in root folder)

## Prerequisites

- Railway.app account
- Supabase project with credentials
- Git repository connected to Railway

## Step 1: Deploy Backend API

### 1.1 Create Backend Service in Railway

1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select this repository
4. Create service from the `api/` folder root

### 1.2 Configure Backend Environment Variables

In Railway dashboard, set these variables for the backend service:

```env
NODE_ENV=production
PORT=3001

# Supabase (from your Supabase project settings)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# JWT (generate a random 32+ character string)
JWT_SECRET=your-very-long-random-secret-minimum-32-characters
JWT_EXPIRES_IN=7d

# CORS (update with your frontend URL)
ALLOWED_ORIGINS=https://finsangadmin-production.up.railway.app,http://localhost:3000

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# User Roles
DEFAULT_USER_ROLE=user
ADMIN_ROLES=admin,moderator

# Frontend URL (for redirects)
NEXT_PUBLIC_BASE_URL=https://finsangadmin-production.up.railway.app
```

### 1.3 Backend Deployment Settings

```
Service name: finsang-api
Start command: npm start
Port: 3001
```

After deployment, test the backend health:
```bash
curl https://your-api-url/health
# Should return: {"status":"OK"}
```

---

## Step 2: Deploy Frontend App

### 2.1 Create Frontend Service in Railway

1. In same Railway project, click "Add Service" → "Deploy from GitHub"
2. Select the same repository
3. The root folder will be detected automatically

### 2.2 Configure Frontend Environment Variables

In Railway dashboard, set these variables for the frontend service:

```env
# Supabase (same as backend)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend API URL (point to your backend service)
NEXT_PUBLIC_BACKEND_URL=https://your-api-service-url/api

# Optional: Internal URL for server-side requests
BACKEND_INTERNAL_URL=http://localhost:3001/api
```

### 2.3 Frontend Deployment Settings

```
Service name: finsang-admin
Build command: npm run build
Start command: npm start
Port: 3000
```

---

## Step 3: Configure Services to Communicate

### Option A: Link Services (Recommended)

In Railway, create a shared variable that both services can access:

1. Go to Project Settings → Variables
2. Add shared variable: `NEXT_PUBLIC_BACKEND_URL=http://finsang-api:3001/api`
3. This ensures frontend always points to the correct backend

### Option B: Manual URL Configuration

After both services are deployed, get the public URLs:

1. Backend API public URL (from Railway)
2. Update frontend `NEXT_PUBLIC_BACKEND_URL` to point to it

---

## Troubleshooting

### "API request failed: Failed to fetch"

**Cause**: Frontend cannot reach backend API

**Solution**:
1. Check `NEXT_PUBLIC_BACKEND_URL` is set correctly in frontend environment
2. Verify backend is running: `curl <backend-url>/health`
3. Check CORS settings in backend - `ALLOWED_ORIGINS` must include frontend URL

### "Application failed to respond"

**Cause**: Service crash or missing environment variables

**Solution**:
1. Check Railway logs for the service
2. Verify all required environment variables are set
3. For backend, ensure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct

### "Missing Supabase environment variables"

**Cause**: Build-time or runtime missing Supabase config

**Solution**:
1. Double-check variable names (must be exact)
2. No extra spaces in values
3. Values must match your Supabase project exactly
4. In Railway, the variables must be added BEFORE deployment triggers

---

## Environment Variables Quick Reference

### Backend (api/.env)
| Variable | Value | Required |
|----------|-------|----------|
| `NODE_ENV` | `production` | Yes |
| `PORT` | `3001` | No (default) |
| `SUPABASE_URL` | Your Supabase URL | Yes |
| `SUPABASE_ANON_KEY` | Your anon key | Yes |
| `JWT_SECRET` | Random 32+ chars | Yes |
| `ALLOWED_ORIGINS` | Backend URL | Yes |

### Frontend (src/.env)
| Variable | Value | Required |
|----------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key | Yes |
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL | Yes |

---

## Monitoring

In Railway dashboard, you can:

- View live logs for each service
- Monitor CPU/Memory usage
- Check deployment history
- View network errors
- Set up alerts for service failures

Always check logs if deployment fails!
