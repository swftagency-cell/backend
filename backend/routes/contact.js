const express = require('express');
const { sendEmail, renderTemplate } = require('../services/email');
const { database } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'anushow299@gmail.com';

// Send contact email notification
async function sendContactEmail(contactData) {
  try {
    const { name, email, phone, company, subject, message } = contactData;
    
    const t = renderTemplate('contact', { name, email, phone, company, subject, message });
    const r = await sendEmail({ from: process.env.EMAIL_USER, to: [ADMIN_EMAIL], subject: t.subject, html: t.html, text: t.text, replyTo: email });
    if (!r.ok) return false;
    return true;
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
      emailErrorMessage = 'Email not sent. Verify RESEND_API_KEY and EMAIL_USER (from address).';
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
  const from = process.env.EMAIL_USER || '';
  const to = ADMIN_EMAIL || '';
  const provider = (process.env.EMAIL_PROVIDER || '').toLowerCase() || (process.env.RESEND_API_KEY ? 'resend' : 'smtp');
  const provider_ok = provider === 'resend' ? !!process.env.RESEND_API_KEY : false;
  res.json({ provider, provider_ok, from, to });
});
router.post('/test', async (req, res) => {
  try {
    const ok = await sendContactEmail({ name: 'Test', email: process.env.EMAIL_USER || 'test@example.com', phone: '', company: '', subject: 'Email Test', message: 'This is a test email from Swift Agency.' });
    res.json({ success: ok });
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message || 'send failed' });
  }
});
router.get('/test', async (req, res) => {
  try {
    const ok = await sendContactEmail({ name: 'Test', email: process.env.EMAIL_USER || 'test@example.com', phone: '', company: '', subject: 'Email Test', message: 'This is a test email from Swift Agency.' });
    res.json({ success: ok });
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message || 'send failed' });
  }
});
