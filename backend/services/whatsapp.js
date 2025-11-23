const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

class WhatsAppService {
    constructor() {
        this.client = null;
        this.isReady = false;
        this.qrCodeData = null;
        this.adminNumber = process.env.WHATSAPP_ADMIN_NUMBER || '2349162810211'; // Your phone number
        this.init();
    }

    init() {
        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: "swift-agency-chatbot"
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu'
                ]
            }
        });

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.client.on('qr', (qr) => {
            this.qrCodeData = qr; // Store QR code data for web endpoint
            console.log('\n📱 WhatsApp QR Code - Scan to Connect:\n');
            console.log('═══════════════════════════════════════════════════');
            qrcode.generate(qr, { small: false, width: 256 });
            console.log('═══════════════════════════════════════════════════');
            console.log('\n🔗 How to scan:');
            console.log('1. Open WhatsApp → Settings → Linked Devices');
            console.log('2. Tap "Link a Device" → Scan QR above');
            console.log('3. ✅ Done! Session will be saved automatically');
            console.log('\n💡 Alternative: Copy this QR data and use an online QR reader:');
            console.log(qr);
            console.log('\n🌐 Or visit: http://localhost:3000/qr-code');
            console.log('\n');
        });

        this.client.on('ready', () => {
            console.log('✅ WhatsApp Client is ready!');
            this.isReady = true;
        });

        this.client.on('authenticated', () => {
            console.log('🔐 WhatsApp Client authenticated successfully');
        });

        this.client.on('auth_failure', (msg) => {
            console.error('❌ WhatsApp authentication failed:', msg);
            console.log('💡 Try clearing the .wwebjs_auth folder and restart the server');
        });

        this.client.on('disconnected', (reason) => {
            console.log('📱 WhatsApp Client was logged out:', reason);
            this.isReady = false;
        });

        this.client.on('message', async (message) => {
            // Handle incoming WhatsApp messages if needed
            console.log('📨 Received WhatsApp message:', message.body);
        });
    }

    async start() {
        try {
            console.log('🔄 Starting WhatsApp client initialization...');
            await this.client.initialize();
            console.log('🚀 WhatsApp service initialized');
        } catch (error) {
            console.error('❌ Error initializing WhatsApp service:', error);
            throw error;
        }
    }

    async sendChatbotNotification(chatData) {
        if (!this.isReady) {
            console.log('⚠️ WhatsApp client not ready. Notification not sent.');
            return { success: false, error: 'WhatsApp client not ready' };
        }

        try {
            const { sessionId, userMessage, botResponse, timestamp } = chatData;
            
            // Format the notification message
            const notificationMessage = `
🤖 *New Chatbot Message - Swift Agency*

👤 *User Message:*
${userMessage}

🤖 *Bot Response:*
${botResponse}

📅 *Time:* ${new Date(timestamp).toLocaleString()}
🆔 *Session:* ${sessionId.substring(0, 8)}...

---
💬 View full conversation in admin panel
            `.trim();

            // Send to admin number
            const chatId = `${this.adminNumber}@c.us`;
            await this.client.sendMessage(chatId, notificationMessage);

            console.log(`✅ WhatsApp notification sent for chatbot message`);
            return { success: true };

        } catch (error) {
            console.error('❌ Error sending WhatsApp notification:', error);
            return { success: false, error: error.message };
        }
    }

    async sendBulkChatNotification(sessionId, messageCount) {
        if (!this.isReady) {
            console.log('⚠️ WhatsApp client not ready. Bulk notification not sent.');
            return { success: false, error: 'WhatsApp client not ready' };
        }

        try {
            const notificationMessage = `
🔔 *Chatbot Activity Alert - Swift Agency*

📊 *Session Update:*
• Session ID: ${sessionId.substring(0, 8)}...
• Total Messages: ${messageCount}
• Status: Active conversation

💡 *Action Required:*
A user is actively chatting with the bot. Consider checking the conversation for potential leads.

---
🖥️ Check admin panel for full details
            `.trim();

            const chatId = `${this.adminNumber}@c.us`;
            await this.client.sendMessage(chatId, notificationMessage);

            console.log(`✅ WhatsApp bulk notification sent for session ${sessionId}`);
            return { success: true };

        } catch (error) {
            console.error('❌ Error sending WhatsApp bulk notification:', error);
            return { success: false, error: error.message };
        }
    }

    async getStatus() {
        return {
            isReady: this.isReady,
            adminNumber: this.adminNumber,
            clientState: this.client ? this.client.info : null
        };
    }

    getQRCode() {
        return this.qrCodeData;
    }

    async stop() {
        if (this.client) {
            await this.client.destroy();
            console.log('🛑 WhatsApp service stopped');
        }
    }
}

module.exports = WhatsAppService;