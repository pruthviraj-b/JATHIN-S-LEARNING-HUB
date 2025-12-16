const twilio = require('twilio');

// Initialize Twilio client if credentials exist
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const senderNumber = process.env.TWILIO_PHONE_NUMBER;

let client;
if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
}

/**
 * Send a message via SMS/WhatsApp
 * @param {string} to - The recipient's phone number
 * @param {string} body - The message content
 */
async function sendNotification(to, body) {
    if (!to) {
        console.warn('⚠️ Notification skipped: No phone number provided');
        return { success: false, error: 'No phone number' };
    }

    // Mock mode if no credentials
    if (!client) {
        console.log(`\n🔔 [MOCK NOTIFICATION] To: ${to}\n📝 "${body}"\n(No credentials found in .env, message verified in logs)\n`);
        return { success: true, mock: true };
    }

    // Auto-format for India (+91) if missing
    let formattedTo = to.trim();
    if (!formattedTo.startsWith('+')) {
        // Assume India if 10 digits
        if (formattedTo.length === 10) {
            formattedTo = `+91${formattedTo}`;
        } else {
            // Or just prepend +91 anyway if it looks like a mobile number? 
            // safest is to just add it if missing and hope user enters 10 digits
            // But existing code might have + or not.
            // Let's stick to the 10 digit rule or just safe prepend if it looks numeric and no plus
            formattedTo = `+91${formattedTo}`;
        }
    }

    try {
        const message = await client.messages.create({
            body: body,
            from: senderNumber,
            to: formattedTo
        });
        console.log(`✅ Notification Sent to ${to}: ${message.sid}`);
        return { success: true, sid: message.sid };
    } catch (error) {
        console.error(`❌ Failed to send notification to ${to}:`, error.message);
        return { success: false, error: error.message };
    }
}

module.exports = { sendNotification };
