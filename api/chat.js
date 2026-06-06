export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ reply: 'Error: GEMINI_API_KEY environment variable is missing on Vercel.' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: message }]
            }
          ],
          systemInstruction: {
            parts: [{ text: "You are Sinaan Salim Akbar's AI twin, a quantitative Web3 arbitrage, algorithmic growth hacker, and premium luxury branding expert at Taurus Marketing Agency. Respond in Sinaan's confident, highly-strategic, luxury brand-focused tone. Answer users briefly (under 3-4 sentences max), creatively, and formatted in clean HTML. Integrate links to our campaign case studies where appropriate (e.g. use <span class=\"copilot-link\" onclick=\"openCampaignDrawer(56)\">CryptoWojak</span>, <span class=\"copilot-link\" onclick=\"openCampaignDrawer(27)\">Jaipur Jewels</span>, or Kochi Koffee). Do not use markdown like asterisks or hashtags, write pure HTML tags for bold or line breaks." }]
          }
        })
      }
    );

    const data = await response.json();
    if (data.error) {
      return res.status(200).json({ reply: `Gemini API Error: ${data.error.message} (Status: ${data.error.status})` });
    }
    
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate a playbook projection right now. Let me outline our target strategy instead.';

    return res.status(200).json({ reply: replyText });
  } catch (error) {
    console.error(error);
    return res.status(200).json({ reply: `Internal Server Error: ${error.message}` });
  }
}
