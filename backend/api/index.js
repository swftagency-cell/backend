// Swift Agency API - Node.js Backend
// This file provides API documentation and status information

const express = require('express');
const router = express.Router();

// API Documentation and Status
router.get('/', (req, res) => {
  res.json({
    name: 'Swift Agency API',
    version: '2.0.0',
    description: 'Node.js backend API for Swift Agency website',
    status: 'active',
    timestamp: new Date().toISOString(),
    endpoints: {
      appointments: {
        base_url: '/api/appointments',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'Manage appointment bookings'
      },
      enquiry: {
        base_url: '/api/enquiry',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'Handle enquiry form submissions'
      },
      newsletter: {
        base_url: '/api/newsletter',
        methods: ['GET', 'POST', 'DELETE'],
        description: 'Manage newsletter subscriptions',
        sub_endpoints: [
          '/subscribe',
          '/unsubscribe',
          '/subscribers',
          '/stats'
        ]
      },
      chatbot: {
        base_url: '/api/chatbot',
        methods: ['POST'],
        description: 'AI chatbot interactions'
      },
      deepseek: {
        base_url: '/api/deepseek',
        methods: ['POST'],
        description: 'DeepSeek AI chat completions (replace for Google AI)'
      },
      contact_diagnostics: {
        base_url: '/api/contact',
        methods: ['GET', 'POST'],
        sub_endpoints: ['/status', '/test'],
        description: 'SMTP diagnostics and test email'
      },
      health: {
        base_url: '/api/health',
        methods: ['GET'],
        description: 'Server health check'
      }
    },
    migration_info: {
      from: 'PHP',
      to: 'Node.js',
      date: new Date().toISOString(),
      features: [
        'SQLite database integration',
        'Email notifications with Nodemailer',
        'CORS support',
        'Rate limiting',
        'Security headers with Helmet',
        'Input validation',
        'Error handling'
      ]
    }
  });
});

module.exports = router;
