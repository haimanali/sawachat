import asyncio
from transformers import pipeline

class ToxicityModel:
    def __init__(self):
        print("Loading Toxic-BERT model into memory...")
        # Load the fine-tuned BERT model
        self.classifier = pipeline("text-classification", model="unitary/toxic-bert")
        print("Model loaded successfully.")

    async def evaluate_text(self, text: str) -> dict:
        """
        Evaluates text for toxicity. 
        Runs in a separate thread to prevent blocking the async gRPC event loop.
        """
        # Await the synchronous classifier inside a thread
        result = await asyncio.to_thread(self.classifier, text)
        top_result = result[0] 
        
        # Determine boolean flag based on score and label
        is_toxic = top_result['label'].lower() == 'toxic' and top_result['score'] > 0.5
        
        return {
            "label": top_result['label'],
            "score": top_result['score'],
            "is_toxic": is_toxic
        }