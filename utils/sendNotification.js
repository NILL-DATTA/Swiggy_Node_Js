const webpush = require("../config/webpush");

const sendPushNotification = async (subscription, payload) => {
    try {

        console.log("========== PUSH DEBUG ==========");

        console.log(
            "Subscription:",
            JSON.stringify(subscription, null, 2)
        );

        console.log(
            "Endpoint:",
            subscription?.endpoint
        );

        console.log("================================");

        if (!subscription?.endpoint) {
            throw new Error(
                "Push subscription endpoint missing"
            );
        }

        if (
            !subscription?.keys?.p256dh ||
            !subscription?.keys?.auth
        ) {
            throw new Error(
                "Push subscription keys missing"
            );
        }

        await webpush.sendNotification(
            subscription,
            JSON.stringify(payload)
        );

        console.log("Push notification sent");

    } catch (error) {

        console.error("PUSH ERROR");
        console.error("Message:", error.message);
        console.error("Status Code:", error.statusCode);
        console.error("Body:", error.body);

        throw error;
    }
};

module.exports = sendPushNotification;