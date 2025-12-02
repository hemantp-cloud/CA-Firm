import Pusher from 'pusher';

// Initialize Pusher client
const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true,
});

/**
 * Trigger a real-time event
 * @param channel The channel to publish to (e.g., 'firm-123', 'user-456')
 * @param event The event name (e.g., 'document-uploaded', 'status-updated')
 * @param data The data to send with the event
 */
export const triggerEvent = async (channel: string, event: string, data: any) => {
    try {
        await pusher.trigger(channel, event, data);
        console.log(`Pusher event triggered: ${event} on ${channel}`);
    } catch (error) {
        console.error('Pusher trigger error:', error);
    }
};

/**
 * Helper for document events
 */
export const triggerDocumentEvent = async (
    firmId: string,
    userId: string,
    event: 'document-uploaded' | 'document-updated',
    data: any
) => {
    // Notify firm (Admin/CA)
    await triggerEvent(`firm-${firmId}`, event, data);

    // Notify specific user (Client)
    await triggerEvent(`user-${userId}`, event, data);
};
