const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(process.cwd(), 'backend/.env') });
const DEEPSEEK_CONFIGURED = !!process.env.DEEPSEEK_API_KEY;
if (!DEEPSEEK_CONFIGURED) {
  try {
    const envRaw = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    const m = envRaw.match(/^DEEPSEEK_API_KEY=(.*)$/m);
    if (m && m[1]) process.env.DEEPSEEK_API_KEY = m[1].trim();
  } catch (_) {}
}

// Import routes
const appointmentRoutes = require('./routes/appointments');
const contactRoutes = require('./routes/contact');
const enquiryRoutes = require('./routes/enquiry');
const newsletterRoutes = require('./routes/newsletter');
const whatsappAdminRoutes = require('./routes/whatsapp-admin');
const apiIndexRoutes = require('./api/index');
const { initializeDatabase } = require('./database/db');

// Import WhatsApp service
const WhatsAppService = require('./services/whatsapp');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-vercel-domain.vercel.app', 'https://swftagency.com', 'https://www.swftagency.com']
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:8000', 'http://127.0.0.1:8000', 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// API routes
app.use('/api', apiIndexRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/enquiry', enquiryRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/whatsapp', whatsappAdminRoutes);
const { router: deepseekRoutes } = require('./routes/deepseek');
app.use('/api/deepseek', deepseekRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Swift Agency Backend Server is running',
    timestamp: new Date().toISOString()
  });
});

// QR Code endpoint for WhatsApp
app.get('/qr-code', (req, res) => {
  if (!whatsappServiceInstance) {
    return res.status(503).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WhatsApp QR Code</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .error { color: #e74c3c; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>WhatsApp QR Code</h1>
          <p class="error">⚠️ WhatsApp service is not initialized yet. Please wait a moment and refresh.</p>
        </div>
      </body>
      </html>
    `);
  }

  const qrData = whatsappServiceInstance.getQRCode();
  
  if (!qrData) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WhatsApp QR Code</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .success { color: #27ae60; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>WhatsApp QR Code</h1>
          <p class="success">✅ WhatsApp is already connected! No QR code needed.</p>
          <p>Your WhatsApp session is active and ready to receive notifications.</p>
        </div>
      </body>
      </html>
    `);
  }

  // Generate QR code as SVG and serve it
  const QRCode = require('qrcode');
  
  QRCode.toString(qrData, { 
    type: 'svg',
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  }, (err, svg) => {
    if (err) {
      return res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>WhatsApp QR Code</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .error { color: #e74c3c; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>WhatsApp QR Code</h1>
            <p class="error">❌ Error generating QR code. Please try again.</p>
          </div>
        </body>
        </html>
      `);
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WhatsApp QR Code - Swift Agency</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 20px; 
            background: linear-gradient(135deg, #25D366, #128C7E); 
            min-height: 100vh;
            margin: 0;
          }
          .container { 
            max-width: 500px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            border-radius: 15px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.2); 
          }
          .qr-container {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border: 2px solid #25D366;
          }
          .instructions {
            text-align: left;
            background: #e8f5e8;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .instructions ol {
            margin: 10px 0;
            padding-left: 20px;
          }
          .instructions li {
            margin: 8px 0;
          }
          .refresh-btn {
            background: #25D366;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
            transition: background 0.3s;
          }
          .refresh-btn:hover {
            background: #128C7E;
          }
          .logo {
            color: #25D366;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">📱 Swift Agency</div>
          <h1>WhatsApp QR Code</h1>
          <p>Scan this QR code to connect WhatsApp notifications</p>
          
          <div class="qr-container">
            ${svg}
          </div>
          
          <div class="instructions">
            <h3>📋 How to scan:</h3>
            <ol>
              <li>Open <strong>WhatsApp</strong> on your phone</li>
              <li>Go to <strong>Settings</strong> → <strong>Linked Devices</strong></li>
              <li>Tap <strong>"Link a Device"</strong></li>
              <li>Scan the QR code above</li>
              <li>✅ Done! Session will be saved automatically</li>
            </ol>
          </div>
          
          <button class="refresh-btn" onclick="window.location.reload()">🔄 Refresh QR Code</button>
          
          <p style="margin-top: 20px; color: #666; font-size: 14px;">
            💡 This QR code will expire after a few minutes. Refresh if needed.
          </p>
        </div>
        
        <script>
          // Auto-refresh every 2 minutes to get a fresh QR code
          setTimeout(() => {
            window.location.reload();
          }, 120000);
        </script>
      </body>
      </html>
    `);
  });
});

// Serve main website
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Serve booking page
app.get('/booking', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/booking.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
let whatsappServiceInstance = null;

initializeDatabase()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Swift Agency Backend Server is running!`);
      console.log(`📍 Server: http://localhost:${PORT}`);
      console.log(`🌐 Website: http://localhost:${PORT}`);
      console.log(`📅 Booking: http://localhost:${PORT}/booking`);
      console.log(`🤖 Chatbot API: http://localhost:${PORT}/api/chatbot`);
      console.log(`📧 Email notifications will be sent to: ${process.env.ADMIN_EMAIL || 'anushow299@gmail.com'}`);
      console.log(`\n✅ Database initialized successfully`);
      console.log(`⏰ Server started at: ${new Date().toLocaleString()}\n`);
      
      // Initialize WhatsApp service
      console.log(`📱 Initializing WhatsApp notification service...`);
      whatsappServiceInstance = new WhatsAppService();
      global.whatsappServiceInstance = whatsappServiceInstance; // Make it globally accessible
      whatsappServiceInstance.start().then(() => {
        console.log(`✅ WhatsApp service ready for chatbot notifications`);
      }).catch((error) => {
        console.error(`❌ WhatsApp service initialization failed:`, error.message);
        console.log(`⚠️ Chatbot will work without WhatsApp notifications`);
      });
    });

    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
        console.error(`ℹ️ Close the process using port ${PORT} and try again.`);
        console.error(`Windows tips:`);
        console.error(`  netstat -ano | findstr :${PORT}`);
        console.error(`  taskkill /F /PID <PID>`);
      } else {
        console.error('❌ Server start error:', err);
      }
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
