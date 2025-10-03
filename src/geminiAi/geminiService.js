import { GoogleGenerativeAI } from "@google/generative-ai";

class GeminiService {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  
  async getEvalutionPoint(practicalName) {
    const prompt = `
  You are an expert evaluator. A practical exam is scored out of 100 points.
  For the practical assignment named "${practicalName}", please generate exactly 5 evaluation criteria.
  Each criterion must be assigned exactly 20 points so that the total sums to 100.
  Each evaluation label should be a short phrase containing 3 to 4 words.
  Return the result as a single line of text in the following format:
  "Label1:20,Label2:20,Label3:20,Label4:20,Label5:20"
  Replace the labels with appropriate short phrases that capture key evaluation aspects for the practical exam.
  Output only the comma-separated criteria with their points, with no additional text.
    `.trim();
  
    try {
      const result = await this.model.generateContent(prompt, {
        maxOutputTokens: 2048,
      });
      const rawText = result.response.text();
      return rawText;
    } catch (error) {
      console.error("Error generating evaluation points:", error);
      throw error;
    }
  }
  

  // Method to generate the raw JSON string from the Gemini API
  async getRawJSON(practicalName, numberOfQuestions = 5) {
    // Ensure that no more than 5 questions are generated
    const numQuestions = Math.min(numberOfQuestions, 5);
    const prompt = `Generate ${numQuestions} multiple-choice questions in JSON format for a practical evaluation on "${practicalName}". Each question must follow this exact structure:

{
  "$id": "unique identifier",
  "question": "Question in English followed by its Marathi translation in parentheses",
  "options": [
    "Option 1 (translation)",
    "Option 2 (translation)",
    "Option 3 (translation)",
    "Option 4 (translation)"
  ],
  "correctAnswer": "A", // Option letter: A, B, C, or D
  "response": null
}

Ensure that:
- Each question's "options" array contains exactly 4 options.
- The "correctAnswer" is one of the letters A, B, C, or D.
- The output is valid JSON and does not include any additional keys.`;

    try {
      // Increase token limit for a richer response
      const result = await this.model.generateContent(prompt, {
        maxOutputTokens: 2048,
      });
      const rawText = result.response.text();
      return rawText;
    } catch (error) {
      console.error("Error generating content from Gemini:", error);
      throw error;
    }
  }

  // Method to decode the JSON response text into an object
  decodeJSONResponse(rawText) {
    let jsonText = rawText.trim();

    // Check for markdown code block markers for JSON (```json ... ```)
    const regex = /```json\s*([\s\S]*?)\s*```/;
    const match = jsonText.match(regex);
    if (match && match[1]) {
      jsonText = match[1];
    }

    try {
      const parsedObject = JSON.parse(jsonText);
      return parsedObject;
    } catch (error) {
      console.error("Error parsing JSON:", error);
      throw new Error("Failed to parse JSON response from Gemini.");
    }
  }

  // Combined method that returns the parsed JSON object
  async getJSONObject(practicalName, numberOfQuestions) {
    const rawJSON = await this.getRawJSON(practicalName, numberOfQuestions);
    return this.decodeJSONResponse(rawJSON);
  }
}

const geminiService = new GeminiService(import.meta.env.VITE_GEMINI_API_KEY);

export default geminiService;
