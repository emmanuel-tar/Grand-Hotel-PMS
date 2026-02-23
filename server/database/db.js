const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'hotel-data.json');
const backupDir = path.join(__dirname, 'backups');

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Initialize data store
let data = {
  users: [],
  rooms: [],
  guests: [],
  bookings: [],
  invoices: [],
  restaurant_orders: [],
  inventory: [],
  staff: [],
  maintenance_requests: [],
  settings: {}
};

// Data validation rules
const validationRules = {
  users: {
    required: ['username', 'password', 'role', 'name'],
    unique: ['username'],
    role: ['admin', 'manager', 'frontdesk', 'housekeeping']
  },
  rooms: {
    required: ['number', 'type', 'status', 'price'],
    type: ['standard', 'deluxe', 'suite', 'executive'],
    status: ['available', 'occupied', 'maintenance', 'reserved']
  },
  guests: {
    required: ['name', 'phone'],
    email: ['email']
  },
  bookings: {
    required: ['guest_id', 'room_id', 'check_in', 'check_out', 'status'],
    status: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled']
  },
  staff: {
    required: ['name', 'role', 'phone', 'email'],
    role: ['manager', 'receptionist', 'housekeeper', 'chef', 'security', 'maintenance']
  },
  maintenance_requests: {
    required: ['room_id', 'description', 'priority', 'status'],
    priority: ['low', 'medium', 'high', 'urgent'],
    status: ['pending', 'in_progress', 'completed', 'cancelled']
  }
};

// Validate data before insertion/update
function validate(table, item) {
  const errors = [];
  const rules = validationRules[table];
  
  if (!rules) return { valid: true, errors: [] };
  
  // Check required fields
  if (rules.required) {
    for (const field of rules.required) {
      if (!item[field] && item[field] !== 0) {
        errors.push(`Required field missing: ${field}`);
      }
    }
  }
  
  // Check enum values
  if (rules.status && item.status && !rules.status.includes(item.status)) {
    errors.push(`Invalid status: ${item.status}. Must be one of: ${rules.status.join(', ')}`);
  }
  if (rules.type && item.type && !rules.type.includes(item.type)) {
    errors.push(`Invalid type: ${item.type}. Must be one of: ${rules.type.join(', ')}`);
  }
  if (rules.role && item.role && !rules.role.includes(item.role)) {
    errors.push(`Invalid role: ${item.role}. Must be one of: ${rules.role.join(', ')}`);
  }
  if (rules.priority && item.priority && !rules.priority.includes(item.priority)) {
    errors.push(`Invalid priority: ${item.priority}. Must be one of: ${rules.priority.join(', ')}`);
  }
  
  // Check email format
  if (rules.email && item.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email)) {
    errors.push('Invalid email format');
  }
  
  return { valid: errors.length === 0, errors };
}

