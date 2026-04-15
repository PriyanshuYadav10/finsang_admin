# FinsangMart Backend API

A secure Node.js/Express backend API for FinsangMart with Supabase integration and role-based authentication.

## Features

- 🔐 **Role-Based Authentication**: Secure email/password authentication with role-based access control
- 🛡️ **Security**: JWT tokens, rate limiting, input validation, CORS protection
- 📧 **Email Authentication**: Admin panel uses email/password authentication
- 🗄️ **Supabase Integration**: All database operations through Supabase
- 📁 **File Upload**: Secure file upload to specific Supabase Storage buckets
- 🔄 **RESTful API**: Clean, consistent API endpoints
- 📊 **Pagination**: Built-in pagination for all list endpoints
- 🎯 **Input Validation**: Comprehensive request validation
- 📝 **Logging**: Request logging and error tracking

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase project with configured tables
- Supabase Storage buckets: `card-images`, `grow-data`, `finsangmart-storage`

## Installation

1. **Navigate to the API directory**:
   ```bash
   cd finsang-next-admin/api
   ```

2. **Run the setup script**:
   ```bash
   npm run setup
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081,https://yourdomain.com

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Role Configuration
DEFAULT_USER_ROLE=user
ADMIN_ROLES=admin,moderator
```

## API Endpoints

### Authentication

- `POST /api/auth/admin/signup` - Create initial admin user
- `POST /api/auth/admin/signin` - Admin sign in with email/password
- `GET /api/auth/session` - Get current user session
- `POST /api/auth/signout` - Sign out user
- `POST /api/auth/user` - Create/update user profile
- `GET /api/auth/user` - Get user profile
- `PUT /api/auth/user/:userId/role` - Update user role (Admin only)
- `GET /api/auth/users` - Get all users (Admin only)

### Products

- `GET /api/products` - Get all products with pagination
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product (Moderator/Admin)
- `PUT /api/products/:id` - Update product (Moderator/Admin)
- `DELETE /api/products/:id` - Delete product (Admin only)
- `GET /api/products/types/all` - Get all product types
- `POST /api/products/types` - Create product type (Admin only)
- `DELETE /api/products/types/:type` - Delete product type (Admin only)
- `POST /api/products/compare` - Compare products

### Training

- `GET /api/training/categories` - Get all training categories
- `POST /api/training/categories` - Create training category (Moderator/Admin)
- `DELETE /api/training/categories/:id` - Delete training category (Admin only)
- `GET /api/training/videos` - Get all training videos
- `GET /api/training/videos/:categoryId` - Get videos by category
- `POST /api/training/videos` - Create training video (Moderator/Admin)
- `PUT /api/training/videos/:id` - Update training video (Moderator/Admin)
- `DELETE /api/training/videos/:id` - Delete training video (Admin only)
- `GET /api/training/videos/single/:id` - Get training video by ID

### Grow Content

- `GET /api/grow/categories` - Get all grow categories
- `POST /api/grow/categories` - Create grow category (Moderator/Admin)
- `DELETE /api/grow/categories/:id` - Delete grow category (Admin only)
- `GET /api/grow/posters` - Get all grow posters
- `GET /api/grow/posters/:categoryId` - Get posters by category
- `POST /api/grow/posters` - Create grow poster (Moderator/Admin)
- `PUT /api/grow/posters/:id` - Update grow poster (Moderator/Admin)
- `DELETE /api/grow/posters/:id` - Delete grow poster (Admin only)
- `GET /api/grow/posters/single/:id` - Get grow poster by ID

### Storage

- `POST /api/storage/profile-image` - Upload profile image (finsangmart-storage bucket)
- `DELETE /api/storage/profile-image` - Delete profile image
- `POST /api/storage/product-image` - Upload product image (card-images bucket)
- `DELETE /api/storage/product-image/:fileName` - Delete product image
- `POST /api/storage/grow-poster` - Upload grow poster (grow-data bucket)
- `DELETE /api/storage/grow-poster/:fileName` - Delete grow poster
- `POST /api/storage/upload` - Upload general file (finsangmart-storage bucket)
- `GET /api/storage/file/:fileName` - Get file info
- `DELETE /api/storage/file/:fileName` - Delete file

## Authentication

### User Roles

The API supports role-based access control with the following roles:

- **user**: Basic user with read access to public content
- **moderator**: Can create and update content (products, training, grow)
- **admin**: Full access including deletion and user management

### Admin Authentication

The admin panel uses email/password authentication:

1. **Initial Admin Setup**: Use `/api/auth/admin/signup` to create the first admin
2. **Admin Sign In**: Use `/api/auth/admin/signin` for subsequent logins
3. **Role Assignment**: Only users with admin/moderator roles can access admin features

