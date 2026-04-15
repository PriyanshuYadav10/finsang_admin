# Hostinger Deployment

This project has two Node.js apps:

- Root folder: Next.js admin/frontend app
- `api/` folder: Express backend API

Host both apps as Node.js applications in Hostinger hPanel. Do not upload this as a static HTML/PHP site, because the project uses Next.js server routes and an Express API.

## 1. Backend API App

Create the first Node.js app from the `api/` folder.

- Node.js version: 20
- Install command: `npm install`
- Start command: `npm start`
- App entry file: `server.js`

Set these environment variables in Hostinger:

```env
NODE_ENV=production
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=https://admin.yourdomain.com,https://yourdomain.com
NEXT_PUBLIC_BASE_URL=https://admin.yourdomain.com
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
DEFAULT_USER_ROLE=user
ADMIN_ROLES=admin,moderator
```

After deployment, open the backend health URL:

```text
https://api.yourdomain.com/health
```

You should see a JSON response with `status: "OK"`.

## 2. Next.js Admin App

Create the second Node.js app from the project root folder.

- Node.js version: 20
- Install command: `npm install`
- Build command: `npm run build`
- Start command: `npm start`

Set these environment variables in Hostinger:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com/api
BACKEND_INTERNAL_URL=https://api.yourdomain.com/api
```

Then point your admin domain/subdomain to this app, for example:

```text
https://admin.yourdomain.com
```

## 3. Supabase

Make sure the Supabase project has the required tables and public storage buckets used by the app:

- `products`
- `product_types`
- `grow_categories`
- `grow_posters`
- `training_categories`
- `training_videos`
- `banners`
- `card-images`
- `grow-data`
- `finsangmart-storage`

## 4. Common Checks

If login or API calls fail in the browser, check:

- `NEXT_PUBLIC_BACKEND_URL` points to the backend URL ending in `/api`
- `ALLOWED_ORIGINS` includes the exact frontend domain, including `https://`
- Supabase URL and anon key match in both apps
- The backend health URL works
