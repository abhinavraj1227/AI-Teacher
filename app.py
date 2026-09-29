import os
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

api_key = os.getenv("GEMINI_API_KEY", "").strip()
client = genai.Client(api_key=api_key) if api_key else None

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/generate", methods=["POST"])
def generate():
    if not client or not api_key:
        return jsonify({"error": "GEMINI_API_KEY is not configured in .env"}), 500

    payload = request.get_json() or {}
    system_prompt = payload.get("system", "")
    user_prompt = payload.get("user", "")

    config = types.GenerateContentConfig(
        system_instruction=system_prompt if system_prompt else None,
        response_mime_type="application/json" if "JSON" in system_prompt else "text/plain",
        temperature=0.4
    )

    # List of models ordered by preference with automatic fallback
    models_to_try = [
        "gemini-3.6-flash",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash"
    ]

    last_error = None
    for model_name in models_to_try:
        try:
            print(f"[INFO] Attempting generation with {model_name}...")
            response = client.models.generate_content(
                model=model_name,
                contents=user_prompt,
                config=config
            )
            return jsonify({
                "content": [{"text": response.text}]
            }), 200
        except Exception as e:
            print(f"[WARN] {model_name} failed: {str(e)}")
            last_error = e
            continue

    print(f"[API ERROR] All models failed: {str(last_error)}")
    return jsonify({"error": str(last_error)}), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="127.0.0.1", port=port, debug=True, threaded=True)