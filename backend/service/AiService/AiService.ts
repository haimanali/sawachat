import { Repository } from "../../componantParams.js";
import { IPayloadResponseType, IServiceLayerResponse } from "../../responseFormat.js";
import { IAiService } from "./IAiService.js";
import { gRPCrequest } from "../../repository/AiRepository/IAiRepository.js";
import { IAiVerdict } from "../../domain/IAiVerdict.js";

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


    public async performValidateMessage(content: string, iv: string, enc_key: string, user_id : number): Promise<IServiceLayerResponse<IAiVerdict>> {
        const request : gRPCrequest = {content : content, iv : iv, enc_key : enc_key}
        const result = await this.repository.Iai_repo.sendContentgRPC( request );

        if (result.data!.is_toxic)
            {
                const strike = await this.repository.Iclient_repo.strikeClient(user_id);
                const total = await this.repository.Iclient_repo.getTotalStrike(user_id);

                if ( total.data! >= IPayloadResponseType.MAX_STRIKE )
                {
                    await this.repository.Iclient_repo.banClient(user_id);
                    result.data!.total_strike = IPayloadResponseType.MAX_STRIKE;
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