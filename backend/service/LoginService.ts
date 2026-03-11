import { ILoginResponse } from "../responseFormat";
import { ILoginService } from "./ILoginService";
import { IClientRepository } from '../repository/IClientRepositoy'
import { ILoginRequest } from "../requestFormat";
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
        const client = await this.Iclient_repo.getUserBySessionID(session_id);

        if(!client)
        {
            return {success : false};
        }

        if (username && client.username != username)
        {
            return {success : false};
        }

        return{
            success : true,
            username : client.username,
            nickname : client.nickname,           
            session_id : session_id
        };
    }

    public async userLogin(req_body: ILoginRequest): Promise<ILoginResponse> 
    {
        const client = await this.Iclient_repo.checkUserInfo(req_body.username, req_body.password);

        if(!client)
            return {
                success : false,
            };

        const session_id = genarateSessionID();
        const expire = new Date();
        if(req_body.auto_login)
            expire.getDay();
        else
            expire.getHours();

        await this.Iclient_repo.insertUserSession(session_id, client.user_id, expire);

        return {
            success : true,
            username : client.username,
            nickname : client.nickname,
            session_id : session_id
        };        
        
    }

}
