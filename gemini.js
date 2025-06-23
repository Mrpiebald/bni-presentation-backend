// This is an example of a serverless function (e.g., for Vercel, Netlify, or Google Cloud).
// The exact syntax might vary slightly based on the platform.

// This function will be your secure "middleman."

// IMPORTANT: Your actual API key is stored securely here, not on the front-end.
const GEMINI_API_KEY = "YOUR_GOOGLE_AI_API_KEY_GOES_HERE";

export default async function handler(req, res) {
  // Allow requests from any origin (or you can restrict it to your domain)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle pre-flight requests for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    // Call the Google AI API from the secure backend
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Google AI API Error:", errorText);
      throw new Error(`Google AI API failed with status: ${geminiResponse.status}`);
    }

    const data = await geminiResponse.json();

    // Extract the text and send it back to the front-end
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, no response was generated.";
    
    res.status(200).json({ text: responseText });

  } catch (error) {
    console.error('Error in backend function:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
}
