import {IApiApplication} from "./IApiApplication.js"
import {Services} from "../componantParams.js"
import { IAppLayerResponse } from "../responseFormat.js";
import { IClient } from "../domain/IClient.js";
import { IClientPublic } from "../public/IClientPublic.js";
import { ILoginRequest, ISignUpRequest } from "../requestFormat.js";
import { IRequestPublic } from "../public/IRequestPublic.js";
import { IRoomPublic } from "../public/IRoomPublic.js";
import { IRoom } from "../domain/IRoom.js";
import { IMessagePublic } from "../public/IMessagePublic.js";


export class ApiApplication implements IApiApplication
{
    public static getInstance(services : Services) : ApiApplication 
    {
        if (ApiApplication.instance)
            return ApiApplication.instance

        ApiApplication.instance = new ApiApplication (services);
        return ApiApplication.instance;
    }

    private static instance : ApiApplication;
    private services : Services;
    private constructor (services : Services)
    {
        this.services = services;
    }

    public async authenticateBySessionID(session_id : string): Promise<IAppLayerResponse<IClientPublic, IClient>> {
        const result = await this.services.Isession_service.performVerifySession(session_id);
        if (!result.data)
            return {success : result.success, log_message : result.log_message};
        
        return {
            success : result.success,
            data : 
            {
                username : result.data!.username,
                nickname : result.data!.nickname,
            },
            log_message : result.log_message,

            internal : result.data as IClient,
        };
    }

    public async authenticateByUsername(username : string): Promise<IAppLayerResponse<IClientPublic>> {
        const result = await this.services.Isession_service.performVerifyUsername(username);
        
        if (!result.data)
            return {success : result.success, log_message : result.log_message};
        
        return {
            success : result.success,
            data : 
            {
                username : result.data!.username,
                nickname : result.data!.nickname,
            },
            log_message : result.log_message,
        };
    }

    public async loginUser(req_body: ILoginRequest): Promise<IAppLayerResponse<IClientPublic, { session_id : string }>> 
    {
        const s_result = this.services.Isession_service.generateSessionID();
        const session_id = s_result.data!;
        
        const l_result = await this.services.Ilogin_service.performUserLogin(session_id, req_body.username, req_body.password, req_body.auto_login);
        if (!l_result.success)
            return {
                success : l_result.success,
                log_message : l_result.log_message
            };
        
        const client_public : IClientPublic = {
            username : l_result.data!.username,
            nickname : l_result.data!.nickname,
        };

        return {
            success : l_result.success,
            data : client_public,
            log_message : l_result.log_message,

            internal : 
            {
                session_id : session_id,
            },
        };
    }

    public async registerUser(req_body: ISignUpRequest): Promise<IAppLayerResponse<IClientPublic, { session_id : string }>> 
    {
        const si_result = await this.services.Isignup_service.performUserSignUp(req_body.username, req_body.nickname, req_body.password);
        if (!si_result.success)
            return {
                success : si_result.success,
                log_message : si_result.log_message,
            };

        const s_result = this.services.Isession_service.generateSessionID();
        const session_id = s_result.data!;

        const l_result = await this.services.Ilogin_service.performUserLogin(session_id, si_result.data!.username, req_body.password, true);

        const client_public : IClientPublic = {
            username : l_result.data!.username,
            nickname : l_result.data!.nickname,
        };

        return {
            success : l_result.success,
            data : client_public,
            log_message : l_result.log_message,
            internal : 
            {
                session_id : session_id,
            },
        };
    }

    public async logoutUser(session_id : string): Promise<IAppLayerResponse> 
    {
        return await this.services.Isession_service.performLogOutSession(session_id);
    }

    public async sendContactRequest(r_username : string, s_client : IClient): Promise<IAppLayerResponse<IRequestPublic, IClient>> {
        if (r_username === s_client.username)
            return {
                success : false,
                log_message : "you can't add yourself...",
            }; 

        const s_result = await this.services.Isession_service.performVerifyUsername(r_username);
        
        if (!s_result.success)
            return {
                success : s_result.success,
                log_message : s_result.log_message,
            };
        
        const c_result  = await this.services.Icontact_service.performSendRequest(s_result.data!.user_id, s_client.user_id);

        if (!c_result.success)
            return {
                success : c_result.success,
                log_message : c_result.log_message,
            };

        return {
            success : c_result.success,
            data : {
                public_id : c_result.data!.public_id,
                username : s_client.username,
                nickname : s_client.nickname,
                created_at : c_result.data!.created_at,
            },
            log_message : c_result.log_message,

            internal : s_result.data!,
        };
    }

