import re

import joblib
import numpy as np


class ComplaintClassifier:
    def __init__(self, model_path="models/calibrated_svc_model.pkl", vec_path="models/tfidf_vectorizer.pkl"):
        print("Loading ML models into memory...")
        self.model = joblib.load(model_path)
        self.vectorizer = joblib.load(vec_path)


    def clean_text(self, text):
        text = str(text).lower()
        # The CFPB dataset heavily redacts personal info with 'xxxx'
        text = re.sub(r'x{2,}', ' ', text) 
        # Replace non-alphabet characters with a SPACE to avoid merging words
        text = re.sub(r'[^a-z\s]', ' ', text) 
        # Remove extra multiple spaces and strip leading/trailing spaces
        text = re.sub(r'\s+', ' ', text).strip()
        return text


    def get_routing_decision(self, prob_array, threshold=0.70):
        max_prob = np.max(prob_array)
        best_index = np.argmax(prob_array)
        
        predicted_class = self.model.classes_[best_index]
        
        if max_prob >= threshold:
            return predicted_class, max_prob
        else:
            return "Other Problem", max_prob


    def classify(self, raw_text, threshold=0.60):
        """The main pipeline function"""

        cleaned = self.clean_text(raw_text)
        
        #wrap 'cleaned' in a list because transform expects an list of strings
        vectorized = self.vectorizer.transform([cleaned])
        
        probs = self.model.predict_proba(vectorized)[0]
        
        decision, confidence = self.get_routing_decision(probs, threshold)
        
        return decision, confidence


#test run
if __name__ == "__main__":
    
    classifier = ComplaintClassifier(
        model_path="../models/calibrated_svc_model.pkl",
        vec_path="../models/tfidf_vectorizer.pkl"
    )
    
    test_complaint = "I have been charged a late fee on my visa but I paid it on time!"
    decision, confidence = classifier.classify(test_complaint)
    
    print(f"\nComplaint: {test_complaint}")
    print(f"Routed to: {decision} (Confidence: {confidence*100:.2f}%)")