import { IClient } from "../../domain/IClient.js";
import bcrypt from 'bcrypt';
import { DBConn } from "./../DBConn.js"
import { IClientRepository } from "./IClientRepository.js";
import { IClientRecord } from "../../entity/IClientRecord.js";
import { IRepositoryLayerResponse } from "../../responseFormat.js";

// this repository handles all the mysql database calls for our users
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

    // we use bcrypt to compare passwords securely
    private async validatePassword(hash_pass : string, password : string) : Promise<boolean>
    {
        const is_match = await bcrypt.compare(password, hash_pass);
        return is_match;
    }

    // this hashes the password before we save it to the database
    private async hashPassword(password: string): Promise<string> {
        const hash_pass = await bcrypt.hash(password, 10);
        return hash_pass;
    }


    // we save the session id so the user stays logged in
    public async insertClientSession(session_id: string, user_id: number, expire: Date): Promise<IRepositoryLayerResponse> {
        const sql = "insert into Session (session_id, user_id, expire) values (UUID_TO_BIN(?), ?, ?)";
        
        const result = await this.db_conn.executeUpdate(sql, [session_id, user_id, expire]);

        if (result.affectedRows === 0)
            throw Error("something went wrong, please try again later.");

        return {
            success : true,
            log_message : "client session has been inserted..",
        };
    }

    // this extends the session for 14 more days
    public async extendSessionByUserID(user_id: number): Promise<IRepositoryLayerResponse> {
        const MAX_AGE = 1000 * 60 * 60 * 24 * 14;
        const sql = "update Session set expire = DATE_ADD(NOW(), INTERVAL 3 HOUR) where user_id = ? and expire < ?";
        const result = await this.db_conn.executeUpdate(sql, [user_id , new Date(Date.now() + MAX_AGE)]);

        if (result.affectedRows <= 0)
            throw Error("session doesn't exist");

        return {
            success : true,
            log_message : "session extended",
        };
    }


    // this gets the user info using their session id from the cookie
    public async getClientBySessionID(session_id: string): Promise<IRepositoryLayerResponse<IClient>> {
        const sql = 
        "select u.user_id, u.username, u.nickname, u.hash_pass, TO_BASE64(u.avatar) AS avatar from Client as u join Session as s on u.user_id = s.user_id where s.session_id = UUID_TO_BIN(?) and s.expire > NOW() and u.is_ban = false";
        
        const result = await this.db_conn.executeQuery<IClientRecord>(sql, [session_id]);

        if (result.count <= 0)
            return {
                success : false,
                log_message : "User session was not found due to expiration or ban",
            };

        const client_record = result.data[0];

        return {
            success : true,
            data : {
                user_id : client_record.user_id,
                username : client_record.username,
                nickname: client_record.nickname,
                avatar: client_record.avatar,
            },
            log_message : "got client by session_id"
        };
    }

    // this checks how many strikes the user has in total
    public async getTotalStrike(user_id: number): Promise<IRepositoryLayerResponse<number>> {
        const sql = "select strike from Client where user_id = ?";
        const result = await this.db_conn.executeQuery<{strike : number}>(sql, [user_id]);

        if (result.count <= 0)
            return {
                success : false,
                log_message : "account not found...",
            };

        return {
            success : true,
            data : result.data[0].strike,
            log_message : "got account strikes",
        };
    }

    public async strikeClient(user_id: number): Promise<IRepositoryLayerResponse> {
        const sql = "update Client set strike = strike + 1 where user_id = ? ";
        const result = await this.db_conn.executeUpdate(sql, [user_id]);

        if (result.affectedRows <= 0)
            throw Error("something went wrong..");

        return {
            success : true,
            log_message : "account strikes updated",
        };

    }

    public async banClient(user_id: number): Promise<IRepositoryLayerResponse> {
        const sql = "update Client set is_ban = true where user_id = ?";
        const result = await this.db_conn.executeUpdate(sql, [user_id]);

        if (result.affectedRows <= 0)
            throw Error("something went wrong..");

        return {
            success : true,
            log_message : "account has been banned",
        };
    }

    public async validateClient(username: string, password: string): Promise<IRepositoryLayerResponse<IClient>>{
        const sql = "select user_id, username, nickname, hash_pass, is_ban, TO_BASE64(avatar) from Client where username = ? and is_ban = false";

        const result = await this.db_conn.executeQuery<IClientRecord>(sql, [username]);
        
        if (result.count <= 0)
            return {
                success : false,
                log_message : "username was not found",
            };

        const [client_record] = result.data;

        console.log(client_record);

        const is_match = await this.validatePassword(client_record.hash_pass, password);
        

        return is_match ?  
        {
            success : true, 
            data : {
                user_id : client_record.user_id, 
                username : client_record.username, 
                nickname : client_record.nickname,
                avatar: client_record.avatar,
            }, 
            log_message : "username is valid"
        } 
        : 
        {
            success : false,
            log_message : "password invalid",
        };
    }

    public async checkClientExist(username : string) : Promise<IRepositoryLayerResponse<IClient>>
    {
        const sql = "select user_id, username, nickname, avatar from Client where username = ?";
        const result = await this.db_conn.executeQuery<IClientRecord>(sql, [username]);

        if (result.count <= 0)
            return {
                success : false,
                log_message : "username was not found",
            };

        const [data] = result.data;
        const client : IClient =        
        {
            user_id : data.user_id,
            username : data.username,
            nickname : data.nickname,
            avatar: data.avatar,
        };

        return {
            success : true, 
            data : client, 
            log_message : "username was found"
        } ;
    }

    public async removeClientSession(session_id : string): Promise<IRepositoryLayerResponse> 
    {
        const sql = "delete from Session where session_id = UUID_TO_BIN(?)";
        const result = await this.db_conn.executeUpdate(sql, [session_id]);


        return {
            success : true,
            log_message : "user logged out successfully..",
        };
    }


    public async updateNickname(user_id: number, nickname: string): Promise<IRepositoryLayerResponse> {
        const sql = "update Client set nickname = ? where user_id = ?";
        const result = await this.db_conn.executeUpdate(sql, [nickname, user_id]);

        if (result.affectedRows === 0)
            throw Error("something went wrong updating nickname.");

        return {
            success: true,
            log_message: "nickname updated",
        };
    }

    public async updateAvatar(user_id: number, avatar: string): Promise<IRepositoryLayerResponse> {
        const cleanBase64 = avatar.includes(',') ? avatar.split(',')[1] : avatar;
        const sql = "update Client set avatar = FROM_BASE64(?) where user_id = ?";
        const result = await this.db_conn.executeUpdate(sql, [cleanBase64, user_id]);

        if (result.affectedRows === 0)
            throw Error("something went wrong updating avatar.");

        return {
            success: true,
            log_message: "avatar updated",
        };
    }

    public async insertClientRecord(username: string, nickname: string, password: string): Promise<IRepositoryLayerResponse<IClient>> {
        const sql = "insert into Client (username, nickname, hash_pass) values (?, ?, ?)";

        const hash_pass = await this.hashPassword(password);
        const result = await this.db_conn.executeUpdate(sql, [username, nickname, hash_pass]);

        if (result.affectedRows === 0)  
            throw Error("something went wrong, please try again later.");

        const client = await this.getClientByUserID(result.insertId);
        
        return {
            success : true,
            data : client.data,
            log_message : "client record was inserted",
        };
    }


    public async getClientByUserID(user_id: number) : Promise<IRepositoryLayerResponse<IClient>>{
        const sql = "select *, TO_BASE64(avatar) as avatar from Client where user_id = ? and is_ban = false";
        const result = await this.db_conn.executeQuery<IClientRecord>(sql, [user_id]);

        if (result.count <= 0)
            return {success : false, log_message : "client id was not found"};

        const [data] = result.data;

        const client : IClient =  {
            user_id : data.user_id,
            username : data.username,
            nickname : data.nickname, 
            avatar: data.avatar,
        };

        return {
            success : true,
            data : client,
            log_message : "client by user id",
        };
    }




}