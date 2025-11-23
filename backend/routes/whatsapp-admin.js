const express = require('express');
const WhatsAppService = require('../services/whatsapp');

const router = express.Router();

// Global WhatsApp service instance
let whatsappService = null;

// Initialize WhatsApp service
function initializeWhatsAppService() {
    if (!whatsappService) {
        whatsappService = new WhatsAppService();
    }
    return whatsappService;
}

// GET /api/whatsapp/status - Get WhatsApp service status
router.get('/status', async (req, res) => {
    try {
        if (!whatsappService) {
            return res.json({
                success: true,
                status: 'not_initialized',
                message: 'WhatsApp service not initialized'
            });
        }

        const status = await whatsappService.getStatus();
        
        res.json({
            success: true,
            status: status.isReady ? 'ready' : 'not_ready',
            adminNumber: status.adminNumber,
            clientInfo: status.clientState,
            message: status.isReady ? 'WhatsApp service is ready' : 'WhatsApp service is not ready'
        });

    } catch (error) {
        console.error('Error getting WhatsApp status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get WhatsApp status'
        });
    }
});

// POST /api/whatsapp/start - Start WhatsApp service
router.post('/start', async (req, res) => {
    try {
        whatsappService = initializeWhatsAppService();
        
        await whatsappService.start();
        
        res.json({
            success: true,
            message: 'WhatsApp service started. Please scan the QR code in the server console.'
        });

    } catch (error) {
        console.error('Error starting WhatsApp service:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start WhatsApp service'
        });
    }
});

// POST /api/whatsapp/stop - Stop WhatsApp service
router.post('/stop', async (req, res) => {
    try {
        if (!whatsappService) {
            return res.json({
                success: true,
                message: 'WhatsApp service was not running'
            });
        }

        await whatsappService.stop();
        whatsappService = null;
        
        res.json({
            success: true,
            message: 'WhatsApp service stopped successfully'
        });

    } catch (error) {
        console.error('Error stopping WhatsApp service:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to stop WhatsApp service'
        });
    }
});

// POST /api/whatsapp/test - Send test notification
router.post('/test', async (req, res) => {
    try {
        if (!whatsappService) {
            return res.status(400).json({
                success: false,
                error: 'WhatsApp service not initialized'
            });
        }

        const testChatData = {
            sessionId: 'test-session-' + Date.now(),
            userMessage: 'This is a test message from the admin panel',
            botResponse: 'This is a test bot response to verify WhatsApp notifications are working correctly.',
            timestamp: new Date().toISOString()
        };

        const result = await whatsappService.sendChatbotNotification(testChatData);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Test WhatsApp notification sent successfully'
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error || 'Failed to send test notification'
            });
        }

    } catch (error) {
        console.error('Error sending test WhatsApp notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send test notification'
        });
    }
});

// GET /api/whatsapp/config - Get WhatsApp configuration
router.get('/config', (req, res) => {
    res.json({
        success: true,
        config: {
            adminNumber: process.env.WHATSAPP_ADMIN_NUMBER || '2349162810211',
            isConfigured: !!process.env.WHATSAPP_ADMIN_NUMBER
        }
    });
});

module.exports = router;