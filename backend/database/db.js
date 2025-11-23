const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'swift_agency.db');

// Ensure database directory exists
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

class Database {
  constructor() {
    this.db = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          reject(err);
        } else {
          console.log('✅ Connected to SQLite database');
          resolve();
        }
      });
    });
  }

  createTables() {
    return new Promise((resolve, reject) => {
      const createAppointmentsTable = `
        CREATE TABLE IF NOT EXISTS appointments (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT NOT NULL,
          company TEXT,
          service TEXT NOT NULL,
          appointment_date TEXT NOT NULL,
          appointment_time TEXT NOT NULL,
          message TEXT,
          status TEXT DEFAULT 'pending',
          created_at TEXT NOT NULL,
          updated_at TEXT,
          ip_address TEXT,
          user_agent TEXT
        )
      `;

      const createEnquiriesTable = `
        CREATE TABLE IF NOT EXISTS enquiries (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          company TEXT,
          service TEXT NOT NULL,
          budget TEXT,
          timeline TEXT,
          message TEXT NOT NULL,
          status TEXT DEFAULT 'new',
          created_at TEXT NOT NULL,
          updated_at TEXT,
          ip_address TEXT,
          user_agent TEXT
        )
      `;

      const createNewsletterTable = `
        CREATE TABLE IF NOT EXISTS newsletter_subscribers (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          name TEXT,
          status TEXT DEFAULT 'active',
          subscribed_at TEXT NOT NULL,
          unsubscribed_at TEXT,
          ip_address TEXT,
          user_agent TEXT
        )
      `;

      const createChatLogsTable = `
        CREATE TABLE IF NOT EXISTS chat_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL,
          user_message TEXT NOT NULL,
          bot_response TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      const createContactsTable = `
        CREATE TABLE IF NOT EXISTS contacts (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          company TEXT,
          subject TEXT NOT NULL,
          message TEXT NOT NULL,
          status TEXT DEFAULT 'new',
          created_at TEXT NOT NULL,
          updated_at TEXT,
          ip_address TEXT,
          user_agent TEXT
        )
      `;

      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          phone TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      this.db.serialize(() => {
        this.db.run(createAppointmentsTable, (err) => {
          if (err) {
            console.error('Error creating appointments table:', err.message);
            reject(err);
            return;
          }
          console.log('✅ Appointments table created/verified');
        });

        this.db.run(createEnquiriesTable, (err) => {
          if (err) {
            console.error('Error creating enquiries table:', err.message);
            reject(err);
            return;
          }
          console.log('✅ Enquiries table created/verified');
        });

        this.db.run(createNewsletterTable, (err) => {
          if (err) {
            console.error('Error creating newsletter_subscribers table:', err.message);
            reject(err);
            return;
          }
          console.log('✅ Newsletter subscribers table created/verified');
        });

        this.db.run(createChatLogsTable, (err) => {
          if (err) {
            console.error('Error creating chat_logs table:', err.message);
            reject(err);
            return;
          }
          console.log('✅ Chat logs table created/verified');
        });

        this.db.run(createContactsTable, (err) => {
          if (err) {
            console.error('Error creating contacts table:', err.message);
            reject(err);
            return;
          }
          console.log('✅ Contacts table created/verified');
        });

        this.db.run(createUsersTable, (err) => {
          if (err) {
            console.error('Error creating users table:', err.message);
            reject(err);
            return;
          }
          console.log('✅ Users table created/verified');
          resolve();
        });
      });
    });
  }

  // Appointment methods
  createAppointment(appointmentData) {
    return new Promise((resolve, reject) => {
      const { name, email, phone, company, service, appointment_date, appointment_time, message } = appointmentData;
      
      const sql = `
        INSERT INTO appointments (name, email, phone, company, service, appointment_date, appointment_time, message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      this.db.run(sql, [name, email, phone, company, service, appointment_date, appointment_time, message], function(err) {
        if (err) {
          console.error('Error creating appointment:', err.message);
          reject(err);
        } else {
          console.log(`✅ Appointment created with ID: ${this.lastID}`);
          resolve({ id: this.lastID, ...appointmentData });
        }
      });
    });
  }

  getAppointments(limit = 50) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM appointments ORDER BY created_at DESC LIMIT ?`;
      
      this.db.all(sql, [limit], (err, rows) => {
        if (err) {
          console.error('Error fetching appointments:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  getAppointmentById(id) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM appointments WHERE id = ?`;
      
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          console.error('Error fetching appointment:', err.message);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  updateAppointmentStatus(id, status) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      
      this.db.run(sql, [status, id], function(err) {
        if (err) {
          console.error('Error updating appointment status:', err.message);
          reject(err);
        } else {
          console.log(`✅ Appointment ${id} status updated to: ${status}`);
          resolve({ id, status, changes: this.changes });
        }
      });
    });
  }

  // Chat log methods
  saveChatLog(sessionId, userMessage, botResponse) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO chat_logs (session_id, user_message, bot_response) VALUES (?, ?, ?)`;
      
      this.db.run(sql, [sessionId, userMessage, botResponse], function(err) {
        if (err) {
          console.error('Error saving chat log:', err.message);
          reject(err);
        } else {
          resolve({ id: this.lastID, sessionId, userMessage, botResponse });
        }
      });
    });
  }

  getChatHistory(sessionId, limit = 10) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM chat_logs WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?`;
      
      this.db.all(sql, [sessionId, limit], (err, rows) => {
        if (err) {
          console.error('Error fetching chat history:', err.message);
          reject(err);
        } else {
          resolve(rows.reverse()); // Return in chronological order
        }
      });
    });
  }

  // User methods
  createOrUpdateUser(userData) {
    return new Promise((resolve, reject) => {
      const { email, name, phone } = userData;
      
      const sql = `
        INSERT OR REPLACE INTO users (email, name, phone)
        VALUES (?, ?, ?)
      `;
      
      this.db.run(sql, [email, name, phone], function(err) {
        if (err) {
          console.error('Error creating/updating user:', err.message);
          reject(err);
        } else {
          resolve({ id: this.lastID, email, name, phone });
        }
      });
    });
  }

  // Direct database access methods for prepared statements
  prepare(sql) {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db.prepare(sql);
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
            reject(err);
          } else {
            console.log('✅ Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

// Create database instance
const database = new Database();

// Initialize database
async function initializeDatabase() {
  try {
    await database.connect();
    await database.createTables();
    console.log('🗄️ Database initialization completed successfully');
    return database;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

module.exports = {
  database,
  initializeDatabase
};