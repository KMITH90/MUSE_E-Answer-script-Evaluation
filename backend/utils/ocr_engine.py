import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

# 1. Configuration - Use an environment variable for safety
API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=API_KEY)

def evaluate_script(file_path, answer_key_text):
    """
    Handles the vision-based extraction and grading using Gemini 3 Flash.
    This replaces the old text-only logic that was failing.
    """
    try:
        # Use the specific model you requested
        model = genai.GenerativeModel('gemini-3-flash-preview')
        
        # Determine the file type
        mime_type = "application/pdf" if file_path.lower().endswith('.pdf') else "image/jpeg"
        
        # Load the file bytes (Critical: Groq couldn't do this, Gemini can)
        with open(file_path, "rb") as f:
            file_data = f.read()

        prompt = f"""
        You are an expert academic grader. 
        1. Perform OCR on the attached document to read the student's handwritten answers.
        2. Compare the student's answers against the following Answer Key:
           ---
           {answer_key_text}
           ---
        3. Assign marks (0-100) and provide specific feedback on where they can improve.
        
        RETURN ONLY A RAW JSON OBJECT:
        {{"marks": 85, "feedback": "Your explanation of the first law was excellent, but you missed the calculation in question 2."}}
        """

        # Generate content using both the file data and the text prompt
        response = model.generate_content([
            {"mime_type": mime_type, "data": file_data},
            prompt
        ])

        # Return the raw text (the app.py will handle the cleaning/parsing)
        return response.text

    except Exception as e:
        print(f"AI Engine Error: {str(e)}")
        # Fallback in case of API failure so the loop in app.py doesn't crash
        return json.dumps({"marks": 0, "feedback": f"Error during AI evaluation: {str(e)}"})