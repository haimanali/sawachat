import { IMessage } from "../../domain/IMessage.js";
import { IMessageRecord } from "../../entity/IMessageRecord.js";
import { IPayloadRequestType } from "../../requestFormat.js";
import { IRepositoryLayerResponse, IServiceLayerResponse } from "../../responseFormat.js";
import { DBConn } from "../DBConn.js";
import { IMessageRepository } from "./IMessageRepository.js";

export class MessageRepository implements IMessageRepository {

    public static getInstance(db_conn: DBConn): MessageRepository {
        if (MessageRepository.instance)
            return MessageRepository.instance;

        MessageRepository.instance = new MessageRepository(db_conn);
        return MessageRepository.instance;
    }

    private static instance: MessageRepository;
    private db_conn: DBConn;
    private constructor(db_conn: DBConn) {
        this.db_conn = db_conn;
    }

    private async getMessageByID(msg_id: number): Promise<IMessage> {
        const sql = "select message_id, BIN_TO_UUID(public_id) as public_id, TO_BASE64(iv) as iv, room_id, user_id, TO_BASE64(content) as content, created_at, is_delivered, is_read  from Message where message_id = ?";
        const result = await this.db_conn.executeQuery<IMessage>(sql, [msg_id]);

        const room: IMessage = result.data[0];
        return room;
    }

    //overrides
    public async insertMessageRecord(public_id: string, iv: string, content: string, s_user_id: number, room_id: number): Promise<IRepositoryLayerResponse<IMessage>> {
        const sql = "insert into Message (public_id, iv, room_id, user_id, content) values (UUID_TO_BIN(?), FROM_BASE64(?), ?, ?, FROM_BASE64(?))";
        const result = await this.db_conn.executeUpdate(sql, [public_id, iv, room_id, s_user_id, content]);

        if (result.affectedRows <= 0)
            throw Error("something went wrong, please try again later");

        const message = await this.getMessageByID(result.insertId);

        return {
            success: true,
            data: message,
            log_message: "message record has been inserted..",
        };
    }

    public async updateMessageIsDel(msg_public_id: string): Promise<IRepositoryLayerResponse> {
        const sql = "update Message set is_del = true where public_id = UUID_TO_BIN(?)";
        const result = await this.db_conn.executeUpdate(sql, [msg_public_id]);

        if (result.affectedRows <= 0)
            throw Error("something went wrong");

        return {
            success : true,
            log_message : "message was tagged deleted",
        };
    }

    public async updateAllMessageDelivered(user_id: number): Promise<IRepositoryLayerResponse<IMessage[]>> {

        const sel_sql = `select m.message_id, BIN_TO_UUID(m.public_id) as public_id, TO_BASE64(m.iv) as iv, BIN_TO_UUID(cr.public_id) as room_public_id, m.room_id, m.user_id, TO_BASE64(m.content) as content, m.created_at, m.is_delivered, m.is_read, m.is_del
        from Message as m join ChatRoom as cr on m.room_id = cr.room_id where m.is_delivered = false and m.user_id != ? and m.room_id in 
        ( select rm.room_id from RoomMembers as rm where rm.user_id = ?)`;

        const result = await this.db_conn.executeQuery<IMessageRecord>(sel_sql, [user_id, user_id]);

        if (result.data.length > 0) {
            const upt_sql = "update Message set is_delivered = true where is_delivered = false and user_id != ? and room_id = ( select room_id from RoomMembers where user_id = ?)";
            const upt_result = await this.db_conn.executeUpdate(upt_sql, [user_id, user_id]);
        }

        let messages: IMessage[] = [];

        result.data.map((before_message) => {
            messages.push({
                ...before_message,
                is_delivered: true,
            });
        });

        return {
            success: true,
            data: messages,
            log_message: "received messages marks delivered",
        }
    }

    public async updateMessageDeliverRecord(public_id: string, is_delivered: boolean): Promise<IRepositoryLayerResponse> {
        const sql = "update Message set is_delivered = ? where public_id = UUID_TO_BIN(?)";
        const result = await this.db_conn.executeUpdate(sql, [is_delivered, public_id]);

        if (result.affectedRows <= 0)
            throw Error("something went wrong, please try again later");

        return {
            success: true,
            log_message: "message deliver column update",
        };
    }

    public async getClientMessages(room_public_id: string, cursor: Date | null): Promise<IRepositoryLayerResponse<IMessage[]>> {
        let sql = `select m.message_id, m.room_id, BIN_TO_UUID(m.public_id) as public_id, TO_BASE64(m.iv) as iv, BIN_TO_UUID(cr.public_id) as room_public_id, c.username as username, c.nickname as nickname, TO_BASE64(m.content) as content, m.created_at, m.is_delivered, m.is_read, m.is_del  
        from Message m join ChatRoom cr on m.room_id = cr.room_id
        join Client c on c.user_id = m.user_id 
        where cr.public_id = UUID_TO_BIN (?) `;

        let params: any[] = [room_public_id];

        if (cursor) {
            sql += "and m.created_at < ? ";
            params.push(cursor);
        }

        sql +=` order by m.created_at desc limit ${IPayloadRequestType.LIMIT}`;

        const result = await this.db_conn.executeQuery<IMessageRecord>(sql, params);
        return {
            success: true,
            data: result.data,
            log_message: "got 10 message from this room",
        };
    }

    public async getTotalUnread(user_id: number): Promise<IServiceLayerResponse<number>> {
        const sql = `SELECT COUNT(*) as total 
                    FROM Message m
                    JOIN RoomMembers rm ON m.room_id = rm.room_id
                    WHERE rm.user_id = ? AND m.created_at > rm.last_read_at`;
        const result = await this.db_conn.executeQuery<{total : number}>(sql, [user_id]);
        const [total] = result.data;

        return {
            success : true,
            data : total.total,
            log_message : "total unread messages",
        };
    }
}