import { Repository } from "../../componantParams.js";
import { IPayloadResponseType, IServiceLayerResponse } from "../../responseFormat.js";
import { IAiService } from "./IAiService.js";
import { gRPCrequest } from "../../repository/AiRepository/IAiRepository.js";
import { IAiVerdict } from "../../domain/IAiVerdict.js";

// this is the main service for handling ai moderation logic
// it uses a singleton pattern so we only have one instance running
export class AiService implements IAiService {

    public static getInstance(repository: Repository): AiService {
        if (!AiService.instance) {
            AiService.instance = new AiService(repository);
        }
        return AiService.instance;
    }

    private static instance: AiService;
    private repository: Repository;
    
    private constructor(repository: Repository) {
        this.repository = repository;
    }


    // this function takes the encrypted message and user info
    // it sends it to the python ai server to check for toxicity
    public async performValidateMessage(content: string, iv: string, enc_key: string, user_id : number): Promise<IServiceLayerResponse<IAiVerdict>> {
        const request : gRPCrequest = {content : content, iv : iv, enc_key : enc_key}
        
        // we call the grpc repo to send data to the python bert server
        const result = await this.repository.Iai_repo.sendContentgRPC( request );

        if (!result.success)
            return result;
        
        // if the ai says the message is toxic we give the user a strike
        if (result.data!.is_toxic)
            {
                // increment the strike count in the mysql database
                const strike = await this.repository.Iclient_repo.strikeClient(user_id);
                const total = await this.repository.Iclient_repo.getTotalStrike(user_id);
                result.data!.total_strike = total.data!;

                // if the user hits the max strikes (3) we ban them permanently
                if ( total.data! >= IPayloadResponseType.MAX_STRIKE )
                {
                    await this.repository.Iclient_repo.banClient(user_id);
                }
            }

        console.log(result);

        return {
            success : result.success,
            data : result.data,
            log_message : result.log_message,
        };
    }
}