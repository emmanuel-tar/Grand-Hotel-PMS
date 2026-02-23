# Grand Imperial Hotel - Production Setup Guide

## Prerequisites
- Node.js 14+ 
- npm 6+

## Installation

### 1. Install Dependencies (Both Frontend & Backend)
```
bash
npm run install:all
```

Or manually:
```
bash
npm install
cd server && npm install
```

### 2. Development Mode
```
bash
# Run both frontend and backend concurrently
npm run dev

# Or separately:
npm start          # Frontend on http://localhost:3000
cd server && npm start  # Backend on http://localhost:5000
```

### 3. Production Build
```
bash
# Build frontend
npm run build

# This creates optimized build in /build folder
```

### 4. Run Production Server
```
bash
# Start backend only (frontend served from /build)
cd server && npm run prod
```

## Environment Variables (Optional)

Create `.env` in server folder:
```
PORT=5000
NODE_ENV=production
JWT_SECRET=your-secret-key
```

## Project Structure
```
/                    - React Frontend
├── src/             - React source code
├── build/           - Production build (generated)
├── public/          - Static assets
└── server/          - Backend
    ├── index.js     - Server entry
    ├── database/    - SQLite database
    └── routes/      - API routes
```

## Features Included
- ✅ Room Management (50 rooms with Naira pricing)
- ✅ Restaurant POS
- ✅ Inventory Management  
- ✅ Guest Management
- ✅ Bookings & Reservations
- ✅ Invoice Generation & Printing
- ✅ Staff Management
- ✅ Maintenance Requests
- ✅ Database Backup/Export/Import
- ✅ Dark/Light Theme
- ✅ User Authentication (RBAC)

## Default Login Credentials
- Admin: admin / admin123
- Manager: manager / manager123
- Front Desk: frontdesk / frontdesk123

## Database
- SQLite (file-based, no setup required)
- Location: `server/database/hotel.db`
- Auto-creates on first run

## Troubleshooting
1. Port already in use: Kill process on port 3000/5000
2. Database errors: Delete `server/database/hotel.db` to reset
3. Build errors: Clear node_modules and reinstall
