import { Response } from 'express';

interface SSEClient {
    id: string;
    userId: string;
    role: string;
    firmId: string;
    response: Response;
}

class SSEService {
    private clients: Map<string, SSEClient> = new Map();

    /**
     * Add a new SSE client connection
     */
    addClient(client: SSEClient): void {
        this.clients.set(client.id, client);
        console.log(`SSE client connected: ${client.id} (${client.role})`);
        console.log(`Total connected clients: ${this.clients.size}`);
    }

    /**
     * Remove an SSE client connection
     */
    removeClient(clientId: string): void {
        const client = this.clients.get(clientId);
        if (client) {
            this.clients.delete(clientId);
            console.log(`SSE client disconnected: ${clientId}`);
            console.log(`Total connected clients: ${this.clients.size}`);
        }
    }

    /**
     * Send event to a specific client
     */
    sendToClient(clientId: string, event: string, data: any): void {
        const client = this.clients.get(clientId);
        if (client) {
            client.response.write(`event: ${event}\n`);
            client.response.write(`data: ${JSON.stringify(data)}\n\n`);
        }
    }

    /**
     * Broadcast event to all clients in a firm
     */
    broadcastToFirm(firmId: string, event: string, data: any): void {
        let count = 0;
        this.clients.forEach((client) => {
            if (client.firmId === firmId) {
                client.response.write(`event: ${event}\n`);
                client.response.write(`data: ${JSON.stringify(data)}\n\n`);
                count++;
            }
        });
        console.log(`Broadcasted ${event} to ${count} clients in firm ${firmId}`);
    }

    /**
     * Broadcast event to specific roles in a firm
     */
    broadcastToRoles(firmId: string, roles: string[], event: string, data: any): void {
        let count = 0;
        this.clients.forEach((client) => {
            if (client.firmId === firmId && roles.includes(client.role)) {
                client.response.write(`event: ${event}\n`);
                client.response.write(`data: ${JSON.stringify(data)}\n\n`);
                count++;
            }
        });
        console.log(`Broadcasted ${event} to ${count} clients with roles ${roles.join(', ')}`);
    }

    /**
     * Send heartbeat to all clients to keep connection alive
     */
    sendHeartbeat(): void {
        this.clients.forEach((client) => {
            client.response.write(`: heartbeat\n\n`);
        });
    }

    /**
     * Get number of connected clients
     */
    getClientCount(): number {
        return this.clients.size;
    }

    /**
     * Get clients by firm
     */
    getClientsByFirm(firmId: string): SSEClient[] {
        return Array.from(this.clients.values()).filter(
            (client) => client.firmId === firmId
        );
    }
}

// Singleton instance
const sseService = new SSEService();

// Send heartbeat every 30 seconds to keep connections alive
setInterval(() => {
    sseService.sendHeartbeat();
}, 30000);

export default sseService;
