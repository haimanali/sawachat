import { IClientRepository } from "../repository/IClientRepository.js";
import { ISignUpRequest } from "../requestFormat.js";
import { ISignUpResponse } from "../responseFormat.js";
import { ISignUpService } from "./ISignUpService.js";

export class SignUpService implements ISignUpService
{
        public static getInstance(Iclient_repo : IClientRepository) : SignUpService
        {
            if(SignUpService.instance)
                return SignUpService.instance;
    
            SignUpService.instance = new SignUpService(Iclient_repo);
            return SignUpService.instance;
        }
    
        private static instance : SignUpService;
        private Iclient_repo : IClientRepository;
        private constructor(Iclient_repo : IClientRepository)
        {
            this.Iclient_repo = Iclient_repo;
        }


        //overrides
        public async userSignUp(req_body: ISignUpRequest): Promise<ISignUpResponse> {
            const result = await this.Iclient_repo.checkClientExist(req_body.username);

            if (result)
                return { success : false, log_message : "User already exists, try loggging in.."};

            
            await this.Iclient_repo.insertClientRecord(req_body.username, req_body.nickname, req_body.password);
            return { success : true, log_message : "Account created successfully.."};
        }
}