import { IClient } from "../domain/IClient.js";
import bcrypt from 'bcrypt';
import { DBConn } from "./DBConn.js"
import { IClientRepository } from "./IClientRepository.js";
import { IClientRecord } from "../entity/IClientRecord.js";

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

    private async validatePassword(hash_pass : string, password : string) : Promise<boolean>
    {
        const is_match = await bcrypt.compare(password, hash_pass);
        return is_match;
    }

    private async hashPassword(password: string): Promise<string> {
        const hash_pass = await bcrypt.hash(password, 10);
        return hash_pass;
    }

    //overrides
    
    public async insertClientSession(session_id: string, user_id: number, expire: Date): Promise<void> {
        const sql = "insert into Session (session_id, user_id, expire) values (UUID_TO_BIN(?), ?, ?)";
        
        const result = await this.db_conn.executeUpdate(sql, [session_id, user_id, expire]);

        if (result.affectedRows === 0)
            throw Error("something went wrong, please try again later.");
    }

    public async getClientBySessionID(session_id: string): Promise<IClient | null> {
        const sql = 
        "select u.user_id, u.username, u.nickname, u.hash_pass from Client as u join Session as s on u.user_id = s.user_id where s.session_id = UUID_TO_BIN(?)";
        
        const result = await this.db_conn.executeQuery<IClientRecord>(sql, [session_id]);

        if (result.count <= 0)
            return null;

        const client_record = result.data[0];

        return {
            user_id : client_record.user_id,
            username : client_record.username,
            nickname : client_record.nickname, 
        };
    }

    public async checkClientExist(username : string) : Promise<boolean>
    {
        const sql = "select username from Client where username = ?";
        const result = await this.db_conn.executeQuery<IClientRecord>(sql, [username]);

        if (result.count > 0)
            return true;

        return false;
    }

    public async checkClientInfo(username: string, password: string): Promise<IClient | null>{
        const sql = "select user_id, username, nickname, hash_pass from Client where username = ?";

        const result = await this.db_conn.executeQuery<IClientRecord>(sql, [username]);
        
        if (result.count <= 0)
            return null;

        const [client_record] = result.data;

        const is_match = await this.validatePassword(client_record.hash_pass, password);

        return is_match ?
        {
            user_id : client_record.user_id,
            username : client_record.username,
            nickname : client_record.nickname, 
        } 
        : null;
    }

    public async insertClientRecord(username: string, nickname: string, password: string): Promise<void> {
        const sql = "insert into Client (username, nickname, hash_pass) values (?, ?, ?)";

        const hash_pass = await this.hashPassword(password);
        const result = await this.db_conn.executeUpdate(sql, [username, nickname, hash_pass]);

        if (result.affectedRows === 0)  
            throw Error("something went wrong, please try again later.");

    }




}