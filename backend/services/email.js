const crypto = require('crypto');

function normalizeRecipients(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter(Boolean);
  if (typeof input === 'string') return input.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

function isValidEmail(addr) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(addr || ''));
}

function renderTemplate(name, data) {
  const d = data || {};
  if (name === 'enquiry') {
    const subject = 'New Enquiry - Swift Agency';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #001E3D 0%, #007bff 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Swift Agency</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">New Enquiry Received</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">Enquiry Details</h2>
          <p><b>Name:</b> ${d.name || ''}</p>
          <p><b>Email:</b> ${d.email || ''}</p>
          <p><b>Phone:</b> ${d.phone || 'Not provided'}</p>
          <p><b>Company:</b> ${d.company || 'Not provided'}</p>
          <p><b>Service:</b> ${d.service || ''}</p>
          <p><b>Budget:</b> ${d.budget || 'Not specified'}</p>
          <p><b>Timeline:</b> ${d.timeline || 'Not specified'}</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff;">
            <p style="margin: 0; color: #333; line-height: 1.6;">${d.message || ''}</p>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
          <p style="margin: 0; color: #666; font-size: 14px;">${new Date().toLocaleString()}</p>
        </div>
      </div>`;
    const text = `Enquiry\nName: ${d.name || ''}\nEmail: ${d.email || ''}\nPhone: ${d.phone || ''}\nCompany: ${d.company || ''}\nService: ${d.service || ''}\nBudget: ${d.budget || ''}\nTimeline: ${d.timeline || ''}\nMessage: ${d.message || ''}`;
    return { subject, html, text };
  }
  if (name === 'contact') {
    const subject = 'New Contact Message - Swift Agency';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #001E3D 0%, #007bff 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Swift Agency</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">New Contact Message Received</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">Contact Details</h2>
          <p><b>Name:</b> ${d.name || ''}</p>
          <p><b>Email:</b> ${d.email || ''}</p>
          <p><b>Phone:</b> ${d.phone || 'Not provided'}</p>
          <p><b>Company:</b> ${d.company || 'Not provided'}</p>
          <p><b>Subject:</b> ${d.subject || ''}</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff;">
            <p style="margin: 0; color: #333; line-height: 1.6;">${d.message || ''}</p>
          </div>
        </div>
      </div>`;
    const text = `Contact\nName: ${d.name || ''}\nEmail: ${d.email || ''}\nPhone: ${d.phone || ''}\nCompany: ${d.company || ''}\nSubject: ${d.subject || ''}\nMessage: ${d.message || ''}`;
    return { subject, html, text };
  }
  const subject = d.subject || 'Swift Agency Notification';
  const html = d.html || '';
  const text = d.text || '';
  return { subject, html, text };
}

async function sendEmail(opts) {
  const apiKey = process.env.RESEND_API_KEY || '';
  if (!apiKey) {
    return { ok: false, status: 500, error: 'RESEND_API_KEY missing' };
  }
  const from = String(opts.from || '').trim();
  const to = normalizeRecipients(opts.to);
  const cc = normalizeRecipients(opts.cc);
  const bcc = normalizeRecipients(opts.bcc);
  if (!isValidEmail(from)) {
    return { ok: false, status: 400, error: 'Invalid from address' };
  }
  if (!to.length || !to.every(isValidEmail)) {
    return { ok: false, status: 400, error: 'Invalid recipient list' };
  }
  const payload = {
    from,
    to,
    cc: cc.length ? cc : undefined,
    bcc: bcc.length ? bcc : undefined,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    reply_to: opts.replyTo || undefined,
    headers: opts.headers || undefined,
    attachments: Array.isArray(opts.attachments) && opts.attachments.length ? opts.attachments.map(a => ({ filename: a.filename, content: a.content })) : undefined,
    tags: opts.tags || undefined
  };
  const AbortController = global.AbortController || require('abort-controller');
  const controller = new AbortController();
  const timeoutMs = typeof opts.timeoutMs === 'number' ? opts.timeoutMs : 8000;
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const raw = await r.text();
    if (!r.ok) {
      let message = raw || `HTTP ${r.status}`;
      try { const parsed = raw ? JSON.parse(raw) : null; if (parsed) message = parsed?.error?.message || parsed?.message || message; } catch (_) {}
      const retryAfter = r.headers.get('Retry-After');
      const rateLimited = r.status === 429;
      console.error('Email send failed', { status: r.status, message, rate_limited: rateLimited, retry_after: retryAfter });
      return { ok: false, status: r.status, error: message, rate_limited: rateLimited, retry_after: retryAfter };
    }
    let parsed = {};
    try { parsed = raw ? JSON.parse(raw) : {}; } catch (_) {}
    const id = parsed?.id || crypto.randomUUID();
    console.log('Email sent', { id, to, subject: opts.subject });
    return { ok: true, id };
  } catch (e) {
    const message = e?.message || 'Network error';
    console.error('Email send error', { message });
    return { ok: false, status: 504, error: message };
  } finally {
    clearTimeout(t);
  }
}

module.exports = { sendEmail, renderTemplate };
