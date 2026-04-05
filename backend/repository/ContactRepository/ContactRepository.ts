import { IRequest } from "../../domain/IRequest.js";
import { IRequestRecord } from "../../entity/IRequestRecord.js";
import { IRepositoryLayerResponse } from "../../responseFormat.js";
import { DBConn } from "../DBConn.js";
import { IContactRepository } from "./IContactRepository.js";

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
        const sql = "select request_id, BIN_TO_UUID(public_id) as public_id, sender_id, receiver_id, status, created_at from Request r join Client c on r.sender_id = c.user_id where r.request_id = ?";
        const result = await this.db_conn.executeQuery<IRequest>(sql, [request_id]);

        const request : IRequest = result.data[0] as IRequest;
        return request;
    }

    //overrides

    public async isRequestPending(r_user_id: number, s_user_id: number): Promise<IRepositoryLayerResponse<boolean>> {
        const sql = "select request_id, BIN_TO_UUID(public_id) as public_id, sender_id, receiver_id, status, created_at from Request where ((sender_id = ? and receiver_id = ?) or (sender_id = ? and receiver_id = ?)) and status = 'pending'";
        const result = await this.db_conn.executeQuery<IRequestRecord>(sql, [s_user_id, r_user_id, r_user_id, s_user_id]);
        
        let return_data : IRepositoryLayerResponse<boolean> = {
            success : true,
            log_message : "got request status..",
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

    public async updateContactRequest(status: string, r_user_id: number, s_user_id: number): Promise<IRepositoryLayerResponse> {
        const sql = "update Request set status = ? where sender_id = ? and receiver_id = ? and status = 'pending'; ";
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

    public async getRequestsByUserID(r_user_id: number, cursor : Date | null): Promise<IRepositoryLayerResponse<IRequest []>> {
        let sql = "select BIN_TO_UUID(r.public_id) as public_id, c.username, c.nickname, r.created_at from Request r join Client c on r.sender_id = c.user_id where r.receiver_id = ? and r.status = 'pending' ";
        let params : any[] = [r_user_id];

        if (cursor)
        {
            sql += "and r.created_at = ? ";
            params.push(cursor);
        }

        sql += "order by r.created_at desc limit 10;";

        const result = await this.db_conn.executeQuery<IRequest>(sql, params);

        return {
            success : true,
            data : result.data,
            log_message : "get requests by user_id",
        };
    }
}