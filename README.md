# Finsang Admin Dashboard (Next.js)

This is the Next.js version of the Finsang Admin Dashboard, converted from the original React app.

## Features

- **Products Management**: Add, edit, and manage products with detailed information including benefits, terms, FAQs, and payout structures
- **Grow Management**: Manage grow categories and posters
- **Training Management**: Manage training categories and videos
- **Banner Management**: Create and manage promotional banners with scheduling and positioning options
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop and mobile devices

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Database Schema

Make sure your Supabase database has the following tables:

- `products` - Product information
- `productypes` - Product categories
- `grow_categories` - Grow categories
- `grow_posters` - Grow posters
- `training_categories` - Training categories
- `training_videos` - Training videos
- `banners` - Banner management with scheduling and positioning

### 4. Supabase Storage Setup

Create a storage bucket named `banners` in your Supabase project:

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `banners`
3. Set it to public for banner images
4. Configure RLS policies as needed

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with theme provider
│   └── page.tsx            # Main dashboard page
├── components/
│   ├── Header.tsx          # Header with dark mode toggle
│   ├── ProductsTab.tsx     # Products management
│   ├── GrowTab.tsx         # Grow management
│   ├── TrainingsTab.tsx    # Training management
│   └── BannersTab.tsx      # Banner management
└── lib/
    └── supabase.ts         # Supabase client configuration
```

## Key Changes from React to Next.js

1. **File Structure**: Converted to Next.js App Router structure
2. **Client Components**: Added `'use client'` directive to interactive components
3. **Environment Variables**: Changed from `VITE_` to `NEXT_PUBLIC_` prefix
4. **Routing**: Using Next.js built-in routing instead of React Router
5. **Build System**: Using Next.js build system instead of Vite

## Technologies Used

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Material-UI** - UI components
- **Supabase** - Backend and database
- **Tailwind CSS** - Utility-first CSS framework

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

The app can be deployed to Vercel, Netlify, or any other platform that supports Next.js applications.
# finsang_admin
