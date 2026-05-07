import grpc
import base64
import asyncio
import logging
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag

# Import generated gRPC files
from gRPC import serviceContract_pb2 
from gRPC import serviceContract_pb2_grpc

# Import your model class
from model import ToxicityModel

class ToxicityScannerServicer(serviceContract_pb2_grpc.ToxicityScannerServicer):
    def __init__(self, ai_model: ToxicityModel):
        self.ai_model = ai_model

    async def AnalyzeMessage(self, request, context):
        try:
            # 1. Decode hex payloads from the gRPC request
            key = bytes.fromhex(request.enc_key)

            iv = base64.b64decode(request.iv)
            ciphertext = base64.b64decode(request.content)

            # 2. Decrypt using AES-GCM
            aesgcm = AESGCM(key)
            plaintext_bytes = aesgcm.decrypt(nonce=iv, data=ciphertext, associated_data=None)
            plaintext = plaintext_bytes.decode('utf-8')

            # 3. Await the response from the model
            verdict = await self.ai_model.evaluate_text(plaintext)

            # 4. Construct and return the response over the open TCP channel
            return serviceContract_pb2.VerdictResponse(
                label=verdict["label"],
                score=verdict["score"],
                is_toxic=verdict["is_toxic"]
            )

        except InvalidTag:
            # This triggers if the decryption key is wrong or data was tampered with
            await context.abort(grpc.StatusCode.UNAUTHENTICATED, 'Decryption failed: Invalid AES-GCM Authentication Tag.')
            
        except Exception as e:
            # Catch-all for other errors
            await context.abort(grpc.StatusCode.INTERNAL, f'Internal server error: {str(e)}')

async def serve():
    # 1. Initialize the model once before starting the server
    ai_model = ToxicityModel()

    # 2. Create the Async gRPC Server
    server = grpc.aio.server()
    serviceContract_pb2_grpc.add_ToxicityScannerServicer_to_server(
        ToxicityScannerServicer(ai_model), server
    )
    
    # 3. Open the port
    server.add_insecure_port('[::]:50051')
    print("Async gRPC Server is listening on port 50051...")
    
    # 4. Start listening
    await server.start()
    await server.wait_for_termination()

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    # Run the main async event loop
    asyncio.run(serve())