import { IRoom } from "../../domain/IRoom.js";
import { IRoomRecord } from "../../entity/IRoomRecord.js";
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

        private async getRoomByID(room_id : number) : Promise<IRoom>
        {
            const sql = "select room_id, BIN_TO_UUID(public_id) as public_id, HEX(enc_key) as enc_key, room_name, type, created_at from ChatRoom where room_id = ?";
            const result = await this.db_conn.executeQuery<IRoom>(sql, [room_id]);

            const room : IRoom = result.data[0];
            return room;
        }

        
        //overrides
        public async insertChatRoomRecord(room_public_id: string, enc_key : string, type: string): Promise<IRepositoryLayerResponse<IRoom>> {
            const sql = "insert into ChatRoom (public_id, enc_key, type) values ( UUID_TO_BIN (?), UNHEX(?), ? )";
            const result = await this.db_conn.executeUpdate(sql, [room_public_id, enc_key, type]);
 
            if (result.affectedRows === 0)
                throw Error ("something went wrong, please try again later");


            const room = await this.getRoomByID(result.insertId);
            return {
                success : true,
                data : room,
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
            const sql = "select * from ChatRoom where public_id = UUID_TO_BIN (?)";
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

        public async getRoomsByUserID(user_id : number, cursor : Date | null): Promise<IRepositoryLayerResponse<IRoom []>> 
        {
            let sql = `select cr.room_id, BIN_TO_UUID(cr.public_id) as public_id, HEX(cr.enc_key) as enc_key, u.nickname as room_name, u.username as room_subname,cr.type, cr.created_at
            from RoomMembers curr join ChatRoom cr on curr.room_id = cr.room_id 
            join RoomMembers other on other.room_id = curr.room_id and other.user_id != curr.user_id
            join Client u on u.user_id = other.user_id where curr.user_id = ? `;
            
            let params : any[] = [user_id];
            if (cursor)
            {
                sql += "and cr.created_at = ? ";
                params.push(cursor);
            }

            sql += "order by cr.created_at desc limit 10;";
            const result = await this.db_conn.executeQuery<IRoomRecord>(sql, params);

            return {
                success : true,
                data : result.data,
                log_message : "got 10 user rooms...",
            };
        }

} 