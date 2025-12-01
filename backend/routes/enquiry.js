const express = require('express');
const nodemailer = require('nodemailer');
const { database } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Email configuration
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

// Send enquiry email notification
async function sendEnquiryEmail(enquiryData) {
  try {
    const { name, email, phone, company, service, budget, timeline, message } = enquiryData;
    
    const emailSubject = `New Enquiry - Swift Agency`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #001E3D 0%, #007bff 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Swift Agency</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">New Enquiry Received</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">📧 Enquiry Details</h2>
          
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
            </table>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #007bff; margin-bottom: 15px; font-size: 18px;">🎯 Project Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Service:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">${service}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Budget:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">${budget || 'Not specified'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Timeline:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">${timeline || 'Not specified'}</td>
              </tr>
            </table>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #007bff; margin-bottom: 15px; font-size: 18px;">💬 Message</h3>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff;">
              <p style="margin: 0; color: #333; line-height: 1.6;">${message}</p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              📅 Received: ${new Date().toLocaleString()}<br>
              🌐 Swift Agency - Professional Digital Solutions
            </p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: ADMIN_EMAIL,
      cc: email,
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
        console.log('✅ Enquiry email sent successfully', { messageId: info.messageId, response: info.response });
      } else {
        console.log('✅ Enquiry email send completed');
      }
    } catch (smtpErr) {
      const useResend = (process.env.EMAIL_PROVIDER || '').toLowerCase() === 'resend' || !!process.env.RESEND_API_KEY;
      if (useResend) {
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
            throw new Error(`Resend failed: ${resendResp.status}`);
          }
          let parsed = {};
          try { parsed = JSON.parse(text); } catch (_) {}
          console.log('✅ Enquiry email sent via Resend', { id: parsed?.id });
        } catch (resendErr) {
          console.error('❌ Fallback send via Resend failed', resendErr);
          throw resendErr;
        }
      } else {
        throw smtpErr;
      }
    }
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
      emailErrorMessage = 'Email not sent. Verify EMAIL_HOST/PORT/SECURE and EMAIL_USER/EMAIL_PASS.';
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
