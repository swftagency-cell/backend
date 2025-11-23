const express = require('express');
const nodemailer = require('nodemailer');
const { database } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 465,
  secure: process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === 'true' : true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Helper function to validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Send welcome email to new subscriber
async function sendWelcomeEmail(email, name) {
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      console.log('⚠️ Email credentials not configured. Skipping welcome email.');
      return { success: false, error: 'Email not configured. Verify EMAIL_USER/EMAIL_PASS and SMTP settings.' };
    }

    const emailSubject = `Welcome to Swift Agency Newsletter! 🚀`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #001E3D 0%, #007bff 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Swift Agency</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Welcome to Our Newsletter!</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">🎉 Thank You for Subscribing!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            ${name ? `Hi ${name},` : 'Hello!'}<br><br>
            Welcome to the Swift Agency newsletter! We're thrilled to have you join our community of digital innovators and business leaders.
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; margin-bottom: 20px;">
            <h3 style="color: #007bff; margin: 0 0 10px 0; font-size: 18px;">What to Expect:</h3>
            <ul style="color: #666; margin: 0; padding-left: 20px;">
              <li>Latest digital marketing trends and insights</li>
              <li>Exclusive tips for growing your business online</li>
              <li>Case studies and success stories</li>
              <li>Special offers and early access to our services</li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            We promise to deliver valuable content straight to your inbox and respect your privacy. You can unsubscribe at any time.
          </p>
          
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="https://swiftagency.com" style="background: linear-gradient(135deg, #007bff 0%, #001E3D 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Visit Our Website
            </a>
          </div>
          
          <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              📧 Subscribed: ${new Date().toLocaleDateString()}<br>
              🌐 Swift Agency - Your Digital Growth Partner
            </p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: emailUser,
      to: email,
      subject: emailSubject,
      html: emailBody
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to: ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return { success: false, error: error?.message || 'Failed to send welcome email' };
  }
}

