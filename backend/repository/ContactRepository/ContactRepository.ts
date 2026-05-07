import { assert } from "console";
import { IRequest } from "../../domain/IRequest.js";
import { IRequestRecord } from "../../entity/IRequestRecord.js";
import { IPayloadRequestType } from "../../requestFormat.js";
import { IRepositoryLayerResponse } from "../../responseFormat.js";
import { DBConn } from "../DBConn.js";
import { IContactRepository } from "./IContactRepository.js";
import { IClient } from "../../domain/IClient.js";
import { IClientRecord } from "../../entity/IClientRecord.js";

export class ContactRepositiry implements IContactRepository
{
    public static getInstance(db_conn : DBConn) : ContactRepositiry
    {
        if(ContactRepositiry.instance)
            return ContactRepositiry.instance;

        ContactRepositiry.instance = new ContactRepositiry(db_conn);
        return ContactRepositiry.instance;
    }

    private static instance : ContactRepositiry;
    private db_conn : DBConn;
    private constructor(db_conn : DBConn)
    {
        this.db_conn = db_conn;
    }


    private async getRequestByID(request_id : number) : Promise<IRequest>
    {
        const sql = "select r.request_id, BIN_TO_UUID(r.public_id) as public_id, r.sender_id, r.receiver_id, c.username, c.nickname, r.status, r.room_id, r.type, r.created_at from Request r join Client c on c.user_id = r.sender_id where r.request_id = ?";
        const result = await this.db_conn.executeQuery<IRequestRecord>(sql, [request_id]);

        const request : IRequest = result.data[0] as IRequest;
        return request;
    }

    //overrides

    public async isRequestPending(r_user_id: number, s_user_id: number, type : string): Promise<IRepositoryLayerResponse<boolean>> {
        const sql = "select request_id, BIN_TO_UUID(public_id) as public_id, sender_id, receiver_id, status, created_at from Request where ((sender_id = ? and receiver_id = ?) or (sender_id = ? and receiver_id = ?)) and (status = 'pending' or status = 'accepted') and type = ?";
        const result = await this.db_conn.executeQuery<IRequestRecord>(sql, [s_user_id, r_user_id, r_user_id, s_user_id, type]);
        
        let return_data : IRepositoryLayerResponse<boolean> = {
            success : true,
            log_message : "request is already sent",
        };
        if (result.count > 0)
        {
            return_data.data = true;
            return return_data;
        }

        return_data.data = false;
        return return_data;
    }

    public async insertContactRequest(public_id : string, r_user_id: number, s_user_id: number): Promise<IRepositoryLayerResponse<IRequest>> {
        const sql = "insert into Request (public_id, sender_id, receiver_id) values (UUID_TO_BIN(?), ?, ?)";
        const result = await this.db_conn.executeUpdate(sql, [public_id, s_user_id, r_user_id]);

        if (result.affectedRows === 0)
            throw Error("something went wrong, please try again later.");

        const request = await this.getRequestByID(result.insertId);

        return {
            success : true,
            data : request,
            log_message : "got last inserted request",
        };
    }

    public async updateRejoinRequest(status: string, request_id: number): Promise<IRepositoryLayerResponse<number>> {
        const sql = "update Request set status = ? where request_id = ? and type = 'reactive'";
        const result = await this.db_conn.executeUpdate(sql, [status, request_id]);

        if (result.affectedRows <= 0)
            return {
                success : false,
                log_message : "request with this ID was not found",
            };
        
        const request = await this.getRequestByID(request_id);

        return {
            success : true,
            data : request.room_id!,
            log_message : "rejoin request updated",
        };
    }

    public async updateContactRequest(status: string, r_user_id: number, s_user_id: number): Promise<IRepositoryLayerResponse> {
        const sql = "update Request set status = ? where sender_id = ? and receiver_id = ? and status = 'pending' and type = 'contact'; ";
        const result = await this.db_conn.executeUpdate(sql, [status, s_user_id, r_user_id]);

        if (result.affectedRows === 0)
            throw Error("something went wrong, please try again later.");
        
        return {
            success : true,
            log_message : "request status has been updated..",
        };
    }

    public async insertContactRecord(r_user_id: number, s_user_id: number): Promise<IRepositoryLayerResponse> {
        const sql = "insert into Contact (user_id, contact_id) values (? , ?), (? , ?)";
        const result = await this.db_conn.executeUpdate(sql, [r_user_id, s_user_id, //row1
                                                                s_user_id, r_user_id]); //row2

        if (result.affectedRows === 0)   
            throw Error("something went wrong, please try again later.");
        
        return {
            success : true,
            log_message : "contact record has been inserted..",
        };
    }

