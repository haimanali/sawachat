import { afterAll, describe, it, expect } from 'vitest';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import mysql from 'mysql2/promise';

const SOCKET_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:3000';
const testUsernames: string[] = [];

const events = {
    onlineStatus: 'online_status',
    message: 'message',
    loadContacts: 'load_contacts',
    loadRooms: 'load_rooms',
    loadRequests: 'load_requests',
    loadNotifications: 'load_notifications',
    onUpdateUserOnlineStatus: 'onupdate_user_online_status',
    onLoadContacts: 'onload_contacts',
    onLoadRooms: 'onload_rooms',
    onLoadRequests: 'onload_requests',
    onLoadNotifications: 'onload_notifications',
};

async function createTestSession(prefix: string) {
    const username = `${prefix}${Date.now().toString(36).slice(-10)}${Math.random().toString(36).slice(2, 5)}`;
    testUsernames.push(username);

    const signupResponse = await axios.post(`${API_URL}/api/signup`, {
        username,
        nickname: 'Tester',
        password: 'Password123!',
    });

    expect(signupResponse.data, signupResponse.data?.log_message).toMatchObject({ success: true });

    const setCookieHeader = signupResponse.headers['set-cookie'];
    const cookie = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
    expect(cookie, 'Signup succeeded but no session cookie was returned').toBeDefined();

    return { username, cookie: cookie || '' };
}

function connectWithCookie(cookie: string) {
    return io(SOCKET_URL, {
        extraHeaders: { cookie },
        reconnection: false,
    });
}

function waitForEvent<T>(socket: Socket, eventName: string, timeoutMs = 5000) {
    return new Promise<T>((resolve, reject) => {
        const timeout = setTimeout(() => {
            socket.off(eventName, onEvent);
            reject(new Error(`Timed out waiting for ${eventName}`));
        }, timeoutMs);

        const onEvent = (payload: T) => {
            clearTimeout(timeout);
            resolve(payload);
        };

        socket.once(eventName, onEvent);
    });
}

afterAll(async () => {
    if (testUsernames.length === 0) return;

    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: 'SawaChat10@',
        database: 'sawachat',
    });

    for (const username of testUsernames) {
        const [rows] = await pool.execute<mysql.RowDataPacket[]>('SELECT user_id FROM Client WHERE username = ?', [username]).catch(() => [[]]);
        const userId = rows[0]?.user_id;
        if (userId) {
            await pool.execute('DELETE FROM Session WHERE user_id = ?', [userId]).catch(() => undefined);
            await pool.execute('DELETE FROM Client WHERE user_id = ?', [userId]).catch(() => undefined);
        }
    }

    await pool.end();
});

describe('SawaChat Real-Time Protocol (Socket.io)', () => {

    // IT-04: Authenticated Protocol Handshake
    // This is the most important test. It proves that a logged-in user 
    // can successfully establish a live WebSocket tunnel.
    it('should establish a secure authenticated connection using session cookies', async () => {
        const { cookie } = await createTestSession('hs');

        return new Promise<void>((resolve, reject) => {
            const clientSocket = connectWithCookie(cookie);

            clientSocket.on('connect', () => {
                // SUCCESS: The server recognized the cookie and opened the tunnel
                expect(clientSocket.connected).toBe(true);
                expect(clientSocket.id).toBeDefined();
                clientSocket.disconnect();
                resolve();
            });

            clientSocket.on('connect_error', (err) => {
                reject(new Error("Handshake failed even with valid cookie: " + err.message));
            });

            setTimeout(() => reject(new Error("Handshake timed out")), 5000);
        });
    });

    it('should respond to the online_status realtime listener', async () => {
        const { cookie } = await createTestSession('os');
        const clientSocket = connectWithCookie(cookie);

        try {
            await waitForEvent(clientSocket, 'connect');
            const response = waitForEvent<{ success: boolean; data?: { state: string } }>(clientSocket, events.onUpdateUserOnlineStatus);

            clientSocket.emit(events.onlineStatus);

            await expect(response).resolves.toMatchObject({
                success: true,
                data: { state: 'online' },
            });
        }
        finally {
            clientSocket.disconnect();
        }
    });

    it('should respond to core message-channel realtime listeners', async () => {
        const { cookie } = await createTestSession('rt');
        const clientSocket = connectWithCookie(cookie);

        try {
            await waitForEvent(clientSocket, 'connect');

            const contactsResponse = waitForEvent<{ success: boolean; data?: unknown[] }>(clientSocket, events.onLoadContacts);
            clientSocket.emit(events.message, { type: events.loadContacts });
            await expect(contactsResponse).resolves.toMatchObject({ success: true, data: [] });

            const roomsResponse = waitForEvent<{ success: boolean; data?: { total_unread: number; rooms: unknown[] } }>(clientSocket, events.onLoadRooms);
            clientSocket.emit(events.message, { type: events.loadRooms, payload: { cursor: null } });
            await expect(roomsResponse).resolves.toMatchObject({
                success: true,
                data: { total_unread: 0, rooms: [] },
            });

            const requestsResponse = waitForEvent<{ success: boolean; data?: unknown[] }>(clientSocket, events.onLoadRequests);
            clientSocket.emit(events.message, { type: events.loadRequests });
            await expect(requestsResponse).resolves.toMatchObject({ success: true, data: [] });

            const notificationsResponse = waitForEvent<{ success: boolean; data?: { notifications: unknown[] } }>(clientSocket, events.onLoadNotifications);
            clientSocket.emit(events.message, { type: events.loadNotifications });
            await expect(notificationsResponse).resolves.toMatchObject({
                success: true,
                data: { notifications: [] },
            });
        }
        finally {
            clientSocket.disconnect();
        }
    });

    // TEST 2: Unauthorized Rejection
    // Proves the "Gatekeeper" middleware is working
    it('should reject connections that do not provide a session cookie', () => {
        return new Promise<void>((resolve) => {
            const clientSocket = io(SOCKET_URL, { reconnection: false });

            clientSocket.on('connect_error', (err) => {
                // If the server rejects us, the security is working!
                expect(err.message).toBeDefined();
                clientSocket.disconnect();
                resolve();
            });
        });
    });

});
