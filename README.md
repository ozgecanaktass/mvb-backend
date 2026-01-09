# Eyewear Dealer Management & B2C Tracking System (MVP)

A comprehensive backend platform designed for an eyewear manufacturer to manage B2B dealer networks, process custom orders, and track B2C customer engagement through unique link analytics.

Built with a **Modular Monolith** architecture, transitioning to a **Serverless (Firebase)** infrastructure, ensuring scalability, security, and ease of maintenance.

## 🚀 Key Features

### 🔐 Multi-Tenant Authentication & Security
- **Role-Based Access Control (RBAC)**: Hierarchical roles for Producer Admin, Dealer Admin, and Dealer User.
- **Data Isolation**: Strict data privacy ensuring dealers can only access their own orders and appointments.
- **Secure Auth**: Integration with Firebase Authentication for robust identity management.
- **Password Management**: Secure password change functionality for all users.

### 🏪 Dealer Management (B2B)
- **Dealer Onboarding**: Producers can create and manage dealer accounts.
- **Unique Tracking Links**: Automatic generation of unpredictable UUID Hashes for each dealer, enabling precise B2C traffic attribution.

### 📦 Order Processing
- **Flexible Schema**: Supports complex and variable product configurations (lens type, coating, frame material) using a JSON-based structure (Schema-less), making the system future-proof against product changes.
- **Order Lifecycle**: Complete flow from creation to status updates (Pending -> In Production -> Shipped).

### 📅 Appointment System
- **Service Management**: Dealers can schedule appointments for Eye Exams, Styling Sessions, or Adjustments.
- **Dealer-Specific Calendar**: Appointments are isolated per dealer, ensuring privacy and organization.

### 📊 Analytics & Tracking (B2C)
- **Smart Redirection**: Redirects customers to the Configurator with the correct dealer attribution.
- **Server-Side Tracking**: Integrates with Google Analytics 4 (GA4) Measurement Protocol to log visits without client-side scripts.
- **Spam Protection**: In-memory rate limiting to prevent fraudulent clicks.

### ☁️ File Storage
- **Cloudflare R2 Integration**: Secure and cost-effective storage for dealer logos, contracts, and product images.
- **Drag & Drop Upload**: Easy-to-use file manager within the Admin Panel.

## 🛠️ Tech Stack & Architecture

- **Runtime**: Node.js (v18+)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: Google Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth
- **Analytics**: Google Analytics 4 (GA4)
- **Storage**: Cloudflare R2 (AWS SDK Compatible)
- **Documentation**: Swagger / OpenAPI
- **Simulation**: Custom HTML/JS Admin Dashboard

## ⚙️ Installation & Setup

### 1. Prerequisites
Ensure you have the following installed:
- Node.js (v18 or higher)
- npm

### 2. Clone the Repository
```bash
git clone <repository-url>
cd eyewear-backend
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configuration (.env)
Create a `.env` file in the root directory and configure the following variables:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your_super_secret_key_here

# Firebase Configuration (Path to Service Account Key)
FIREBASE_SERVICE_ACCOUNT_PATH="./src/config/serviceAccountKey.json"
FIREBASE_API_KEY="AIzaSy..."

# Google Analytics 4 (GA4)
GA4_MEASUREMENT_ID="G-XXXXXXXXXX"
GA4_API_SECRET="your_ga4_api_secret"

# Cloudflare R2 Storage
R2_ACCESS_KEY_ID="your_r2_access_key"
R2_SECRET_ACCESS_KEY="your_r2_secret_key"
R2_BUCKET_NAME="eyewear-assets"
R2_ENDPOINT="https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
R2_PUBLIC_URL="https://pub-<random_id>.r2.dev"
```

> **Note**: You need to place your `serviceAccountKey.json` file (from Firebase Console) into the `src/config/` directory.

## 🚀 Running the Application

### Development Mode
Starts the server with hot-reloading enabled.
```bash
npm run dev
```

### Database Seeding (Optional)
Populates Firestore with initial data and an Admin user.
```bash
npm run db:seed
```

### Production Build
```bash
npm run build
npm start
```

## 📖 Usage & Documentation

### 1. API Documentation (Swagger)
Access the interactive API documentation to test endpoints directly.
- **URL**: [http://localhost:3000/docs](http://localhost:3000/docs)

### 2. Admin Panel Simulator
A built-in frontend dashboard to simulate user flows (Login, Orders, Appointments, File Upload).
- **URL**: [http://localhost:3000/](http://localhost:3000/)

**Default Admin Credentials:**
- **Email**: `admin@uretici.com`
- **Password**: `admin-sifresi`

## 🧪 Testing
The project includes end-to-end test scenarios.

### Manual Testing via Simulator
1. Open [http://localhost:3000/](http://localhost:3000/).
2. Log in as **Admin** to create Dealers and Dealer Admins.
3. Log in as **Dealer Admin** to create Staff and manage Orders.
4. Log in as **Staff** to create Orders and Appointments.
5. Upload files via the File Manager tab to test Cloudflare R2 integration.

### API Testing via Swagger
Use the Swagger UI (`/docs`) to execute raw HTTP requests against the API endpoints.

## 📂 Project Structure

```
src/
├── config/             # Firebase & Database configuration
├── docs/               # Swagger JSON documentation
├── middlewares/        # Auth & Error handling middlewares
├── modules/            # Feature modules (Auth, Dealers, Orders, etc.)
│   ├── analytics/
│   ├── appointments/
│   ├── auth/
│   ├── dealers/
│   ├── orders/
│   └── storage/
├── scripts/            # Database seeding scripts
├── shared/             # Shared models, utils, and database clients
├── app.ts              # Express app setup
└── server.ts           # Server entry point
```

---
**Developed by:** Özgecan Aktaş  
**Date:** January 2026