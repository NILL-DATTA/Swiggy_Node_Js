const webpush = require("../config/webpush");

const sendPushNotification = async (subscription, payload) => {
    try {

        console.log("========== PUSH DEBUG ==========");
        console.log(JSON.stringify(subscription, null, 2));
        console.log("================================");

        await webpush.sendNotification(
            subscription,
            JSON.stringify(payload)
        );

  console.log("✅ Push notification sent");

    } catch (error) {
        console.log("❌ Push Error:", error.message);
    }
};

module.exports = sendPushNotification;