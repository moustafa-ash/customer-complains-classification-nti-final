import json
import os

from groq import Groq


class AgentRouter:
    def __init__(self, faq_path="faq/knowledge_base.json"):
        with open(faq_path, 'r') as file:
            self.knowledge_base = json.load(file)
        print("Knowledge base loaded successfully!")

        self.client = Groq()


    def route_to_agent(self, category, complaint_text):
        if category == "Other Problem":
            return "SYSTEM: Confidence too low. Escalating to a HUMAN SUPERVISOR..."
        
        specific_faq = self.knowledge_base.get(category, {})
        faq_string = json.dumps(specific_faq, indent=2)
        
        system_prompt = f"""You are a Bank Customer Complaint Routing Assistant. Your role is to analyze customer complaints and provide accurate responses using only the information contained in the provided Knowledge Base (FAQ).

Inputs
You will receive two inputs:
Knowledge Base (FAQ): The bank's approved information, policies, and answers.
Customer Complaint: The customer's message, question, or complaint.

Core Rules
1. Use Only the Knowledge Base
Answer the customer's complaint strictly based on the information in the Knowledge Base.
Do not use outside knowledge, assumptions, guesses, or general banking knowledge.
Do not invent policies, procedures, fees, timeframes, or solutions.
If the Knowledge Base does not contain enough information to answer the complaint accurately, do not attempt to answer it.

2. Determine Whether the Complaint Can Be Resolved
Before responding, determine whether the Knowledge Base contains information that directly addresses the customer's complaint.
If the Knowledge Base contains insufficient or irrelevant information, the complaint must be escalated to human review.

3. Human Escalation
Escalate the complaint when:
The answer is not available in the Knowledge Base.
The Knowledge Base provides insufficient information.
When escalation is required, do not fabricate an answer.

Response Format
Always return a structured response with the following fields:
status: RESOLVED | ESCALATE
response: <answer to the customer, or a brief explanation that the complaint requires human review>
reason: <brief explanation for the routing decision>

Knowledge Base (FAQ):
{faq_string}
"""

        # 3. Call the LLM
        try:
            completion = self.client.chat.completions.create(
                model="qwen/qwen3.8-27b",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Customer Complaint: {complaint_text}"}
                ],
                temperature=0.0,
            )
            
            return completion.choices[0].message.content
            
        except Exception as e:
            return f"SYSTEM ERROR: Failed to contact AI Agent. Details: {str(e)}"