// This is the corrected serverless function for Vercel.
// It now correctly uses the Environment Variable for the API key.

export default async function handler(req, res) {
  // Allow requests from any origin for simplicity. 
  // For production, you can restrict this to your domain:
  // res.setHeader('Access-Control-Allow-Origin', 'https://your-domain.com');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle pre-flight "OPTIONS" requests sent by browsers
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests for the actual API call
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Use the secure Environment Variable from Vercel
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    console.error("Missing GEMINI_API_KEY environment variable.");
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'A prompt is required in the request body.' });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    // Call the Google AI API from our secure backend
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
    
    // Send the successful response
    res.status(200).json({ text: responseText });

  } catch (error) {
    console.error('Error in backend function:', error.message);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
}
