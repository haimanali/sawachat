import { Repository } from "../../componantParams.js";
import { IClient } from "../../domain/IClient.js";
import { IServiceLayerResponse } from "../../responseFormat.js";
import { ISessionService } from "./ISessionService.js";
import { v4 as uuidv4 } from 'uuid';

export class SessionService implements ISessionService
{
        public static getInstance(repository : Repository) : SessionService
        {
            if(SessionService.instance)
                return SessionService.instance;
    
            SessionService.instance = new SessionService(repository);
            return SessionService.instance;
        }
    
        private static instance : SessionService;
        private repository : Repository;
    
        private constructor(repository : Repository)
        {
            this.repository = repository;
        }

        //overrides

    public generateSessionID () : IServiceLayerResponse<string>
    {
        return {
            success : true,
            data : uuidv4(),
            log_message : "session id generated.."
        };
    }

    public async performExtendSession(user_id: number): Promise<IServiceLayerResponse> {
        const result = await this.repository.Iclient_repo.extendSessionByUserID(user_id);
        return result;
    }

    public async performVerifySession(session_id : string) : Promise<IServiceLayerResponse<IClient>>
    {
        const cl_result = await this.repository.Iclient_repo.getClientBySessionID(session_id);

        if(!cl_result.success)
        {
            return {success : false , log_message : "user doesn't exists, please SignUp.."};
        }

        return{
            success : true,
            data : cl_result.data!,
            log_message : "Account found, user logged in..",
        };
    }

    public async performVerifyUserID (user_id : number) : Promise<IServiceLayerResponse<IClient>>
    {
        const cl_result = await this.repository.Iclient_repo.getClientByUserID(user_id);
        
        if(!cl_result.success)
        {
            return {success : false , log_message : "user doesn't exists"};
        }

        return{
            success : true,
            data : cl_result.data!,
            log_message : "Account found, user logged in..",
        };
    }

    public async performVerifyUsername(username: string): Promise<IServiceLayerResponse<IClient>> {
        const cl_result = await this.repository.Iclient_repo.checkClientExist(username);
        
        if(!cl_result.success)
        {
            return {success : false , log_message : "user doesn't exists"};
        }

        return{
            success : true,
            data : cl_result.data!,
            log_message : "Account found, user logged in..",
        };
    }

    public async performLogOutSession(session_id : string): Promise<IServiceLayerResponse> 
    {
        return await this.repository.Iclient_repo.removeClientSession(session_id);
    }


}