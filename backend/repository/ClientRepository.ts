import { DBConn } from "./DBConn";
import { IClientRepository } from "./IClientRepositoy";

export class ClientRepository implements IClientRepository 
{
    public static getInstance(db_conn : DBConn) : ClientRepository
    {
        if(ClientRepository.instance)
            return ClientRepository.instance;

        ClientRepository.instance = new ClientRepository(db_conn);
        return ClientRepository.instance;
    }

    private static instance : ClientRepository;
    private db_conn : DBConn;
    private constructor(db_conn : DBConn)
    {
        this.db_conn = db_conn;
    }

    public compare(session_id: string, username: string): boolean {
        
    }

    public getUsername(session_id: string): string {
        
    }


}