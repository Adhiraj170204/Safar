# Safar Backend API

A complete, production-ready REST API for a camping/travel platform with authentication, image upload, and admin features.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Database Models](#database-models)
- [Security Features](#security-features)
- [Admin Features](#admin-features)
- [Testing](#testing)
- [Deployment](#deployment)
- [Documentation](#documentation)

---

## ✨ Features

### Core Features
- 🔐 **JWT Authentication** with HttpOnly cookies
- 🔄 **Refresh Token Rotation** with database storage
- ✉️ **Email Verification** (required before login)
- 🔑 **Password Reset** via email
- 👤 **User Profile Management**
- 🏕️ **Camp CRUD** with image upload
- 🔍 **Advanced Search & Filter** (by tags, cost, location)
- ⭐ **Review System** with ratings
- 🛡️ **Admin Dashboard** with moderation tools
- 📸 **Image Upload** to Cloudinary (streaming)
- 🔒 **Role-Based Access Control** (user/admin)

### Security Features
- Helmet (security headers)
- CORS protection
- XSS protection
- NoSQL injection protection
- Rate limiting (general + strict auth)
- Password hashing (bcrypt, 12 rounds)
- Token reuse detection

---

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express 4.x
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT (jsonwebtoken)
- **Image Storage:** Cloudinary
- **File Upload:** Multer (memoryStorage)
- **Validation:** Zod
- **Email:** Nodemailer
- **Security:** helmet, cors, xss-clean, express-mongo-sanitize, express-rate-limit

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── cloudinary.js          # Cloudinary configuration
│   │   └── multer.js               # Multer setup (memoryStorage)
│   │
│   ├── models/
│   │   ├── user.js                 # User model (auth, profile, tokens)
│   │   ├── camp.js                 # Camp model (with virtuals)
│   │   └── review.js               # Review model
│   │
│   ├── routes/
│   │   ├── user.js                 # Auth & profile routes
│   │   ├── camp.js                 # Camp CRUD routes
│   │   ├── review.js               # Review routes
│   │   └── admin.js                # Admin dashboard routes
│   │
│   ├── utility/
│   │   ├── auth.js                 # Auth middleware & schemas
│   │   ├── authToken.js            # JWT functions
│   │   ├── email.js                # Email sending (nodemailer)
│   │   ├── middleware.js           # Validation & helpers
│   │   └── cloudinaryUpload.js     # Cloudinary streaming upload
│   │
│   ├── seeds/
│   │   ├── seedAdmin.js            # Quick admin seeder
│   │   ├── createAdmin.js          # Interactive admin creator
│   │   └── seeds.js                # Camp data seeder
│   │
│   └── server.js                   # Main server file
│
├── .env                            # Environment variables
├── package.json
└── README.md                       # This file
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)
- Cloudinary account
- Email service (Gmail, SendGrid, etc.)

### Installation

1. **Clone and navigate:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   # Copy and edit .env file
   cp .env.example .env
   ```

4. **Start MongoDB:**
   ```bash
   mongod
   ```

5. **Seed admin user:**
   ```bash
   npm run seed:admin
   ```

6. **Start server:**
   ```bash
   npm start
   ```

Server runs on `http://localhost:3000`

---

## 🔧 Environment Variables

Create a `.env` file in the backend root:

```env
# JWT Configuration
JWT_ACCESS_SECRET=your_64_char_random_string
JWT_REFRESH_SECRET=your_64_char_random_string
JWT_ACCESS_EXPIRES=1h
JWT_REFRESH_EXPIRES=7d

# Security
BCRYPT_ROUNDS=12
COOKIE_DOMAIN=localhost
COOKIE_SECURE=false  # true in production (HTTPS)

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Database
MONGODB_URI=mongodb://localhost:27017/Safar

# Frontend URL
APP_BASE_URL=http://localhost:3000
```

### Generate JWT Secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🌐 API Endpoints

### Authentication (`/api/user`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/signup` | No | Create account |
| GET | `/verify-email?token=` | No | Verify email |
| POST | `/resend-verification` | No | Resend verification |
| POST | `/login` | No | Login (requires verified email) |
| POST | `/logout` | No | Logout |
| POST | `/refresh` | No | Refresh access token |
| POST | `/request-reset` | No | Request password reset |
| POST | `/reset` | No | Reset password |
| GET | `/profile` | Yes | Get user profile |
| PUT | `/profile` | Yes | Update profile |

### Camps (`/api/camp`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/index` | No | List camps (with search/filter) |
| GET | `/:id` | No | Get single camp |
| GET | `/:id/edit` | No | Get camp for editing |
| POST | `/new` | Yes | Create camp |
| PUT | `/:id` | Yes | Update camp (owner/admin) |
| DELETE | `/:id` | Yes | Delete camp (owner/admin) |

### Reviews (`/api/camp/:id/review`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | Get all reviews for camp |
| POST | `/` | Yes | Create review |
| PUT | `/:rid` | Yes | Update review (owner/admin) |
| DELETE | `/:rid` | Yes | Delete review (owner/admin) |

### Admin (`/api/admin`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/stats` | Admin | Dashboard statistics |
| GET | `/users` | Admin | List all users |
| GET | `/users/:id` | Admin | Get single user |
| PUT | `/users/:id/role` | Admin | Update user role |
| DELETE | `/users/:id` | Admin | Delete user |
| GET | `/camps` | Admin | List all camps |
| DELETE | `/camps/:id` | Admin | Delete any camp |
| GET | `/reviews` | Admin | List all reviews |
| DELETE | `/reviews/:id` | Admin | Delete any review |

---

## 🔐 Authentication

### Flow
1. **Signup** → Email verification sent
2. **Verify Email** → Click link in email
3. **Login** → Returns JWT in HttpOnly cookie
4. **Access Protected Routes** → Cookie sent automatically
5. **Refresh Token** → Auto-refresh when access token expires
6. **Logout** → Revokes refresh token

### Token Storage
- **Access Token:** HttpOnly cookie (1 hour)
- **Refresh Token:** HttpOnly cookie (7 days)
- **Refresh Token Hash:** Stored in database

### Example Login:
```bash
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123!"}' \
  -c /tmp/safar-cookies.txt
```

### Example Authenticated Request:
```bash
curl -X GET http://localhost:3000/api/user/profile \
  -b /tmp/safar-cookies.txt
```

---

## 📊 Database Models

### User Model
```javascript
{
  name: String,
  username: String (unique, indexed),
  email: String (unique, indexed),
  password: String (hashed),
  profileImage: { url, public_id },
  role: "user" | "admin",
  verified: Boolean,
  createdCamps: [ObjectId],
  refreshTokens: [{
    tokenHash: String,
    expiresAt: Date,
    revoked: Boolean
  }],
  timestamps: true
}
```

### Camp Model
```javascript
{
  title: String,
  description: String,
  cost: Number,
  location: String,
  images: [{ url, filename }],
  tags: [String] (70+ predefined tags),
  geometry: { type: "Point", coordinates: [lng, lat] },
  user: ObjectId (ref: User),
  review: [ObjectId] (ref: Review),
  
  // Virtual fields
  averageRating: Number (calculated),
  reviewCount: Number (calculated)
}
```

### Review Model
```javascript
{
  rating: Number (1-5),
  review: String,
  camp: ObjectId (ref: Camp),
  user: ObjectId (ref: User)
}
```

---

## 🛡️ Security Features

### Implemented
- ✅ **Helmet** - Security headers
- ✅ **CORS** - Cross-origin protection
- ✅ **XSS Clean** - XSS attack prevention
- ✅ **Mongo Sanitize** - NoSQL injection prevention
- ✅ **Rate Limiting:**
  - General: 100 requests per 15 minutes
  - Auth routes: 5 requests per 15 minutes
- ✅ **Password Hashing** - bcrypt (12 rounds)
- ✅ **JWT Tokens** - HttpOnly cookies
- ✅ **Token Rotation** - Refresh token rotation
- ✅ **Email Verification** - Required before login
- ✅ **Input Validation** - Zod schemas

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 special character

---

## 👑 Admin Features

### Create Admin User
```bash
# Quick seed (uses email from .env)
npm run seed:admin

# Interactive creation
npm run create:admin
```

### Default Admin Credentials
- **Email:** From .env `EMAIL_USER`
- **Username:** `admin`
- **Password:** `Admin@123`
- **Role:** `admin`

### Admin Capabilities
- View dashboard statistics
- Manage all users (view, update role, delete)
- Delete any camp
- Delete any review
- Bypass ownership checks

---

## 🧪 Testing

### Manual Testing with cURL

**1. Signup:**
```bash
curl -X POST http://localhost:3000/api/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "username": "testuser",
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

**2. Login:**
```bash
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}' \
  -c /tmp/safar-cookies.txt
```

**3. Create Camp:**
```bash
curl -X POST http://localhost:3000/api/camp/new \
  -b /tmp/safar-cookies.txt \
  -F "title=Mountain Camp" \
  -F "description=Beautiful mountain views" \
  -F "cost=500" \
  -F "location=Himalayas" \
  -F "tags=mountain,hiking" \
  -F "images=@/path/to/image.jpg"
```

**4. Search Camps:**
```bash
curl -X GET "http://localhost:3000/api/camp/index?search=mountain&tags=hiking&minCost=100&maxCost=1000"
```

**5. Admin Stats:**
```bash
curl -X GET http://localhost:3000/api/admin/stats -b /tmp/safar-cookies.txt
```

### Using Postman/Thunder Client
1. Import endpoints from the [API Endpoints](#-api-endpoints) section above
2. Enable "Save cookies"
3. Test all routes

---

## 🚀 Deployment

### Production Checklist

**1. Environment Variables:**
- [ ] Generate strong JWT secrets
- [ ] Set `COOKIE_SECURE=true`
- [ ] Use production MongoDB URI
- [ ] Configure production email service
- [ ] Update `APP_BASE_URL` to production domain

**2. Security:**
- [ ] Enable HTTPS
- [ ] Update CORS origin to production frontend
- [ ] Review rate limiting settings
- [ ] Set up database backups
- [ ] Add logging and monitoring

**3. Database:**
- [ ] Use MongoDB Atlas or production MongoDB
- [ ] Set up indexes
- [ ] Configure connection pooling
- [ ] Enable authentication

**4. Cloudinary:**
- [ ] Verify upload limits
- [ ] Set up transformations
- [ ] Configure auto-backup

### Deploy to Heroku (Example)
```bash
# Install Heroku CLI
heroku login
heroku create safar-backend

# Set environment variables
heroku config:set JWT_ACCESS_SECRET=your_secret
heroku config:set MONGODB_URI=your_mongodb_uri
# ... set all other env vars

# Deploy
git push heroku main
```

### Deploy to Railway/Render
1. Connect GitHub repository
2. Set environment variables in dashboard
3. Deploy automatically on push

---

## 🔧 NPM Scripts

```bash
npm start              # Start server
npm run seed:admin     # Seed admin user (quick)
npm run create:admin   # Create admin (interactive)
npm run seed:camps     # Seed sample camps
```

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB
mongod
```

### Email Not Sending
- Verify EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS
- For Gmail: Enable 2FA and use App Password
- Check firewall/antivirus blocking port 587

### Cloudinary Upload Fails
- Verify CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET
- Check upload limits on Cloudinary dashboard

### Port Already in Use
```bash
# Kill process on port 3000
# Windows:
taskkill /F /IM node.exe

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📝 License

This project is licensed under the ISC License.

---

## 👨‍💻 Author

**Adhiraj Dubey**
- Email: adhirajdubey17ad@gmail.com

---

## 🙏 Acknowledgments

- Express.js team
- MongoDB team
- Cloudinary
- All open-source contributors

---

## 📞 Support

For issues and questions:
1. Review this README and the [root README](../README.md)
2. Review the troubleshooting section above
3. Open an issue on GitHub

---

**Built with ❤️ for the Safar camping platform**
