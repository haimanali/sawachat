import { ILoginResponse } from "../responseFormat.js";
import { ILoginService } from "./ILoginService.js";
import { IClientRepository } from '../repository/IClientRepository.js'
import { ILoginRequest } from "../requestFormat.js";
import { v4 as genarateSessionID } from 'uuid';

export class LoginService implements ILoginService{
    public static getInstance(Iclient_repo : IClientRepository) : LoginService
    {
        if(LoginService.instance)
            return LoginService.instance;

        LoginService.instance = new LoginService(Iclient_repo);
        return LoginService.instance;
    }

    private static instance : LoginService;
    private Iclient_repo : IClientRepository;
    private constructor(Iclient_repo : IClientRepository)
    {
        this.Iclient_repo = Iclient_repo;
    }

    //overrides
    public async verifySession(session_id : string, username? : string) : Promise<ILoginResponse>
    {
        const client = await this.Iclient_repo.getClientBySessionID(session_id);

        if(!client)
        {
            return {success : false , log_message : "user doesn't exists, please SignUp.."};
        }

        if (username && client.username != username)
        {
            return {success : false, log_message : "username doesn't match session id"};
        }

        return{
            success : true,
            username : client.username,
            nickname : client.nickname,           
            session_id : session_id,
            log_message : "Account found, user logged in..",
        };
    }

    public async userLogin(req_body: ILoginRequest): Promise<ILoginResponse> 
    {
        const client = await this.Iclient_repo.checkClientInfo(req_body.username, req_body.password);

        if(!client)
            return {
                success : false,
                log_message : "user doesn't exists, please SignUp..",
            };

        const session_id = genarateSessionID();
        const expire = new Date();
        if(req_body.auto_login)
            expire.getDay();
        else
            expire.getHours();

        await this.Iclient_repo.insertClientSession(session_id, client.user_id, expire);

        return {
            success : true,
            username : client.username,
            nickname : client.nickname,
            session_id : session_id,
            log_message : "Account found, user logged in..",
        };        
        
    }

}
