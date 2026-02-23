# Grand Imperial Hotel Management System

A comprehensive hotel management system built with React (frontend) and Node.js/Express (backend).

![Version](https://img.shields.io/badge/version-5.0.0-blue)
![Node](https://img.shields.io/badge/node-14%2B-green)
![React](https://img.shields.io/badge/react-18.2-blue)

## Features

- 🏨 **Room Management** - 50 rooms with Naira pricing (Standard, Deluxe, Suite, Executive)
- 🍽️ **Restaurant POS** - Menu management and order processing
- 📦 **Inventory Management** - Stock tracking and alerts
- 👥 **Guest Management** - Guest profiles and history
- 📅 **Bookings & Reservations** - Online booking system
- 🧾 **Invoice Generation & Printing** - Auto-print on checkout
- 👨‍💼 **Staff Management** - Staff CRUD operations
- 🔧 **Maintenance Requests** - Track room/facility issues
- 💾 **Database Backup/Export/Import** - Data management
- 🌙 **Dark/Light Theme** - User preference
- 🔐 **User Authentication** - Role-based access control (Admin, Manager, Front Desk, Housekeeping)

## Quick Start

### Development Mode

```
bash
# Install all dependencies
npm run install:all

# Or manually
npm install
cd server && npm install

# Run development (both frontend & backend)
npm run dev

# Or run separately:
npm start          # Frontend: http://localhost:3000
cd server && npm start  # Backend: http://localhost:5000
```

### Production Mode

```
bash
# Build frontend
npm run build

# This creates optimized production build in /build folder

# Start production server
cd server && npm run prod
```

The production server will serve both the API and the built frontend.

## Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Manager | manager | manager123 |
| Front Desk | frontdesk | frontdesk123 |

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify token

### Rooms
- `GET /api/rooms` - List all rooms
- `POST /api/rooms` - Create room
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room

### Guests
- `GET /api/guests` - List guests
- `POST /api/guests` - Create guest
- `PUT /api/guests/:id` - Update guest
- `DELETE /api/guests/:id` - Delete guest

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice

### Restaurant
- `GET /api/restaurant/menu` - Get menu
- `POST /api/restaurant/order` - Create order

### Inventory
- `GET /api/inventory` - List inventory
- `POST /api/inventory` - Add item
- `PUT /api/inventory/:id` - Update item

### Staff
- `GET /api/staff` - List staff
- `POST /api/staff` - Add staff
- `PUT /api/staff/:id` - Update staff
- `DELETE /api/staff/:id` - Remove staff

### Maintenance
- `GET /api/maintenance` - List requests
- `POST /api/maintenance` - Create request
- `PUT /api/maintenance/:id` - Update request

### Settings
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings
- `POST /api/settings/backup` - Create backup
- `GET /api/settings/export` - Export database
- `POST /api/settings/import` - Import database

## Project Structure

```
/
├── public/                 # React static assets
├── src/                   # React source code
│   ├── App.jsx           # Main application
│   └── index.js          # React entry point
├── server/               # Backend
│   ├── index.js          # Express server
│   ├── database/
│   │   ├── db.js        # SQLite database
│   │   └── backups/     # Database backups
│   └── routes/          # API routes
├── build/               # Production build (generated)
├── package.json         # Frontend dependencies
├── PRODUCTION.md       # Production setup guide
└── README.md           # This file
```

## Technology Stack

### Frontend
- React 18.2
- React Scripts 5.0

### Backend
- Node.js 14+
- Express.js 4.18
- SQLite (better-sqlite3)

### Security
- JWT Authentication
- Helmet (production)
- Bcryptjs (password hashing)

## Environment Variables

Create `.env` in server folder:

```
env
PORT=5000
NODE_ENV=production
JWT_SECRET=your-secret-key-here
```

## Troubleshooting

### Port Already in Use
```
bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

### Database Issues
Delete `server/database/hotel.db` to reset:
```
bash
rm server/database/hotel.db
```

### Build Errors
Clear and reinstall:
```
bash
rm -rf node_modules
rm -rf server/node_modules
npm run install:all
```

## License

Private - All rights reserved
