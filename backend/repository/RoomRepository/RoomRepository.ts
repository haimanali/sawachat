import { IClient } from "../../domain/IClient.js";
import { IRoom } from "../../domain/IRoom.js";
import { IClientRecord } from "../../entity/IClientRecord.js";
import { IRoomRecord } from "../../entity/IRoomRecord.js";
import { IMessagePublic } from "../../public/IMessagePublic.js";
import { IPayloadRequestType } from "../../requestFormat.js";
import { IRepositoryLayerResponse } from "../../responseFormat.js";
import { DBConn } from "../DBConn.js";
import { IRoomRepository } from "./IRoomRepository.js";


export class RoomRepository implements IRoomRepository
{
        public static getInstance(db_conn : DBConn) : RoomRepository
        {
            if(RoomRepository.instance)
                return RoomRepository.instance;
    
            RoomRepository.instance = new RoomRepository(db_conn);
            return RoomRepository.instance;
        }
    
        private static instance : RoomRepository;
        private db_conn : DBConn;
        private constructor(db_conn : DBConn)
        {
            this.db_conn = db_conn;
        }

        
        
        //overrides
    
        public async getRoomByID(room_id : number) : Promise<IRepositoryLayerResponse<IRoom>>
        {
            const sql = `select room_id, BIN_TO_UUID(public_id) as public_id, HEX(enc_key) as enc_key, room_name, type, created_at, last_msg_date, last_message_payload from ChatRoom where room_id = ?`;
            const result = await this.db_conn.executeQuery<IRoom>(sql, [room_id]);

            if (result.count <= 0)
                return {success : false, log_message : "room was not found by ID"};

            const room : IRoom = result.data[0];
            return {success : true, data : room, log_message : "room was found by ID"};;
        }

        public async updateChatRoomPreview(message: IMessagePublic, room_id: number): Promise<IRepositoryLayerResponse> {
            const sql = "UPDATE ChatRoom SET last_message_payload = ?, last_msg_date = NOW() WHERE room_id = ?";
            
            const result = await this.db_conn.executeUpdate(sql, [JSON.stringify(message), room_id]);

            if (result.affectedRows <= 0)
                throw Error("Chat room not found or update failed");

            return {
                success: true,
                log_message: "Chat room preview updated successfully",
            };
        }

        public async insertChatRoomRecord(room_public_id: string, enc_key : string, type: string): Promise<IRepositoryLayerResponse<IRoom>> {
            const sql = "insert into ChatRoom (public_id, enc_key, type) values ( UUID_TO_BIN (?), UNHEX(?), ? )";
            const result = await this.db_conn.executeUpdate(sql, [room_public_id, enc_key, type]);
 
            if (result.affectedRows === 0)
                throw Error ("something went wrong, please try again later");


            const room = await this.getRoomByID(result.insertId);
            return {
                success : true,
                data : room.data!,
                log_message : "chat room record has been inserted..",
            };
            
        }

        public async insertRoomMember(user_id: number, room_id: number): Promise<IRepositoryLayerResponse> {
            const sql = "insert into RoomMembers ( user_id, room_id )values (? , ?)";
            const result = await this.db_conn.executeUpdate(sql, [user_id, room_id]);

            if (result.affectedRows <= 0)
                throw Error ("something went wrong, please try again later");

            return {
                success : true,
                log_message : "room member record has been inserted..",
            };
        }

        public async getRoomByPublicID(public_id: string): Promise<IRepositoryLayerResponse<IRoom>> {
            const sql = "select room_id, BIN_TO_UUID(public_id) as public_id, HEX(enc_key) as enc_key, room_name, type, created_at from ChatRoom where public_id = UUID_TO_BIN (?)";
            const result = await this.db_conn.executeQuery<IRoomRecord>(sql, [public_id]);


            if (result.count <= 0)
                return {
                    success : false,
                    log_message : "couldn't find a room with this public_id",
                };

            const room : IRoom = result.data[0];
            return {
                success : true,
                data : room,
                log_message : "got room by public_id",
            };
        }