### JWT Token

Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Request Examples

### Admin Sign Up (Initial Setup)
```bash
curl -X POST http://localhost:3001/api/auth/admin/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@finsangmart.com",
    "password": "securepassword123",
    "name": "Admin User"
  }'
```

### Admin Sign In
```bash
curl -X POST http://localhost:3001/api/auth/admin/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@finsangmart.com",
    "password": "securepassword123"
  }'
```

### Get Products (with authentication)
```bash
curl -X GET http://localhost:3001/api/products \
  -H "Authorization: Bearer <your_jwt_token>"
```

### Create Product (Moderator/Admin only)
```bash
curl -X POST http://localhost:3001/api/products \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sample Product",
    "description": "Product description",
    "type": "credit_card",
    "features": ["feature1", "feature2"],
    "benefits": ["benefit1", "benefit2"],
    "requirements": ["requirement1"],
    "image_url": "https://example.com/image.jpg"
  }'
```

### Upload Product Image
```bash
curl -X POST http://localhost:3001/api/storage/product-image \
  -H "Authorization: Bearer <your_jwt_token>" \
  -F "image=@/path/to/image.jpg"
```

### Upload Grow Poster
```bash
curl -X POST http://localhost:3001/api/storage/grow-poster \
  -H "Authorization: Bearer <your_jwt_token>" \
  -F "image=@/path/to/poster.jpg"
```

## Configuration

### Supabase Setup

1. **Create required tables** in your Supabase project:
   - `products`
   - `product_types`
   - `training_categories`
   - `training_videos`
   - `grow_categories`
   - `grow_posters`

2. **Set up Row Level Security (RLS)** policies for each table

3. **Create storage buckets**:
   - `card-images` - For product images uploaded through the product tab
   - `grow-data` - For poster images uploaded through the grow tab
   - `finsangmart-storage` - For general files and profile images

### Storage Bucket Configuration

The API uses specific Supabase Storage buckets:

- **card-images**: Product images from the Products tab
- **grow-data**: Poster images from the Grow tab
- **finsangmart-storage**: Profile images and general files

### Role Assignment

Users are assigned the default role (`user`) upon registration. To assign admin roles:

1. **Via API** (Admin only):
   ```bash
   curl -X PUT http://localhost:3001/api/auth/user/{userId}/role \
     -H "Authorization: Bearer <admin_jwt_token>" \
     -H "Content-Type: application/json" \
     -d '{"role": "admin"}'
   ```

2. **Via Supabase Dashboard**: Update user metadata directly

## Development

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run setup` - Run setup script

### Project Structure

```
api/
├── config/
│   └── supabase.js          # Supabase client configuration
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── validation.js        # Input validation middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── products.js          # Product management routes
│   ├── training.js          # Training content routes
│   ├── grow.js              # Grow content routes
│   └── storage.js           # File upload routes
├── client/
│   └── api-client.js        # Frontend API client
├── server.js                # Main application file
├── setup.js                 # Setup script
├── package.json             # Dependencies and scripts
├── .env                     # Environment variables
└── README.md               # This file
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Different permissions for different user roles
- **Email/Password Authentication**: Secure admin authentication
- **Rate Limiting**: Prevents abuse and DDoS attacks
- **Input Validation**: Validates all incoming requests
- **CORS Protection**: Configurable cross-origin resource sharing
- **Security Headers**: Helmet middleware for security headers
- **File Upload Security**: File type and size validation

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details (if available)"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Monitoring

The API includes:
- Request logging with Morgan
- Error tracking
- Health check endpoint (`GET /health`)
- Graceful shutdown handling

## Deployment

1. **Set environment variables** for production
2. **Install dependencies**: `npm install --production`
3. **Start the server**: `npm start`
4. **Use a process manager** like PM2 for production

## Frontend Integration

Use the provided API client for easy frontend integration:

```javascript
import FinsangMartAPI from './api/client/api-client.js';

const api = new FinsangMartAPI('http://localhost:3001/api');

// Admin Authentication
await api.adminSignup('admin@finsangmart.com', 'password123', 'Admin User');
const response = await api.adminSignin('admin@finsangmart.com', 'password123');

// Set token for authenticated requests
api.setToken(response.token);

// Make authenticated requests
const products = await api.getProducts();

// Upload files
const productImage = await api.uploadProductImage(file);
const growPoster = await api.uploadGrowPoster(file);
```

## Support

For issues and questions:
1. Check the Supabase documentation
2. Review the API logs
3. Test endpoints with curl or Postman
4. Verify environment variables are set correctly

## License

MIT License - see LICENSE file for details. 