require('dotenv').config();
const { sendNotification } = require('./src/services/notification');

async function test() {
    console.log('Testing Notification Service...');
    try {
        // Use the user's verified number and valid parameters
        const result = await sendNotification(
            '+919740634537', // To (User's Verified Num)
            'Hello from the Notification System! This is a test message.'
        );
        console.log('✅ Notification Sent Successfully:', result);
    } catch (error) {
        console.error('❌ Notification Failed:', error);
    }
}

test();
