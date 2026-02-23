// Grand Imperial Hotel Management System - Backend Server
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const guestRoutes = require('./routes/guests');
const invoiceRoutes = require('./routes/invoices');
const restaurantRoutes = require('./routes/restaurant');
const inventoryRoutes = require('./routes/inventory');
const settingsRoutes = require('./routes/settings');
const staffRoutes = require('./routes/staff');
const maintenanceRoutes = require('./routes/maintenance');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/maintenance', maintenanceRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🏨 Grand Imperial Hotel Backend running on port ${PORT}`);
});

module.exports = app;
