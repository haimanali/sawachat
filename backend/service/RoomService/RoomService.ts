import { Repository } from "../../componantParams.js";
import { IRoomService } from "./IRoomService.js";
import { v4 } from 'uuid';
import { IServiceLayerResponse } from "../../responseFormat.js";
import { IRoom } from "../../domain/IRoom.js";
import crypto from "crypto";


export class RoomService implements IRoomService
{

    public static getInstance(repository : Repository) : RoomService
    {
        if (RoomService.instance)
            return RoomService.instance;

        RoomService.instance = new RoomService(repository);
        return RoomService.instance;
    }


    private static instance : RoomService;

    private repository : Repository;
    private constructor(repository : Repository)
    {
        this.repository = repository;
    }

    //overrides

    public generateRoomkey() : string
    {
        return crypto.randomBytes(32).toString("hex");
    }

    public generatePublicID() : string
    {
        const uuid = v4();
        return uuid;
    }

    public async performAddMembers(members : number[], room_id : number) : Promise<IServiceLayerResponse>
    {
        await Promise.all(members.map( async (member) => {
            this.repository.Iroom_repo.insertRoomMember(member, room_id);
        }));

        return {success : true, log_message : "members have been added successfully.."};
    }

    public async performCreateRoom(public_id : string, enc_key : string, type : string): Promise<IServiceLayerResponse<IRoom>> {
        const r_result = await this.repository.Iroom_repo.insertChatRoomRecord(public_id, enc_key, type);
        return { success : true, data : r_result.data, log_message : "New Room has been created"};
    }

    public async performGetRoom(public_id: string): Promise<IServiceLayerResponse<IRoom>> 
    {
        const r_result = await this.repository.Iroom_repo.getRoomByPublicID(public_id);   

        if (!r_result.success)
            return {success : false, log_message : "failed to fetch room"};

        return { success : true, data : r_result.data, log_message : "got room by public_id"};
    }

    public async performLoadRooms(user_id: number, cursor : Date | null): Promise<IServiceLayerResponse<IRoom[]>> 
    {
        const r_result = await this.repository.Iroom_repo.getRoomsByUserID(user_id, cursor);
        
        return {
            success : r_result.success,
            data : r_result.data,
            log_message : "fetched 10 user rooms",
        };
    }
}