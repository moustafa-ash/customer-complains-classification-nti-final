from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq()

print("Available Groq Models:")
print("-" * 30)

for model in client.models.list().data:
    print(model.id)