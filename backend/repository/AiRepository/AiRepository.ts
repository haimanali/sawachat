import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { gRPCrequest, IAiRepository } from "./IAiRepository.js";
import { IAiVerdict } from '../../domain/IAiVerdict.js';
import { IRepositoryLayerResponse } from '../../responseFormat.js';

interface ToxicityScannerClient {
    AnalyzeMessage(
        request: gRPCrequest,
        callback: (error: grpc.ServiceError | null, response: IAiVerdict) => void
    ): void;
}

// this repo handles the grpc connection to the python server
// we use grpc because its fast and lets us talk to python from nodejs
export class AiRepository implements IAiRepository {
    public static getInstance(): AiRepository {
        if (AiRepository.instance)
            return AiRepository.instance;

        AiRepository.instance = new AiRepository();
        return AiRepository.instance;
    }

    private static instance: AiRepository;
    private gRPC_conn: ToxicityScannerClient;

    private constructor() {
        this.gRPC_conn = this.initGrpcClient();
    }


    // here we load the proto file and connect to the local python server on port 50051
    private initGrpcClient(): ToxicityScannerClient {
        const PROTO_PATH = path.join(process.cwd(), 'repository', 'AiRepository', 'serviceContract.proto');
        const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
        });

        const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
        const toxicityPkg = protoDescriptor.toxicity as any;

        // the python server runs on localhost:50051
        return new toxicityPkg.ToxicityScanner(
            'localhost:50051',
            grpc.credentials.createInsecure()
        );
    }


    // this is the main function that sends the message text to be scanned
    public async sendContentgRPC(request: gRPCrequest): Promise<IRepositoryLayerResponse<IAiVerdict>> {
        console.log(request);
        return new Promise((resolve) => {

            // we call the analyzemessage function defined in our proto file
            this.gRPC_conn.AnalyzeMessage(request, (error, response) => {

                if (error) 
                {
                    console.error(error.message);
                    return resolve({success : false, log_message : "service is down"});
                }

                // the response tells us if the message was toxic or safe
                resolve({
                    success: true,
                    data: response, 
                    log_message: "message checked..",
                });
            });
        });
    }
}