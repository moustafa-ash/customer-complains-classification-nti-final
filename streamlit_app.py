import json

import streamlit as st
from dotenv import load_dotenv

from app.classifier import ComplaintClassifier
from app.router import AgentRouter

load_dotenv()

st.title("🏦 AI Bank Support Router")
st.markdown("Intelligent customer complaint routing powered by SVM and Llama 3.")

# 1. Load your models into cache
@st.cache_resource
def initialize_system():
    clf = ComplaintClassifier(
        model_path="models/calibrated_svc_model.pkl", 
        vec_path="models/tfidf_vectorizer.pkl"
    )
    rtr = AgentRouter(faq_path="faq/knowledge_base.json")
    return clf, rtr

classifier, router = initialize_system()

with st.sidebar:
    st.header("⚙️ System Diagnostics")
    st.markdown("This panel shows what the AI Router is doing under the hood.")
    
    # We will update this dynamically when the user sends a message
    diagnostics_placeholder = st.empty()

# 2. Set up session state to remember chat history
if "messages" not in st.session_state:
    st.session_state.messages = []

# 3. Display previous chat messages
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

# 4. Chat input logic
if prompt := st.chat_input("How can we help you today?"):
    # Display user message
    with st.chat_message("user"):
        st.markdown(prompt)
    st.session_state.messages.append({"role": "user", "content": prompt})

    # Process through your AI pipeline
    with st.chat_message("assistant"):
        decision, confidence = classifier.classify(prompt)

        # Update the sidebar dynamically
        with diagnostics_placeholder.container():
            st.subheader("1. ML Classifier")
            st.info(f"**Predicted Category:** `{decision}`\n\n**Confidence:** `{confidence*100:.2f}%`")
            
            st.subheader("2. Extracted Knowledge Base")
            if decision == "Other Problem":
                st.warning("No FAQ loaded. Escaping to Human Escalation.")
            else:
                # Fetch the specific FAQ to show the user what the LLM is reading
                faq_data = router.knowledge_base.get(decision, {})
                st.json(faq_data)
        
        # Display routing metrics in the UI
        st.caption(f"🧠 **Routing Logic:** Routed to `{decision}` *(Confidence: {confidence*100:.2f}%)*")
        
        # Get the LLM response
        response = router.route_to_agent(decision, prompt)
        
        # Format and display the output
        try:
            # Try to parse as JSON for clean UI display
            response_data = json.loads(response) #type: ignore
            st.markdown(f"**Status:** {response_data['status']}")
            st.markdown(f"**Response:** {response_data['response']}")
        except json.JSONDecodeError:
            # Fallback for plain text (like the "Other Problem" escalation)
            st.markdown(response)

    st.session_state.messages.append({"role": "assistant", "content": response})