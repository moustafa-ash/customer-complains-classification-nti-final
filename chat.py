from app.classifier import ComplaintClassifier


def main():
    print("Initializing Customer Support System...")

    classifier = ComplaintClassifier(
        model_path="models/calibrated_svc_model.pkl",
        vec_path="models/tfidf_vectorizer.pkl",
    )

    print("\n" + "=" * 50)
    print("Welcome to the AI Support Router.")
    print("Type 'exit' to end the session.")
    print("=" * 50 + "\n")

    while True:
        user_text = input("Customer: ")
        if user_text.lower() in ["exit", "quit"]:
            print("Thanks for using our system!")
            break
        decision, confidence = classifier.classify(user_text)

        print(f"\nComplaint: {user_text}")
        print(f"Routed to: {decision} (Confidence: {confidence * 100:.2f}%)")


if __name__ == "__main__":
    main()
