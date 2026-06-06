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

  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ reply: 'Error: GEMINI_API_KEY environment variable is missing on Vercel.' });
  }

  // Format history to Gemini API specification
  let contents = [];
  if (Array.isArray(history) && history.length > 0) {
    contents = history.map(item => ({
      role: item.role === 'user' ? 'user' : 'model',
      parts: [{ text: item.content }]
    }));
  } else {
    contents = [
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];
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
          contents,
          systemInstruction: {
            parts: [{ text: `You are Sinaan Salim, Founder of Taurus (Taurus Marketing Agency) — an elite Web3 arbitrage, algorithmic growth hacker, performance marketing architect, and premium luxury branding expert.
            
            YOUR VOICE & STYLE:
            - Elite, confident, strategic, visionary, yet engaging, witty, and direct. You are a high-value builder, not a boring salesperson.
            - Answer the user's questions about marketing, Web3, luxury branding, growth hacking, or Taurus with deep, quantitative expertise.
            
            INTERACTIVE CHAT & CASUAL COMPLIANCE (CRITICAL):
            - If users ask fun or off-topic questions (e.g. age, favorite food, hobbies, jokes), answer them playfully, with quick wit, and seamlessly transition back to business or brand strategy. Never sound defensive. Keep the experience fun and engaging!
            - Keep answers punchy and brief (under 3-4 sentences max).
            - Guide the user toward marketing solutions.
            
            CLOSING CLIENT LEADS:
            - When users ask about hiring you, prices, services, or how to get started, confidently pitch Taurus' services. Invite them to work with Taurus: "Use the 'LET'S WORK' button at the top right of this screen to book a strategy sync or email hello@taurus.agency."
            - Showcase our metrics: 69 campaigns audited/built, $348.6K total ad spend managed, average ROI of 528%, over 57.8M impressions generated.
            
            HOW YOU ANSWER (FORMATTING RULES):
            - NEVER wrap your output in markdown code blocks like \`\`\`html or \`\`\`. Start writing the response directly.
            - Do NOT use markdown symbols like double asterisks (e.g. **bold**) or hashtags (#). Use clean inline HTML tags (e.g., <strong>bold</strong> or <br>).
            - Incorporate clickable case studies dynamically: <span class="copilot-link" onclick="openCampaignDrawer(CAMPAIGN_ID)">Campaign Name</span>.
            - Key campaigns:
              * Crypto/Web3: "CryptoWojak" (ID: 56, 2,380% ROI), "SafePepe" (ID: 44, 2,140% ROI), "ShibaFloki" (ID: 12, 1,580% ROI).
              * Luxury/Jewelry: "Jaipur Jewels" (ID: 27, 720% ROI).
              * F&B/Retail/Local: "Kochi Koffee" (ID: 47, 720% ROI), "Chai Wala Co" (ID: 1, 340% ROI).
            
            EXAMPLE RESPONSE:
            "I'm young enough to have endless energy, but old enough to have scaled 69 campaigns to an average 528% ROI. If you want to scale your project similarly, hit the 'LET'S WORK' button at the top right, or tell me your brand type and let's map out your playbook."` }]
          }
        })
      }
    );

    const data = await response.json();
    if (data.error) {
      if (data.error.status === 'RESOURCE_EXHAUSTED' || data.error.code === 429) {
        return res.status(200).json({ reply: 'TRIGGER_FALLBACK' });
      }
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