    public async getRequestsByUserID(r_user_id: number): Promise<IRepositoryLayerResponse<IRequest []>> {
        let sql = `select BIN_TO_UUID(r.public_id) as public_id, c.username, c.nickname, r.created_at, r.type 
        from Request r join Client c on r.sender_id = c.user_id
         where r.receiver_id = ? and r.status = 'pending' order by r.created_at desc`;

        const result = await this.db_conn.executeQuery<IRequest>(sql, [r_user_id]);

        return {
            success : true,
            data : result.data,
            log_message : "get requests by user_id",
        };
    }

    public async removeContact(user1: number, user2: number): Promise<IRepositoryLayerResponse> {
        const sql = "delete from Contact where (user_id = ? and contact_id = ?) or (user_id = ? and contact_id = ?)";
        const result = await this.db_conn.executeUpdate(sql, [user1, user2, user2, user1]);

        if (result.affectedRows <= 0)
            throw Error("something went wrong");
        
        return {
            success : true,
            log_message : "contact has been deleted",
        }; 
    }

    public async removeRequest(user1: number, user2: number, type : string): Promise<IRepositoryLayerResponse> {
        const sql = "delete from Request where ((sender_id = ? and receiver_id = ?) or (sender_id = ? and receiver_id = ?)) and type = ?";
        const result = await this.db_conn.executeUpdate(sql, [user1, user2, user2, user1, type]);

        if (result.affectedRows <= 0)
            throw Error("something went wrong");
        
        return {
            success : true,
            log_message : "Request has been deleted",
        }; 
    }

    public async insertRejoinRequest(public_id : string, room_id: number, user_id: number, other_userid : number): Promise<IRepositoryLayerResponse<IRequest>> {
        const sql = "insert into Request (public_id, room_id, sender_id, receiver_id, type) values (UUID_TO_BIN(?), ?, ?, ?, 'reactive');"
        const result = await this.db_conn.executeUpdate(sql, [public_id, room_id, user_id, other_userid]);

        if (result.affectedRows <= 0)
            throw Error("something went wrong please try again later");

        const request = await this.getRequestByID(result.insertId);

        return {
            success : true,
            data : request,
            log_message : "Rejoin request has been sent",
        };
    }

    public async getRequestsByPublicID(req_public_id: string): Promise<IRepositoryLayerResponse<IRequest>> {
        const sql = "select request_id, BIN_TO_UUID(public_id) as public_id, sender_id, request_id, status, created_at, type, room_id from Request where public_id = UUID_TO_BIN(?);"
        const result = await this.db_conn.executeQuery<IRequestRecord>(sql, [req_public_id]);

        if (result.count <= 0)
            return {
                success : false,
                log_message : "no request was found by that ID",
            };
        
        return {
            success : true,
            data : result.data[0],
            log_message : "request was found",
        };
    }

    public async removeReactive(room_id: number): Promise<IRepositoryLayerResponse> {
        const sql = "delete from Request where room_id = ? and type = 'reactive'"
        const result = await this.db_conn.executeUpdate(sql, [room_id]);

        if (result.affectedRows <= 0)
            return {
                success : false,
                log_message : "couldnt find activation request",
            };

        return {
            success : true,
            log_message : "activation request removed",
        };
    }

    public async checkRequestLimit(user_id: number, type: "contact" | "reactive"): Promise<IRepositoryLayerResponse<boolean>> {
        let sql = `select count(*) as total from Request where receiver_id = ? and type = ? and status = 'pending'`
        let params : any = [user_id, type];

        const result = await this.db_conn.executeQuery<{total : number}>(sql, params);
        const [count] = result.data;


        if (count.total >= IPayloadRequestType.LIMIT)
            return {
                success : true,
                data : true,
                log_message : "this user has full request inbox"
            };

        return {
            success : true,
            data : false,
            log_message : "count is less than limit",
        };

    }

    public async getContactsByUserId(user_id: number): Promise<IRepositoryLayerResponse<IClient[]>> {
        const sql = "select cl.user_id, cl.username, cl.nickname from Contact c join Client cl on cl.user_id = c.contact_id where c.user_id = ?";
        const result = await this.db_conn.executeQuery<IClientRecord>(sql, [user_id]);

        return {
            success : true,
            data : result.data,
            log_message : "got client contacts",
        };
    }

}