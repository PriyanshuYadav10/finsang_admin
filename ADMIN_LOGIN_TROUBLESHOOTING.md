# Admin Login Troubleshooting Guide

## Problem
Admin login fails with "API request failed" error even though the application builds successfully.

## Root Causes & Solutions

### 1. Backend Service Not Running or Unreachable

**Symptoms:**
- "API request failed: Failed to fetch" on login page
- Network tab shows failed request to backend URL

**Solution:**
1. Check Railway dashboard - is the backend service running?
   - Go to Railway → Select `finsang-api` service
   - Check status shows "Running" (green circle)
   
2. Check backend logs for errors:
   - Click "Logs" tab
   - Look for errors like "ECONNREFUSED" or "Missing environment variables"

3. Verify backend is accessible:
   ```bash
   curl https://your-backend-url/health
   # Should return: {"status":"OK"}
   ```

---

### 2. Environment Variables Not Set in Backend

**Symptoms:**
- Backend logs show: "Missing Supabase environment variables"
- Service crashes on startup

**Solution - Critical Steps:**

Before deploying the backend, set these variables in Railway:

#### In Railway Dashboard:

1. Go to Railway Project → Select `finsang-api` service
2. Click "Variables" tab
3. Add each variable (do NOT include quotes):

| Variable | Value | From |
|----------|-------|------|
| `SUPABASE_URL` | `https://your-project-ref.supabase.co` | Supabase Settings |
| `SUPABASE_ANON_KEY` | Your anon key | Supabase Settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service key | Supabase Settings |
| `JWT_SECRET` | Generate random 32+ chars | Your choice |
| `NODE_ENV` | `production` | Your choice |
| `ALLOWED_ORIGINS` | Your frontend URL | Your deployment URL |

4. **IMPORTANT**: Click "Save" and let the service redeploy
5. Wait for green status before testing

**Where to find Supabase keys:**
- Go to Supabase dashboard
- Click project name
- Go to Settings → API
- Copy values from there

---

### 3. Incorrect NEXT_PUBLIC_BACKEND_URL in Frontend

**Symptoms:**
- App loads but can't connect to backend
- Frontend shows correct login page but fails on submit

**Solution:**

1. Get your backend service URL from Railway:
   - Railway → `finsang-api` service
   - Click "Connect" button
   - Copy the public URL

2. Set frontend variables in Railway:
   - Go to `finsang-admin` service
   - Click "Variables" tab
   - Set: `NEXT_PUBLIC_BACKEND_URL=https://your-backend-service-url/api`
   - Example: `https://finsang-api-prod.up.railway.app/api`

3. Redeploy frontend after changing variables

---

### 4. CORS Issues (Cross-Origin Request Blocked)

**Symptoms:**
- Browser console shows CORS error
- Request blocked by Access-Control-Allow-Origin

**Solution:**

1. Get your frontend URL from Railway:
   - Railway → `finsang-admin` service → Click "Connect"
   - Copy the public URL (e.g., `https://finsang-admin-prod.up.railway.app`)

2. Update backend CORS in Railway:
   - Backend service → Variables
   - Set `ALLOWED_ORIGINS` = Your frontend public URL
   - Example: `https://finsang-admin-prod.up.railway.app,http://localhost:3000`

3. Redeploy backend

---

### 5. Database Tables Not Created

**Symptoms:**
- Login form shows "You have no tables" in database
- Auth works but app features fail

**Note:** Login doesn't require database tables (uses Supabase Auth only)

**Solution - Optional:** Create data tables for app features:

In Supabase dashboard, go to SQL Editor and run:

```sql
-- Products table
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  product_id TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  original_price DECIMAL(10, 2),
  stock_quantity INTEGER,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  category_id BIGINT
);

-- Product Types table
CREATE TABLE product_types (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Banners table
CREATE TABLE banners (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  link_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT now()
);

-- Training categories table
CREATE TABLE training_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Training videos table
CREATE TABLE training_videos (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT REFERENCES training_categories(id),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  duration INTEGER,
  created_at TIMESTAMP DEFAULT now()
);
```

---

## Quick Checklist

Use this to verify everything is set up correctly:

- [ ] Backend service is running (green status in Railway)
- [ ] All Supabase keys set in backend variables
- [ ] JWT_SECRET is set (32+ random characters)
- [ ] ALLOWED_ORIGINS includes your frontend URL
- [ ] Frontend has NEXT_PUBLIC_BACKEND_URL pointing to backend
- [ ] Both services redeployed after variable changes
- [ ] Can access `/health` endpoint on backend
- [ ] Can access frontend without errors

---

## Step-by-Step: Complete Setup from Scratch

### Step 1: Get Supabase Credentials
1. Open Supabase project
2. Go to Settings → API
3. Copy:
   - Project URL
   - `anon` key
   - `service_role` key

### Step 2: Deploy Backend
1. Railway → Add Service → Deploy from GitHub
2. Select this repo, root path = `api/`
3. Before it deploys, set Variables:
   ```
   SUPABASE_URL=<paste from step 1>
   SUPABASE_ANON_KEY=<paste from step 1>
   SUPABASE_SERVICE_ROLE_KEY=<paste from step 1>
   JWT_SECRET=<generate: openssl rand -base64 32>
   NODE_ENV=production
   ALLOWED_ORIGINS=<will update later>
   ```
4. Let it deploy completely (should be green)

### Step 3: Deploy Frontend
1. Railway → Add Service → Deploy from GitHub
2. Select same repo, root path stays blank
3. Before deploying, set Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=<from Supabase settings>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase settings>
   NEXT_PUBLIC_BACKEND_URL=<will update after backend deployed>
   ```
4. Let it deploy

### Step 4: Link Services
1. Get backend public URL from Railway
2. Go to frontend service → Variables
3. Update `NEXT_PUBLIC_BACKEND_URL=<backend-public-url>/api`
4. Update backend `ALLOWED_ORIGINS=<frontend-public-url>`
5. Redeploy both

### Step 5: Test
1. Open frontend URL
2. Try admin login
3. Should work now!

---

## Error Messages & Solutions

| Error | Cause | Fix |
|-------|-------|-----|
| "Failed to fetch" | Backend not running | Check backend service status |
| "CORS error" | Wrong ALLOWED_ORIGINS | Update CORS with frontend URL |
| "Invalid Supabase" | Wrong keys | Verify keys from Supabase settings |
| "Invalid email or password" | Correct - user not found | Sign up first via `/api/admin/signup` |

---

## Testing Commands

### Test backend health:
```bash
curl https://your-backend-url/health
```

### Test CORS:
```bash
curl -H "Origin: https://your-frontend-url" https://your-backend-url/health
```

### Test from frontend terminal:
```javascript
// In browser console
fetch('https://your-backend-url/health')
  .then(r => r.json())
  .then(data => console.log(data))
  .catch(err => console.error(err))
```
