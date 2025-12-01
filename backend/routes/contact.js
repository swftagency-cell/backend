const express = require('express');
const nodemailer = require('nodemailer');
const { database } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Email configuration (aligned with enquiry/newsletter via SMTP env vars)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'anushow299@gmail.com';
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: (process.env.EMAIL_SECURE || 'false') === 'true',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  },
  pool: true,
  maxConnections: 3,
  maxMessages: 20,
  connectionTimeout: 10000,
  socketTimeout: 10000
});

// Send contact email notification
async function sendContactEmail(contactData) {
  try {
    const { name, email, phone, company, subject, message } = contactData;
    
    const emailSubject = `New Contact Message - Swift Agency`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #001E3D 0%, #007bff 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Swift Agency</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">New Contact Message Received</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">📧 Contact Details</h2>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #007bff; margin-bottom: 15px; font-size: 18px;">👤 Client Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Name:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Email:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Phone:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">${phone || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Company:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">${company || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Subject:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">${subject}</td>
              </tr>
            </table>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #007bff; margin-bottom: 15px; font-size: 18px;">💬 Message</h3>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff;">
              <p style="margin: 0; color: #333; line-height: 1.6;">${message}</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              This message was sent from the Swift Agency contact form on ${new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Swift Agency. All rights reserved.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: ADMIN_EMAIL,
      subject: emailSubject,
      html: emailBody,
      replyTo: email
    };

    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Email send timeout')), 5000));
    let info;
    try {
      info = await Promise.race([sendPromise, timeoutPromise]);
      if (info && info.messageId) {
        console.log('Contact email sent successfully', { messageId: info.messageId, response: info.response });
        return true;
      }
      console.log('Contact email send completed');
      return true;
    } catch (smtpErr) {
      const useResend = (process.env.EMAIL_PROVIDER || '').toLowerCase() === 'resend' || !!process.env.RESEND_API_KEY;
      if (!useResend) throw smtpErr;
      try {
        const apiKey = process.env.RESEND_API_KEY;
        const resendResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: process.env.EMAIL_USER,
            to: ADMIN_EMAIL,
            subject: emailSubject,
            html: emailBody,
            reply_to: email
          })
        });
        const text = await resendResp.text();
        if (!resendResp.ok) {
          console.error('Resend API error', { status: resendResp.status, body: text });
          return false;
        }
        let parsed = {};
        try { parsed = JSON.parse(text); } catch (_) {}
        console.log('Contact email sent via Resend', { id: parsed?.id });
        return true;
      } catch (resendErr) {
        console.error('Fallback send via Resend failed', resendErr);
        return false;
      }
    }
  } catch (error) {
    console.error('Error sending contact email:', error);
    return false;
  }
}

// POST /api/contact - Submit contact form
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, company, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, subject, and message are required fields'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }

    const contactId = uuidv4();
    const createdAt = new Date().toISOString();

    // Insert into database
    const insertQuery = `
      INSERT INTO contacts (id, name, email, phone, company, subject, message, created_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')
    `;

    await database.run(insertQuery, [
      contactId,
      name,
      email,
      phone || null,
      company || null,
      subject,
      message,
      createdAt
    ]);

    let emailSent = false;
    let emailErrorMessage = null;
    try {
      emailSent = await sendContactEmail({ name, email, phone, company, subject, message });
    } catch (emailError) {
      console.error('Failed to send contact email:', emailError);
      emailErrorMessage = emailError.message || 'Unknown email error';
    }
    if (!emailSent && !emailErrorMessage) {
      emailErrorMessage = 'Email not sent. Verify EMAIL_HOST/PORT/SECURE and EMAIL_USER/EMAIL_PASS.';
    }

    res.status(201).json({
      success: true,
      message: 'Contact message sent successfully! We will get back to you within 24 hours.',
      contactId: contactId,
      email_sent: emailSent,
      email_error: emailErrorMessage
    });

  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit contact message. Please try again later.'
    });
  }
});

// GET /api/contact - Get all contact messages (admin only)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT * FROM contacts 
      ORDER BY created_at DESC
    `;
    
    const contacts = await database.all(query);
    
    res.json({
      success: true,
      contacts: contacts
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contact messages'
    });
  }
});

// PUT /api/contact/:id - Update contact status
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['new', 'read', 'replied', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: new, read, replied, closed'
      });
    }

    const updateQuery = `
      UPDATE contacts 
      SET status = ?, updated_at = ?
      WHERE id = ?
    `;

    const result = await database.run(updateQuery, [status, new Date().toISOString(), id]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Contact message not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact status updated successfully'
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update contact status'
    });
  }
});

// DELETE /api/contact/:id - Delete contact message
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleteQuery = 'DELETE FROM contacts WHERE id = ?';
    const result = await database.run(deleteQuery, [id]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Contact message not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete contact message'
    });
  }
});

module.exports = router;
router.get('/status', async (req, res) => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const secure = (process.env.EMAIL_SECURE || 'false') === 'true';
  const from = process.env.EMAIL_USER || '';
  const to = ADMIN_EMAIL || '';
  let error = null;
  let ok = false;
  try {
    ok = !!(await transporter.verify());
  } catch (e) {
    error = { message: e?.message || 'verify failed', code: e?.code };
  }
  res.json({ smtp_ok: ok, host, port, secure, from, to, error });
});
router.post('/test', async (req, res) => {
  try {
    const ok = await sendContactEmail({ name: 'Test', email: process.env.EMAIL_USER || 'test@example.com', phone: '', company: '', subject: 'SMTP Test', message: 'This is a test email from Swift Agency.' });
    res.json({ success: ok });
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message || 'send failed' });
  }
});
router.get('/test', async (req, res) => {
  try {
    const ok = await sendContactEmail({ name: 'Test', email: process.env.EMAIL_USER || 'test@example.com', phone: '', company: '', subject: 'SMTP Test', message: 'This is a test email from Swift Agency.' });
    res.json({ success: ok });
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message || 'send failed' });
  }
});
