import { GoogleGenAI,  } from "@google/genai";

class GeminiService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error("API key is required for GeminiService");
    }

    this.ai = new GoogleGenAI({ apiKey });
    this.primaryModel = "gemini-2.5-flash";
    this.fallbackModel = "gemini-2.0-flash"; // Fallback model
    this.maxRetries = 3;
    this.retryDelay = 2000; // 2 seconds
  }

  /**
   * Sleep utility for retry delays
   * @private
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate content with retry logic and fallback model
   * @private
   */
  async _generateContent(prompt, retryCount = 0) {
    const currentModel =
      retryCount >= 2 ? this.fallbackModel : this.primaryModel;

    try {
      const result = await this.ai.models.generateContent({
        model: currentModel,
        contents: prompt,
      });

      if (retryCount > 0) {
        console.log(
          `✓ Success after ${retryCount} retries using ${currentModel}`
        );
      }

      return result.text;
    } catch (error) {
      console.error(
        `Attempt ${retryCount + 1} failed with ${currentModel}:`,
        error.message
      );

      // Check if it's a 503 overload error
      const isOverloaded =
        error.message?.includes("overloaded") ||
        error.message?.includes("503") ||
        error.error?.code === 503;

      // Retry if overloaded and haven't exceeded max retries
      if (isOverloaded && retryCount < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff
        console.log(
          `⏳ Retrying in ${delay / 1000}s... (Attempt ${retryCount + 2}/${
            this.maxRetries + 1
          })`
        );
        await this._sleep(delay);
        return this._generateContent(prompt, retryCount + 1);
      }

      // If all retries failed or it's a different error
      throw new Error(
        retryCount >= this.maxRetries
          ? `Failed after ${
              this.maxRetries + 1
            } attempts. Gemini servers are overloaded. Please try again later.`
          : `Failed to generate content: ${error.message}`
      );
    }
  }

  /**
   * Clean and parse JSON from API response
   * @private
   */
  _parseJSONResponse(rawText) {
    let jsonText = rawText.trim();

    // Remove markdown code block markers if present
    const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch?.[1]) {
      jsonText = jsonMatch[1];
    }

    try {
      return JSON.parse(jsonText);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      throw new Error("Failed to parse JSON response from Gemini.");
    }
  }

  /**
   * Generate evaluation criteria for a practical exam
   * @param {string} practicalName - Name of the practical
   * @returns {Promise<string>} Comma-separated evaluation criteria
   */
  async getEvaluationPoints(practicalName) {
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

    const rawText = await this._generateContent(prompt);
    console.log("Evaluation points:", rawText);
    return rawText;
  }

  /**
   * Generate multiple-choice questions for practical evaluation
   * @param {string} practicalName - Name of the practical
   * @param {number} numberOfQuestions - Number of questions (max 5)
   * @returns {Promise<Array>} Array of question objects
   */
  async getQuestions(practicalName, numberOfQuestions = 5) {
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
  "correctAnswer": "A",
  "response": null
}

Ensure that:
- Each question's "options" array contains exactly 4 options.
- The "correctAnswer" is one of the letters A, B, C, or D.
- The output is a valid JSON array containing ${numQuestions} questions.
- Do not include any additional keys or text outside the JSON.`;

    const rawText = await this._generateContent(prompt);
    return this._parseJSONResponse(rawText);
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use getQuestions instead
   */
  async getJSONObject(practicalName, numberOfQuestions) {
    console.warn("getJSONObject is deprecated. Use getQuestions instead.");
    return this.getQuestions(practicalName, numberOfQuestions);
  }

  /**
   * Update retry configuration
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} retryDelay - Initial delay in milliseconds
   */
  setRetryConfig(maxRetries, retryDelay) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }
}

// Initialize service with environment variable
const geminiServiceV2 = new GeminiService(import.meta.env.VITE_GEMINI_API_KEY);

export default geminiServiceV2;
