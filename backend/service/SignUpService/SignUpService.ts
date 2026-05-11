import { Repository } from '../../componantParams.js';
import { IClient } from '../../domain/IClient.js';
import { IServiceLayerResponse} from "../../responseFormat.js";
import { ISignUpService } from "./ISignUpService.js";

// this service handles new user registrations
export class SignUpService implements ISignUpService
{
        public static getInstance(repository : Repository) : SignUpService
        {
            if(SignUpService.instance)
                return SignUpService.instance;
    
            SignUpService.instance = new SignUpService(repository);
            return SignUpService.instance;
        }
    
        private static instance : SignUpService;
        private repository : Repository;
        private constructor(repository : Repository)
        {
            this.repository = repository;
        }


        // this function creates a new user account if the username isn't taken
        public async performUserSignUp(username : string, nickname : string, password : string): Promise<IServiceLayerResponse<IClient>> 
        {
            // we check if the user already exists in the database
            const c_result = await this.repository.Iclient_repo.checkClientExist(username);
            
            if(c_result.success)
            {
                return {success : false , log_message : "either User exists / account has been suspended"};
            }
   
            // we save the new user information to the database
            const r_result = await this.repository.Iclient_repo.insertClientRecord(username, nickname, password);
            return { success : true, data : r_result.data!, log_message : "Account created successfully.."};
        }
}