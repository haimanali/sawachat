import { IMessage } from "../../domain/IMessage.js";
import { IMessageRecord } from "../../entity/IMessageRecord.js";
import { IRepositoryLayerResponse } from "../../responseFormat.js";
import { DBConn } from "../DBConn.js";
import { IMessageRepository } from "./IMessageRepository.js";

export class MessageRepository implements IMessageRepository
{

    public static getInstance(db_conn : DBConn) : MessageRepository
    {
        if(MessageRepository.instance)
            return MessageRepository.instance;

        MessageRepository.instance = new MessageRepository(db_conn);
        return MessageRepository.instance;
    }

    private static instance : MessageRepository;
    private db_conn : DBConn;
    private constructor(db_conn : DBConn)
    {
        this.db_conn = db_conn;
    }

    private async getMessageByID(msg_id : number) : Promise<IMessage>
    {
        const sql = "select * from Message where message_id = ?";
        const result = await this.db_conn.executeQuery<IMessage>(sql, [msg_id]);

        const room : IMessage = result.data[0];
        return room;
    }

    //overrides
    public async insertMessageRecord(content: string, s_user_id: number, room_id: number): Promise<IRepositoryLayerResponse<IMessage>> {
        const sql = "insert into Message (room_id, user_id, content) values (?, ?, ?)";
        const result = await this.db_conn.executeUpdate(sql, [room_id, s_user_id, content]);

        if (result.affectedRows <= 0)
            throw Error("something went wrong, please try again later");

        const message = await this.getMessageByID(result.insertId);

        return {
            success : true,
            data : message,
            log_message : "message record has been inserted..",
        };
    }

    public async getUserMessages(room_public_id: string, offset: number): Promise<IRepositoryLayerResponse<IMessage []>> {
        const sql = `select (m.message_id, m.public_id, m.room_id, c.username as username, c.nickname as nickname, m.content, m.created_at) 
        from Message m join ChatRoom cr on m.room_id = cr.room_id
        join Client c on c.user_id = m.user_id 
        where cr.public_id = UUID_TO_BIN (?)
        order by m.created_at desc
        limit 10 offset ? ;
        `;

        const result = await this.db_conn.executeQuery<IMessageRecord>(sql, [room_public_id, offset]);
        return {
            success : true,
            data : result.data,
            log_message : "got 10 message from this room",
        };
    }
}