// Send admin notification email for new newsletter subscription
async function sendAdminNotification(email, name, subscriberData) {
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const adminEmail = process.env.ADMIN_EMAIL || 'anushow299@gmail.com';

    if (!emailUser || !emailPass) {
      console.log('⚠️ Email credentials not configured. Skipping admin notification.');
      return { success: false, error: 'Email not configured. Verify EMAIL_USER/EMAIL_PASS and SMTP settings.' };
    }

    const emailSubject = `🔔 New Newsletter Subscription - Swift Agency`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Swift Agency</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">New Newsletter Subscription</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">📧 New Subscriber Alert</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            You have a new newsletter subscription on your Swift Agency website!
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545; margin-bottom: 20px;">
            <h3 style="color: #dc3545; margin: 0 0 15px 0; font-size: 18px;">Subscriber Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333; width: 30%;">Email:</td>
                <td style="padding: 8px 0; color: #666;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">Name:</td>
                <td style="padding: 8px 0; color: #666;">${name || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">Subscribed:</td>
                <td style="padding: 8px 0; color: #666;">${new Date(subscriberData.subscribed_at).toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">IP Address:</td>
                <td style="padding: 8px 0; color: #666;">${subscriberData.ip_address || 'Unknown'}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              🎉 Your newsletter is growing! Keep up the great content.<br>
              📊 Check your admin dashboard for more subscriber analytics.
            </p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: emailUser,
      to: adminEmail,
      subject: emailSubject,
      html: emailBody
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Admin notification sent for new subscriber: ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending admin notification:', error);
    return { success: false, error: error?.message || 'Failed to send admin notification' };
  }
}

// POST /api/newsletter/subscribe - Subscribe to newsletter
router.post('/subscribe', async (req, res) => {
  try {
    const { email, name } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const subscriberData = {
      id: uuidv4(),
      email: normalizedEmail,
      name: name ? name.trim() : null,
      status: 'active',
      subscribed_at: new Date().toISOString(),
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent') || null
    };

    // Check if email already exists
    const existingStmt = database.prepare('SELECT * FROM newsletter_subscribers WHERE email = ?');
    const existing = existingStmt.get(normalizedEmail);

    if (existing) {
      if (existing.status === 'active') {
        return res.status(409).json({
          success: false,
          error: 'Email is already subscribed to our newsletter'
        });
      } else {
        // Reactivate subscription
        const updateStmt = database.prepare(`
          UPDATE newsletter_subscribers 
          SET status = 'active', subscribed_at = ?, unsubscribed_at = NULL 
          WHERE email = ?
        `);
        updateStmt.run(subscriberData.subscribed_at, normalizedEmail);
        
        const welcomeResult = await sendWelcomeEmail(normalizedEmail, subscriberData.name);
        const adminResult = await sendAdminNotification(normalizedEmail, subscriberData.name, subscriberData);

        return res.status(200).json({
          success: true,
          message: 'Successfully resubscribed to newsletter',
          data: {
            email: normalizedEmail,
            status: 'active',
            email_sent: welcomeResult.success,
            email_error: !welcomeResult.success ? welcomeResult.error : undefined,
            admin_notified: adminResult.success,
            admin_email_error: !adminResult.success ? adminResult.error : undefined
          }
        });
      }
    }

    // Insert new subscriber
    const stmt = database.prepare(`
      INSERT INTO newsletter_subscribers (
        id, email, name, status, subscribed_at, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      subscriberData.id,
      subscriberData.email,
      subscriberData.name,
      subscriberData.status,
      subscriberData.subscribed_at,
      subscriberData.ip_address,
      subscriberData.user_agent
    );

    const welcomeResult = await sendWelcomeEmail(normalizedEmail, subscriberData.name);
    const adminResult = await sendAdminNotification(normalizedEmail, subscriberData.name, subscriberData);

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      data: {
        email: normalizedEmail,
        status: 'active',
        email_sent: welcomeResult.success,
        email_error: !welcomeResult.success ? welcomeResult.error : undefined,
        admin_notified: adminResult.success,
        admin_email_error: !adminResult.success ? adminResult.error : undefined
      }
    });

    console.log(`✅ New newsletter subscription: ${normalizedEmail}`);

  } catch (error) {
    console.error('❌ Error subscribing to newsletter:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to subscribe to newsletter. Please try again later.'
    });
  }
});

// POST /api/newsletter/unsubscribe - Unsubscribe from newsletter
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if subscriber exists
    const existingStmt = database.prepare('SELECT * FROM newsletter_subscribers WHERE email = ?');
    const existing = existingStmt.get(normalizedEmail);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Email not found in our newsletter list'
      });
    }

    if (existing.status === 'unsubscribed') {
      return res.status(409).json({
        success: false,
        error: 'Email is already unsubscribed'
      });
    }

    // Update subscription status
    const stmt = database.prepare(`
      UPDATE newsletter_subscribers 
      SET status = 'unsubscribed', unsubscribed_at = ? 
      WHERE email = ?
    `);
    stmt.run(new Date().toISOString(), normalizedEmail);

    res.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    });

    console.log(`✅ Newsletter unsubscription: ${normalizedEmail}`);

  } catch (error) {
    console.error('❌ Error unsubscribing from newsletter:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unsubscribe. Please try again later.'
    });
  }
});

// GET /api/newsletter/subscribers - Get all subscribers (admin)
router.get('/subscribers', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM newsletter_subscribers';
    let params = [];
    
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY subscribed_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const stmt = database.prepare(query);
    const subscribers = stmt.all(...params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM newsletter_subscribers';
    let countParams = [];
    
    if (status) {
      countQuery += ' WHERE status = ?';
      countParams.push(status);
    }
    
    const countStmt = database.prepare(countQuery);
    const { total } = countStmt.get(...countParams);
    
    res.json({
      success: true,
      data: subscribers,
      pagination: {
        total,
        count: subscribers.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching subscribers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscribers'
    });
  }
});

// GET /api/newsletter/stats - Get newsletter statistics
router.get('/stats', async (req, res) => {
  try {
    const activeStmt = database.prepare('SELECT COUNT(*) as count FROM newsletter_subscribers WHERE status = "active"');
    const unsubscribedStmt = database.prepare('SELECT COUNT(*) as count FROM newsletter_subscribers WHERE status = "unsubscribed"');
    const totalStmt = database.prepare('SELECT COUNT(*) as count FROM newsletter_subscribers');
    
    const active = activeStmt.get().count;
    const unsubscribed = unsubscribedStmt.get().count;
    const total = totalStmt.get().count;
    
    // Get recent subscriptions (last 30 days)
    const recentStmt = database.prepare(`
      SELECT COUNT(*) as count 
      FROM newsletter_subscribers 
      WHERE status = "active" AND subscribed_at >= datetime('now', '-30 days')
    `);
    const recent = recentStmt.get().count;
    
    res.json({
      success: true,
      data: {
        active_subscribers: active,
        unsubscribed: unsubscribed,
        total_subscribers: total,
        recent_subscriptions: recent,
        growth_rate: total > 0 ? ((recent / total) * 100).toFixed(2) : 0
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching newsletter stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch newsletter statistics'
    });
  }
});

// DELETE /api/newsletter/subscribers/:id - Delete subscriber (admin)
router.delete('/subscribers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const stmt = database.prepare('DELETE FROM newsletter_subscribers WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Subscriber not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Subscriber deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting subscriber:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete subscriber'
    });
  }
});

module.exports = router;