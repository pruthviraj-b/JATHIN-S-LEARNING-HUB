const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

let client;
let qrCodeData = null;
let customStatus = 'initializing'; // initializing, qr_ready, ready, disconnected

const initializeWhatsApp = () => {
    console.log('Initializing WhatsApp Client...');
    client = new Client({
        authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }), // Persists session
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    client.on('qr', (qr) => {
        console.log('QR RECEIVED', qr);
        // Convert to data URL for frontend
        qrcode.toDataURL(qr, (err, url) => {
            if (!err) {
                qrCodeData = url;
                customStatus = 'qr_ready';
            }
        });
    });

    client.on('ready', () => {
        console.log('WhatsApp Client is ready!');
        customStatus = 'ready';
        qrCodeData = null;
    });

    client.on('authenticated', () => {
        console.log('WhatsApp Authenticated');
        customStatus = 'ready'; // provisional
    });

    client.on('auth_failure', msg => {
        console.error('WhatsApp Auth Failure', msg);
        customStatus = 'disconnected';
    });

    client.on('disconnected', (reason) => {
        console.log('WhatsApp Disconnected', reason);
        customStatus = 'disconnected';
        client.destroy();
        client.initialize(); // Auto restart
    });

    client.initialize();
};

// Start immediately (or can be lazy loaded)
initializeWhatsApp();

const getWhatsAppStatus = () => {
    return {
        status: customStatus,
        qrCode: qrCodeData
    };
};

const sendWhatsAppMessage = async (phone, message) => {
    if (customStatus !== 'ready') throw new Error('WhatsApp client not ready');

    // Format phone: remove +, spaces, ensure country code (91 default for India if missing)
    let number = phone.replace(/[^\d]/g, '');
    if (number.length === 10) number = '91' + number; // Default to India
    if (!number.endsWith('@c.us')) number += '@c.us';

    try {
        const response = await client.sendMessage(number, message);
        return response;
    } catch (err) {
        console.error('Send Error:', err);
        throw err;
    }
};

const logoutWhatsApp = async () => {
    try {
        await client.logout();
        customStatus = 'disconnected';
    } catch (e) {
        console.error(e);
    }
};

module.exports = { getWhatsAppStatus, sendWhatsAppMessage, logoutWhatsApp };
