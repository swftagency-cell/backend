const crypto = require('crypto');

function getDeepseekApiKey() {
  const plain = process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.trim();
  if (plain) return plain;

  const enc = process.env.DEEPSEEK_API_KEY_ENC;
  const pass = process.env.DEEPSEEK_KEY_PASSPHRASE;
  if (enc && pass) {
    try {
      const payloadStr = Buffer.from(enc, 'base64').toString('utf8');
      const payload = JSON.parse(payloadStr);
      const iv = Buffer.from(payload.iv, 'base64');
      const tag = Buffer.from(payload.tag, 'base64');
      const data = Buffer.from(payload.data, 'base64');
      const key = crypto.createHash('sha256').update(pass).digest();
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      const decrypted = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
      return decrypted.trim();
    } catch (_) {
      return null;
    }
  }

  return null;
}

module.exports = { getDeepseekApiKey };

