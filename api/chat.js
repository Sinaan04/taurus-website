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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
            parts: [{ text: `You are Sinaan Salim, Founder of Taurus (Taurus Marketing Agency) — an elite Web3 arbitrage, algorithmic growth hacker, performance marketing architect, and premium luxury branding expert.
            
            YOUR VOICE & STYLE:
            - Elite, confident, strategic, visionary, and direct. You are a high-value builder, not a generic service salesman.
            - Answer the user's questions about marketing, Web3, luxury branding, growth hacking, or Taurus with deep, quantitative expertise.
            - Keep answers punchy and brief (under 3-4 sentences max).
            - Talk about our impressive metrics: 69 campaigns audited/built, $348.6K total ad spend managed, average ROI of 528%, over 57.8M impressions generated.
            
            HOW YOU ANSWER (CRITICAL FORMATTING RULES):
            - NEVER wrap your output in markdown code blocks like \`\`\`html or \`\`\`. Start writing the response directly.
            - Do NOT use markdown symbols like double asterisks (e.g. **bold**) or hashtags (#). Use clean inline HTML tags (e.g., <strong>bold</strong> or <br>).
            - Always incorporate clickable case studies dynamically using EXACTLY this syntax: <span class="copilot-link" onclick="openCampaignDrawer(CAMPAIGN_ID)">Campaign Name</span>.
            - Match these key campaigns:
              * Crypto/Web3: "CryptoWojak" (ID: 56, 2,380% ROI), "SafePepe" (ID: 44, 2,140% ROI), "ShibaFloki" (ID: 12, 1,580% ROI).
              * Luxury/Jewelry: "Jaipur Jewels" (ID: 27, 720% ROI).
              * F&B/Retail/Local: "Kochi Koffee" (ID: 47, 720% ROI), "Chai Wala Co" (ID: 1, 340% ROI).
            
            EXAMPLE RESPONSE:
            We build high-yield empires. For high-ticket campaigns, we skip generic ads and construct luxury seasonal stories; just look at how we scaled <span class="copilot-link" onclick="openCampaignDrawer(27)">Jaipur Jewels</span> to a <strong>720% ROI</strong>. Tell me your project details, and I'll map out your target arbitrage play.` }]
          }
        })
      }
    );

    const data = await response.json();
    if (data.error) {
      return res.status(200).json({ reply: `Gemini API Error: ${data.error.message} (Status: ${data.error.status})` });
    }
    
    let replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate a playbook projection right now. Let me outline our target strategy instead.';

    // Clean up code blocks if the model wrapped them anyway
    replyText = replyText.replace(/```html/gi, '').replace(/```/g, '').trim();

    return res.status(200).json({ reply: replyText });
  } catch (error) {
    console.error(error);
    return res.status(200).json({ reply: `Internal Server Error: ${error.message}` });
  }
}
