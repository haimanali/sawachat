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

        return new toxicityPkg.ToxicityScanner(
            'localhost:50051',
            grpc.credentials.createInsecure()
        );
    }


    public async sendContentgRPC(request: gRPCrequest): Promise<IRepositoryLayerResponse<IAiVerdict>> {
        console.log(request);
        return new Promise((resolve) => {

            this.gRPC_conn.AnalyzeMessage(request, (error, response) => {

                if (error) 
                    throw Error(error.message);

                resolve({
                    success: true,
                    data: response, 
                    log_message: "message checked..",
                });
            });
        });
    }
}