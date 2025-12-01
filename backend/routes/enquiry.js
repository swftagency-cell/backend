const express = require('express');
const { sendEmail, renderTemplate } = require('../services/email');
const { database } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'anushow299@gmail.com';

// Send enquiry email notification
async function sendEnquiryEmail(enquiryData) {
  try {
    const { name, email, phone, company, service, budget, timeline, message } = enquiryData;
    
    const t = renderTemplate('enquiry', { name, email, phone, company, service, budget, timeline, message });
    const r = await sendEmail({ from: process.env.EMAIL_USER, to: [ADMIN_EMAIL], cc: [email], subject: t.subject, html: t.html, text: t.text, replyTo: email });
    if (!r.ok) throw new Error(r.error || 'send failed');
    return true;
  } catch (error) {
    console.error('❌ Error sending enquiry email:', error);
    return false;
  }
}

// POST /api/enquiry - Submit new enquiry
router.post('/', async (req, res) => {
  try {
    console.log('Received enquiry data:', req.body);
    
    const { name, email, phone, company, service, serviceType, budget, timeline, message } = req.body;

    // Use serviceType if service is not provided (for frontend compatibility)
    const selectedService = service || serviceType;
    
    console.log('Selected service:', selectedService);
    
    // Validation
    if (!name || !email || !selectedService || !message) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, service, and message are required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    const enquiryId = uuidv4();
    const enquiryData = {
      id: enquiryId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      company: company ? company.trim() : null,
      service: selectedService.trim(),
      budget: budget ? budget.trim() : null,
      timeline: timeline ? timeline.trim() : null,
      message: message.trim(),
      status: 'new',
      created_at: new Date().toISOString(),
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent') || null
    };

    // Insert into database
    const stmt = database.prepare(`
      INSERT INTO enquiries (
        id, name, email, phone, company, service, budget, timeline, 
        message, status, created_at, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      enquiryData.id,
      enquiryData.name,
      enquiryData.email,
      enquiryData.phone,
      enquiryData.company,
      enquiryData.service,
      enquiryData.budget,
      enquiryData.timeline,
      enquiryData.message,
      enquiryData.status,
      enquiryData.created_at,
      enquiryData.ip_address,
      enquiryData.user_agent
    );

    // Send email notification (don't let email failure block the submission)
    let emailSent = false;
    let emailErrorMessage = null;
    try {
      emailSent = await sendEnquiryEmail(enquiryData);
    } catch (emailError) {
      console.error('❌ Email sending failed, but enquiry was saved:', emailError);
      emailErrorMessage = emailError.message || 'Unknown email error';
    }

    if (!emailSent && !emailErrorMessage) {
      emailErrorMessage = 'Email not sent. Verify RESEND_API_KEY and EMAIL_USER (from address).';
    }

    res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully',
      data: {
        id: enquiryData.id,
        status: enquiryData.status,
        email_sent: emailSent,
        email_error: emailErrorMessage
      }
    });

    console.log(`✅ New enquiry submitted: ${enquiryData.name} (${enquiryData.email})`);

  } catch (error) {
    console.error('❌ Error submitting enquiry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit enquiry. Please try again later.'
    });
  }
});

// GET /api/enquiry - Get all enquiries (admin)
router.get('/', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM enquiries';
    let params = [];
    
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const stmt = database.prepare(query);
    const enquiries = stmt.all(...params);
    
    res.json({
      success: true,
      data: enquiries,
      count: enquiries.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching enquiries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch enquiries'
    });
  }
});

// PUT /api/enquiry/:id - Update enquiry status
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    const validStatuses = ['new', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }
    
    const stmt = database.prepare('UPDATE enquiries SET status = ?, updated_at = ? WHERE id = ?');
    const result = stmt.run(status, new Date().toISOString(), id);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Enquiry not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Enquiry status updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating enquiry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update enquiry'
    });
  }
});

// DELETE /api/enquiry/:id - Delete enquiry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const stmt = database.prepare('DELETE FROM enquiries WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Enquiry not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Enquiry deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting enquiry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete enquiry'
    });
  }
});

module.exports = router;