    public async acceptContactRequest(username : string, request_verdict : boolean, r_client : IClient): Promise<IAppLayerResponse<{r_room : IRoomPublic, s_room : IRoomPublic}, {s_client : IClient, room : IRoom}>> 
    {
        const s_result  = await this.services.Isession_service.performVerifyUsername(username);
        
        if (!s_result.success)
            return {
                success : s_result.success,
                log_message : s_result.log_message,
            };

        const s_client = s_result.data!;
        const c_result  = await this.services.Icontact_service.performVerdictRequest(request_verdict, s_result.data!.user_id, r_client.user_id);
        
        if (!c_result.success)
            return {
                success : c_result.success,
                log_message : c_result.log_message,
            };


        await this.services.Icontact_service.performAddContact(s_client.user_id, r_client.user_id);

        const public_id = this.services.Iroom_service.generatePublicID();
        const enc_key = this.services.Iroom_service.generateRoomkey();
        
        const r_result = await this.services.Iroom_service.performCreateRoom(public_id, enc_key, "private");

        const contact_A : IRoomPublic = 
        {
            enc_key : r_result.data!.enc_key,
            public_id : r_result.data!.public_id,
            room_name : s_client.nickname,
            room_subname : s_client.username,
            type : "private",
            created_at : r_result.data!.created_at,
        };
        const contact_B : IRoomPublic = 
        {
            enc_key : r_result.data!.enc_key,
            public_id : r_result.data!.public_id,
            room_name : r_client.nickname,
            room_subname : r_client.username,
            type : "private",
            created_at : r_result.data!.created_at,
        };

        await this.services.Iroom_service.performAddMembers([r_client.user_id, s_client.user_id], r_result.data!.room_id);

        return {
            success : r_result.success,
            log_message : r_result.log_message,
            data : 
            {
                r_room : contact_A,
                s_room : contact_B,
            },
            internal : 
            {
                s_client : s_client,
                room : r_result.data!,
            }
        };
    }

    public async sendMessage(room_public_id : string, content : string, s_client : IClient): Promise<IAppLayerResponse<IMessagePublic, { room_id : number }>> 
    {
        const r_result = await this.services.Iroom_service.performGetRoom(room_public_id);
        if (!r_result.success)
            return {
                success : r_result.success,
                log_message : r_result.log_message,
            };

        const m_result = await this.services.Imessage_service.performSendMessage(content, s_client.user_id, r_result.data!.room_id);

        return {
            success : m_result.success,
            data : 
            {
                public_id : m_result.data!.public_id,
                username : s_client.username,
                nickname : s_client.nickname,
                content : m_result.data!.content,
                created_at : m_result.data!.created_at,
            },
            log_message : m_result.log_message,

            internal :
            {
                room_id : r_result.data!.room_id,
            },

        };
    }

    public async fetchUserRequests(client: IClient,  cursor : Date | null): Promise<IAppLayerResponse<IRequestPublic[]>> 
    {
        const c_result = await this.services.Icontact_service.performLoadRequests(client.user_id, cursor);

        const request_public : IRequestPublic [] = [];

        c_result.data?.map( (request) => {
            request_public.push(
                {
                    public_id : request.public_id,
                    username : request.username,
                    nickname : request.nickname,
                    created_at : request.created_at,
                }
            );
        });

        return {
            success : true,
            data : request_public,
            log_message : "user requests are ready",
        };
    }

    public async fetchUserRooms(client: IClient, cursor : Date | null): Promise<IAppLayerResponse<IRoomPublic[]>> 
    {
        const r_result = await this.services.Iroom_service.performLoadRooms(client.user_id, cursor);

        const room_public : IRoomPublic [] = [];

        r_result.data!.map( (room) => {
            room_public.push ( 
            {
                enc_key : room.enc_key,
                public_id : room.public_id,
                room_name : room.room_name,
                room_subname : room.room_subname,
                type : room.type,
                created_at : room.created_at,
            });
        });

        return {
            success : r_result.success,
            data : room_public,
            log_message : r_result.log_message,
        };
    }   

    public async fetchUserMessages(room_public_id : string, cursor : Date | null): Promise<IAppLayerResponse<IMessagePublic[]>> 
    {
        const m_result = await this.services.Imessage_service.performLoadMessages(room_public_id, cursor);

        const message_public : IMessagePublic [] = [];

        m_result.data!.map( (message) => {
            message_public.push( {
                public_id : message.public_id,
                username : message.username,
                nickname : message.nickname,
                content : message.content,
                created_at : message.created_at,
            });
        });

        return {
            success : m_result.success,
            data : message_public,
            log_message : m_result.log_message,
        };
    }
    
}