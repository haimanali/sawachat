import { IClient } from "../domain/IClient.js";

export class ConnectionManager {
    public static getInstance(): ConnectionManager {
        if (ConnectionManager.instance)
            return ConnectionManager.instance;

        ConnectionManager.instance = new ConnectionManager();
        return ConnectionManager.instance;
    }


    public readonly dispatcher: Map<string, IClient>;
    private static instance: ConnectionManager;
    private constructor() {
        this.dispatcher = new Map<string, IClient>();

        setInterval(() => {
            this.dispatcher.clear();
        }, 1000 * 60 * 1);

    };


    public DispatchSession(session_id: string): IClient | null {
        if (!this.dispatcher.has(session_id))
            return null;

        const client = this.dispatcher.get(session_id);
        return client!;
    }
}