// Create backup
function createBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `hotel-data-${timestamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    console.log(`Backup created: ${backupPath}`);
    
    // Keep only last 10 backups
    const backups = fs.readdirSync(backupDir).filter(f => f.endsWith('.json')).sort().reverse();
    while (backups.length > 10) {
      const oldBackup = backups.pop();
      fs.unlinkSync(path.join(backupDir, oldBackup));
      console.log(`Old backup removed: ${oldBackup}`);
    }
    
    return { success: true, path: backupPath };
  } catch (err) {
    console.error('Backup failed:', err.message);
    return { success: false, error: err.message };
  }
}

// Export data
function exportData() {
  return JSON.stringify(data, null, 2);
}

// Import data
function importData(jsonString) {
  try {
    const imported = JSON.parse(jsonString);
    
    // Validate imported data structure
    const requiredTables = ['users', 'rooms', 'guests', 'bookings', 'invoices', 'restaurant_orders', 'inventory', 'staff', 'maintenance_requests', 'settings'];
    for (const table of requiredTables) {
      if (!imported[table]) {
        imported[table] = [];
      }
    }
    
    // Validate each table
    for (const [table, items] of Object.entries(imported)) {
      if (Array.isArray(items)) {
        for (const item of items) {
          const validation = validate(table, item);
          if (!validation.valid) {
            throw new Error(`Validation failed for ${table}: ${validation.errors.join(', ')}`);
          }
        }
      }
    }
    
    data = imported;
    saveData();
    return { success: true, message: 'Data imported successfully' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Load data from file if exists
function loadData() {
  try {
    if (fs.existsSync(dbPath)) {
      const fileData = fs.readFileSync(dbPath, 'utf8');
      data = JSON.parse(fileData);
      
      // Ensure all tables exist
      const requiredTables = ['users', 'rooms', 'guests', 'bookings', 'invoices', 'restaurant_orders', 'inventory', 'staff', 'maintenance_requests', 'settings'];
      for (const table of requiredTables) {
        if (!data[table]) {
          data[table] = table === 'settings' ? {} : [];
        }
      }
      
      console.log('Database loaded from file');
    } else {
      initializeDefaultData();
      saveData();
    }
  } catch (err) {
    console.log('Error loading database, initializing defaults:', err.message);
    initializeDefaultData();
    saveData();
  }
}

// Initialize default data with Naira prices and expanded data
function initializeDefaultData() {
  // Default admin user
  data.users = [
    {
      id: 1,
      username: 'admin',
      password: bcrypt.hashSync('admin123', 10),
      role: 'admin',
      name: 'Administrator',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      username: 'manager',
      password: bcrypt.hashSync('manager123', 10),
      role: 'manager',
      name: 'Hotel Manager',
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      username: 'frontdesk',
      password: bcrypt.hashSync('front123', 10),
      role: 'frontdesk',
      name: 'Front Desk Agent',
      created_at: new Date().toISOString()
    }
  ];

  // Default settings - Updated for Naira
  data.settings = {
    hotel_name: 'Grand Imperial Hotel',
    currency: '₦',
    currency_code: 'NGN',
    tax_rate: 10,
    service_charge: 5,
    printer_default: '',
    printer_paper_size: 'A4',
    printer_orientation: 'portrait',
    printer_include_header: 'false',
    auto_print_checkin: false,
    auto_print_checkout: false
  };

  // Sample rooms with Naira prices (50 rooms)
  const roomTypes = [
    { type: 'standard', price: 60000, label: 'Standard Room', beds: '1 King', amenities: ['WiFi', 'TV', 'AC'] },
    { type: 'deluxe', price: 95000, label: 'Deluxe Room', beds: '1 King + 1 Single', amenities: ['WiFi', 'TV', 'AC', 'Mini Bar'] },
    { type: 'suite', price: 160000, label: 'Suite', beds: '2 Kings', amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Jacuzzi', 'Balcony'] },
    { type: 'executive', price: 125000, label: 'Executive Suite', beds: '1 King', amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Work Desk', 'Lounge Area'] }
  ];

  data.rooms = [];
  let roomId = 1;
  
  // Floors 1-2: Standard rooms (20 rooms)
  for (let i = 1; i <= 20; i++) {
    data.rooms.push({
      id: roomId++,
      number: `10${i}`,
      type: 'standard',
      status: Math.random() > 0.7 ? 'occupied' : 'available',
      price: 60000,
      floor: Math.ceil(i / 10),
      amenities: ['WiFi', 'TV', 'AC'],
      created_at: new Date().toISOString()
    });
  }
  
  // Floors 3-4: Deluxe rooms (15 rooms)
  for (let i = 1; i <= 15; i++) {
    data.rooms.push({
      id: roomId++,
      number: `20${i}`,
      type: 'deluxe',
      status: Math.random() > 0.7 ? 'occupied' : 'available',
      price: 95000,
      floor: 2 + Math.ceil(i / 10),
      amenities: ['WiFi', 'TV', 'AC', 'Mini Bar'],
      created_at: new Date().toISOString()
    });
  }
  
  // Floor 5: Suites (10 rooms)
  for (let i = 1; i <= 10; i++) {
    data.rooms.push({
      id: roomId++,
      number: `30${i}`,
      type: 'suite',
      status: Math.random() > 0.8 ? 'occupied' : 'available',
      price: 160000,
      floor: 3,
      amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Jacuzzi', 'Balcony'],
      created_at: new Date().toISOString()
    });
  }
  
  // Floor 6: Executive Suites (5 rooms)
  for (let i = 1; i <= 5; i++) {
    data.rooms.push({
      id: roomId++,
      number: `40${i}`,
      type: 'executive',
      status: Math.random() > 0.8 ? 'occupied' : 'available',
      price: 125000,
      floor: 4,
      amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Work Desk', 'Lounge Area'],
      created_at: new Date().toISOString()
    });
  }

  // Sample guests (expanded)
  data.guests = [
    { id: 1, name: 'John Smith', email: 'john.smith@email.com', phone: '08012345601', address: '123 Main Street, Lagos', loyalty_points: 150, created_at: new Date().toISOString() },
    { id: 2, name: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '08012345602', address: '456 Oak Avenue, Abuja', loyalty_points: 300, created_at: new Date().toISOString() },
    { id: 3, name: 'Michael Brown', email: 'm.brown@email.com', phone: '08012345603', address: '789 Pine Road, Lagos', loyalty_points: 75, created_at: new Date().toISOString() },
    { id: 4, name: 'Emily Davis', email: 'emily.d@email.com', phone: '08012345604', address: '321 Cedar Lane, Port Harcourt', loyalty_points: 500, created_at: new Date().toISOString() },
    { id: 5, name: 'David Wilson', email: 'd.wilson@email.com', phone: '08012345605', address: '654 Maple Drive, Kano', loyalty_points: 200, created_at: new Date().toISOString() },
    { id: 6, name: 'Jennifer Taylor', email: 'j.taylor@email.com', phone: '08012345606', address: '987 Birch Street, Ibadan', loyalty_points: 450, created_at: new Date().toISOString() },
    { id: 7, name: 'Robert Anderson', email: 'r.anderson@email.com', phone: '08012345607', address: '147 Elm Court, Benin City', loyalty_points: 125, created_at: new Date().toISOString() },
    { id: 8, name: 'Lisa Martinez', email: 'l.martinez@email.com', phone: '08012345608', address: '258 Walnut Way, Kaduna', loyalty_points: 350, created_at: new Date().toISOString() },
    { id: 9, name: 'James Garcia', email: 'j.garcia@email.com', phone: '08012345609', address: '369 Cherry Lane, Jos', loyalty_points: 80, created_at: new Date().toISOString() },
    { id: 10, name: 'Mary Robinson', email: 'm.robinson@email.com', phone: '08012345610', address: '741 Spruce Street, Enugu', loyalty_points: 600, created_at: new Date().toISOString() }
  ];

  // Sample bookings
  data.bookings = [
    { id: 1, guest_id: 1, room_id: 3, check_in: '2024-01-15', check_out: '2024-01-18', status: 'checked_in', total: 285000, created_at: new Date().toISOString() },
    { id: 2, guest_id: 2, room_id: 22, check_in: '2024-01-20', check_out: '2024-01-22', status: 'confirmed', total: 190000, created_at: new Date().toISOString() },
    { id: 3, guest_id: 3, room_id: 35, check_in: '2024-01-25', check_out: '2024-01-28', status: 'pending', total: 480000, created_at: new Date().toISOString() }
  ];

  // Sample invoices
  data.invoices = [
    { id: 1, booking_id: 1, guest_id: 1, room_id: 3, amount: 285000, status: 'paid', created_at: new Date().toISOString() }
  ];

  // Sample staff
  data.staff = [
    { id: 1, name: 'Abiodun Okonkwo', role: 'manager', email: 'abiodun@hotel.com', phone: '08020000001', salary: 350000, hire_date: '2020-01-15', status: 'active', created_at: new Date().toISOString() },
    { id: 2, name: 'Chioma Adeyemi', role: 'receptionist', email: 'chioma@hotel.com', phone: '08020000002', salary: 150000, hire_date: '2021-03-20', status: 'active', created_at: new Date().toISOString() },
    { id: 3, name: 'Emeka Nwachukwu', role: 'housekeeper', email: 'emeka@hotel.com', phone: '08020000003', salary: 80000, hire_date: '2021-06-10', status: 'active', created_at: new Date().toISOString() },
    { id: 4, name: 'Fatima Ibrahim', role: 'chef', email: 'fatima@hotel.com', phone: '08020000004', salary: 200000, hire_date: '2020-08-05', status: 'active', created_at: new Date().toISOString() },
    { id: 5, name: 'Sunday Musa', role: 'security', email: 'sunday@hotel.com', phone: '08020000005', salary: 75000, hire_date: '2021-01-01', status: 'active', created_at: new Date().toISOString() },
    { id: 6, name: 'Grace Oyedeji', role: 'housekeeper', email: 'grace@hotel.com', phone: '08020000006', salary: 80000, hire_date: '2022-02-15', status: 'active', created_at: new Date().toISOString() },
    { id: 7, name: 'Patrick Olufemi', role: 'maintenance', email: 'patrick@hotel.com', phone: '08020000007', salary: 95000, hire_date: '2021-09-01', status: 'active', created_at: new Date().toISOString() },
    { id: 8, name: 'Amaka Chukwu', role: 'receptionist', email: 'amaka@hotel.com', phone: '08020000008', salary: 150000, hire_date: '2022-04-10', status: 'active', created_at: new Date().toISOString() }
  ];

  // Sample maintenance requests
  data.maintenance_requests = [
    { id: 1, room_id: 5, description: 'AC not cooling properly', priority: 'high', status: 'in_progress', reported_by: 'Guest', assigned_to: 'Patrick Olufemi', created_at: new Date().toISOString() },
    { id: 2, room_id: 12, description: 'Leaking faucet in bathroom', priority: 'medium', status: 'pending', reported_by: 'Housekeeping', assigned_to: null, created_at: new Date().toISOString() },
    { id: 3, room_id: 28, description: 'TV remote not working', priority: 'low', status: 'completed', reported_by: 'Guest', assigned_to: 'Patrick Olufemi', completed_at: new Date().toISOString(), created_at: new Date().toISOString() }
  ];

  // Sample inventory
  data.inventory = [
    { id: 1, name: 'Bed Sheets (Queen)', category: 'linen', quantity: 50, unit_price: 8500, reorder_level: 20, created_at: new Date().toISOString() },
    { id: 2, name: 'Bed Sheets (King)', category: 'linen', quantity: 30, unit_price: 10000, reorder_level: 15, created_at: new Date().toISOString() },
    { id: 3, name: 'Towels (Bath)', category: 'linen', quantity: 100, unit_price: 3500, reorder_level: 30, created_at: new Date().toISOString() },
    { id: 4, name: 'Towels (Hand)', category: 'linen', quantity: 80, unit_price: 2500, reorder_level: 25, created_at: new Date().toISOString() },
    { id: 5, name: 'Pillows', category: 'linen', quantity: 60, unit_price: 4500, reorder_level: 20, created_at: new Date().toISOString() },
    { id: 6, name: 'Shampoo (500ml)', category: 'amenities', quantity: 200, unit_price: 1500, reorder_level: 50, created_at: new Date().toISOString() },
    { id: 7, name: 'Soap (100g)', category: 'amenities', quantity: 300, unit_price: 800, reorder_level: 100, created_at: new Date().toISOString() },
    { id: 8, name: 'Toilet Paper', category: 'amenities', quantity: 500, unit_price: 500, reorder_level: 150, created_at: new Date().toISOString() },
    { id: 9, name: 'Coffee Beans (1kg)', category: 'fnb', quantity: 20, unit_price: 12000, reorder_level: 10, created_at: new Date().toISOString() },
    { id: 10, name: 'Tea Bags (100pk)', category: 'fnb', quantity: 40, unit_price: 4500, reorder_level: 15, created_at: new Date().toISOString() }
  ];

  console.log('Default data initialized with Naira prices and expanded data');
}

// Save data to file
function saveData() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving database:', err.message);
  }
}

// Helper functions for CRUD operations
const db = {
  // Get all records
  all: (table, query = '', params = [], callback) => {
    let results = data[table] || [];
    
    // Simple filtering
    if (query.includes('WHERE')) {
      // Very basic where clause support
      results = results.filter(item => {
        return params.every((param, idx) => {
          return Object.values(item).some(val => 
            String(val).toLowerCase().includes(String(param).toLowerCase())
          );
        });
      });
    }
    
    // Order by id descending
    results.sort((a, b) => b.id - a.id);
    
    setTimeout(() => callback(null, results), 10);
  },

  // Get single record
  get: (table, query = '', params = [], callback) => {
    const results = data[table] || [];
    const item = results.find(r => r.id === params[0]);
    setTimeout(() => callback(null, item || null), 10);
  },

  // Insert record
  run: (table, query = '', params = [], callback) => {
    const tableName = table.replace('INSERT INTO ', '').split(' ')[0];
    const tableData = data[tableName] || [];
    
    const newItem = { id: tableData.length + 1 };
    
    // Parse fields from query
    const fieldsMatch = query.match(/\(([^)]+)\)\s*VALUES/);
    if (fieldsMatch) {
      const fields = fieldsMatch[1].split(',').map(f => f.trim());
      fields.forEach((field, idx) => {
        if (field !== 'id') {
          newItem[field] = params[idx];
        }
      });
    }
    
    newItem.created_at = new Date().toISOString();
    tableData.push(newItem);
    data[tableName] = tableData;
    saveData();
    
    setTimeout(() => callback(null, { lastID: newItem.id, changes: 1 }), 10);
  },

  // Update record
  update: (table, query = '', params = [], callback) => {
    const tableName = table.replace('UPDATE ', '').split(' ')[0];
    const tableData = data[tableName] || [];
    
    // Extract id from params (last param)
    const id = params[params.length - 1];
    const itemIndex = tableData.findIndex(r => r.id === id);
    
    if (itemIndex >= 0) {
      // Parse SET clause
      const setMatch = query.match(/SET\s+(.+?)\s+WHERE/i);
      if (setMatch) {
        const setParts = setMatch[1].split(',').map(s => s.trim());
        setParts.forEach((part, idx) => {
          const [field] = part.split('=').map(s => s.trim());
          if (field && params[idx] !== undefined) {
            tableData[itemIndex][field] = params[idx];
          }
        });
      }
      
      data[tableName] = tableData;
      saveData();
    }
    
    setTimeout(() => callback(null, { changes: 1 }), 10);
  },

  // Delete record
  delete: (table, query = '', params = [], callback) => {
    const tableName = table.replace('DELETE FROM ', '').split(' ')[0];
    const tableData = data[tableName] || [];
    
    const id = params[0];
    const itemIndex = tableData.findIndex(r => r.id === id);
    
    if (itemIndex >= 0) {
      tableData.splice(itemIndex, 1);
      data[tableName] = tableData;
      saveData();
    }
    
    setTimeout(() => callback(null, { changes: 1 }), 10);
  }
};

// Initialize database
loadData();

module.exports = db;
