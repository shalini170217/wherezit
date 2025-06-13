const GEMINI_API_KEY = 'AIzaSyBz977S9fT0vDsrTId75UIU4nF2J_-sCAg'; // 🔑 Your Gemini API Key here

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  parts: GeminiPart[];
}

interface GeminiCandidate {
  content: GeminiContent;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

export const queryGemini = async (userQuery: string): Promise<string> => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userQuery }] }],
        }),
      }
    );

    const data: GeminiResponse = await response.json();

    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts[0].text;
    } else {
      return '❗ No response from Gemini';
    }
  } catch (error) {
    console.error('❗ Gemini API Error:', error);
    return '❗ Error connecting to Gemini API';
  }
};