        public async updateRoomMemberLastRead(user_id: number, room_id: number): Promise<IRepositoryLayerResponse> {
            const sql = "update RoomMembers set last_read_at = NOW() where user_id = ? and room_id = ?";
            const result = await this.db_conn.executeUpdate(sql, [user_id, room_id]);

            if (result.affectedRows <= 0)
                throw Error("something went wrong");

            return {
                success : true,
                log_message : "last_read_at updated",
            };
        }

        public async getRoomsByUserID(user_id : number, cursor : Date | null): Promise<IRepositoryLayerResponse<IRoom []>> 
        {
            let sql = `select cr.room_id, BIN_TO_UUID(cr.public_id) as public_id, HEX(cr.enc_key) as enc_key, CASE WHEN u.is_ban = true THEN 'User_Banned' ELSE u.nickname END as room_name, u.username as room_subname, cr.type, cr.created_at, other.is_active, cr.last_msg_date, cr.last_message_payload,
            (select count(*) from Message m where m.room_id = curr.room_id and m.created_at > curr.last_read_at) as unread_msgs
            from RoomMembers curr join ChatRoom cr on curr.room_id = cr.room_id 
            join RoomMembers other on other.room_id = curr.room_id and other.user_id != curr.user_id
            join Client u on u.user_id = other.user_id where curr.user_id = ? and curr.is_active = true `;
            
            let params : any[] = [user_id];
            if (cursor)
            {
                sql += "and cr.last_msg_date < ? ";
                params.push(cursor);
            }

            sql +=  ` order by cr.last_msg_date desc limit ${IPayloadRequestType.LIMIT}`;

            const result = await this.db_conn.executeQuery<IRoomRecord>(sql, params);

            return {
                success : true,
                data : result.data,
                log_message : "got 10 user rooms...",
            };
        }

        public async setRoomMemberActivity(is_active : boolean, room_id: number, user_id : number): Promise<IRepositoryLayerResponse> {
            const sql = "update RoomMembers set is_active = ? where room_id = ? and user_id = ?";
            const result = await this.db_conn.executeUpdate(sql, [is_active, room_id, user_id]);

            if (result.affectedRows <= 0)
                throw Error("something went wrong");

            return {
                success : true,
                log_message : "changed room member active state..",
            };
        }

        public async checkRoomActive(room_id: number): Promise<IRepositoryLayerResponse> {
            interface IRoomMemberRecord {
                user_id : number,
                room_id : number,
                is_active : boolean,
                type : "private" | "group",
            };

            const sql = "select rm.user_id, rm.room_id, rm.is_active, cr.type from RoomMembers rm join ChatRoom cr on cr.room_id = rm.room_id where rm.room_id = ? and rm.is_active = true and cr.type = 'private'";
            const result = await this.db_conn.executeQuery<IRoomMemberRecord>(sql, [room_id]);

            if (result.count <= 0)
            {
                return {
                    success : false,
                    log_message : "room is inactive",
                };
            }

            return {
                success : true,
                log_message : "room is active",
            };
        }

        public async deleteRoomRecord(room_id: number): Promise<IRepositoryLayerResponse> {
            const sql = "delete from ChatRoom where room_id = ?";
            const result = await this.db_conn.executeUpdate(sql, [room_id]);

            if (result.affectedRows <= 0)
                throw Error("something went wrong");

            return {
                success : true,
                log_message : "room has been deleted",
            };
        }

        public async getRoomMembers(room_id: number): Promise<IRepositoryLayerResponse< IClient []>> {

            const sql = "select c.user_id, c.username, c.nickname, c.hash_pass from RoomMembers rm join Client c on c.user_id = rm.user_id where rm.room_id = ?";
            const result = await this.db_conn.executeQuery<IClientRecord>(sql, [room_id]);

            if (result.count <= 0)
                return {
                    success : false,
                    log_message : "room_id does not match",
                };
            
            return {
                success : true,
                data : result.data!,
                log_message : "got room members by userid",
            };
        }

} 