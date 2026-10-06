
function stripHtmlTagsToPlainText(str) {
  if (!str) return '';
  return str
    .replace(/<\/?p[^>]*>/gi, '\n\n')
    .replace(/&lt;\/?p[^&]*&gt;/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&lt;br\s*\/?&gt;/gi, '\n')
    .replace(/<\/?mark[^>]*>/gi, '')
    .replace(/&lt;\/?mark[^&]*&gt;/gi, '')
    .replace(/<\/?b>/gi, '')
    .replace(/&lt;\/?b&gt;/gi, '')
    .replace(/<\/?strong>/gi, '')
    .replace(/&lt;\/?strong&gt;/gi, '')
    .replace(/<\/?span[^>]*>/gi, '')
    .replace(/&lt;\/?span[^&]*&gt;/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;[^&]*&gt;/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

﻿import { env } from '../../config/env.js';

const SYSTEM_PROMPT = `You are "AI News Editor & Art Director", an expert bilingual Senior News Editor and Broadsheet Layout Designer for a premier national newspaper.

CORE RESPONSIBILITIES:
1. NEWSPAPER WRITING & EDITING:
   - If user asks in Hindi or asks for Hindi: Write in authentic, formal, publication-ready Devanagari Hindi (दैनिक जागरण / हिन्दुस्तान ब्रॉडशीट शैली).
   - If user asks in English or asks for English: Write in sharp, punchy, editorial English (The Hindu / Times of India style).
   - When asked to proofread / find mistakes: List the specific errors found (spelling, grammar, Devanagari matras, awkward phrasing) and provide the clean corrected version.

2. VISUAL STYLING & CLEAN TEXT FORMATTING:
   - CRITICAL REQUIREMENT: DO NOT use <p>, </p>, <mark>, <div>, or any HTML tags in content!
   - Write pure authentic Hindi Devanagari text.
   - Separate paragraphs cleanly using standard double newlines (\n\n) like a professional newspaper wire copy / word processor.

3. SMART IMAGE GENERATION & PLACEMENT:
   - For every news story, generate a photorealistic English prompt for an editorial photo.
   - Construct an AI image URL using this pattern:
     https://image.pollinations.ai/prompt/{URL_ENCODED_ENGLISH_PHOTO_PROMPT}?width=800&height=500&nologo=true
     (Example: https://image.pollinations.ai/prompt/photorealistic%20modern%20metro%20train%20station%20platform%20passengers?width=800&height=500&nologo=true)
   - Set optimal image alignment: "Right", "Left", or "Center".
   - Set vertical placement: "top" (photo on top), "middle" (text wraps around photo), or "bottom".

4. CANVAS ACTION DETERMINATION:
   - If the user says "next me slot banao", "naya slot add karo", "agla slot", or wants to add a new story without replacing the current one: Set "actionType": "CREATE_NEW_SLOT".
   - Otherwise (updating existing slot, rewriting, resizing, modifying): Set "actionType": "UPDATE_SLOT".

5. WORD COUNT & IN-DEPTH EDITORIAL JOURNALISM:
   - When the user asks for a specific word count (e.g., "1000 words", "1200 words", "800 words", "विस्तृत समाचार", "बड़ा लेख", "deep analysis"):
     * YOU MUST FULFILL THE REQUEST WITH A FULL-LENGTH, COMPREHENSIVE, MULTI-PARAGRAPH BROADSHEET STORY OF AT LEAST THAT WORD COUNT!
     * NEVER summarize or cut short. Write comprehensive background, multi-stakeholder quotes, critical data, timelines, and implications.
     * Organize the story into 8 to 15 detailed paragraphs (<p>...</p>) with <b>bold</b> key facts and highlighted quotes (<mark style="background-color:#fef08a;padding:1px 4px;font-weight:700;border-radius:3px;">...</mark>).
     * ABSOLUTELY MANDATORY: THE ENTIRE 1000-1200 WORD STORY MUST BE PLACED DIRECTLY INSIDE THE JSON "content" PROPERTY!
     * DO NOT paste the 1000-word story in your preliminary conversational chat message. Keep your conversational reply to just 1 or 2 lines (e.g., "मैंने 1000+ शब्दों का विस्तृत समाचार तैयार किया है। नीचे स्लॉट में अप्लाई करें।"). This preserves all output token bandwidth for the JSON story!

6. DYNAMIC SLOT GEOMETRY & AUTO-HEIGHT RECOMMENDATION:
   - Recommend "columnsCount": 1 (for stories <200 words), 2 (for 300-700 words), or 3 (for long stories 800-1200+ words).
   - DYNAMICALLY CALCULATE "recommendedHeight" so the slot automatically scales to fit the exact length of the story:
     * Short news (~100-250 words): recommendedHeight = 250 to 320px
     * Medium news (~300-600 words): recommendedHeight = 350 to 550px
     * Long feature (~700-1000 words): recommendedHeight = 700 to 1050px
     * Deep investigative (~1000-1400+ words): recommendedHeight = 1100 to 1600px
   - The slot on the canvas will automatically expand or shrink based on your "recommendedHeight"!

7. STRUCTURED JSON OUTPUT:
At the very end of your response, output a single JSON block formatted EXACTLY like this:
\`\`\`json
{
  "hasNewsContent": true,
  "actionType": "UPDATE_SLOT",
  "categoryBadge": "राष्ट्रीय",
  "headline": "मुख्य समाचार शीर्षक",
  "subHeadline": "विस्तृत उप-शीर्षक",
  "content": "<p>पहला विस्तृत पैराग्राफ <b>मुख्य बिंदु</b>...</p><p>दूसरा विस्तृत पैराग्राफ <b>विश्लेषण</b>...</p><p>तीसरा पैराग्राफ...</p><p>चौथा पैराग्राफ...</p>",
  "imageUrl": "https://image.pollinations.ai/prompt/photorealistic%20news%20scene?width=800&height=500&nologo=true",
  "imageAlignment": "Right",
  "imageVertAlign": "top",
  "imageWidth": 180,
  "imageHeight": 140,
  "columnsCount": 3,
  "recommendedHeight": 1100,
  "language": "hi"
}
\`\`\`
If the conversation is purely casual chat with no story generated, set "hasNewsContent": false.
`;

export async function processAiEditorPrompt({ prompt, activeSlot = null, history = [], customApiKey = '' }) {
  const apiKey = (customApiKey || env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '').trim();

  if (!apiKey) {
    throw new Error('Gemini API Key missing. Please provide a valid Gemini API key.');
  }

  let contextSnippet = '';
  if (activeSlot && (activeSlot.headline || activeSlot.summary)) {
    contextSnippet = `\n[CURRENT SELECTED CANVAS SLOT CONTEXT:
Slot Number: #${activeSlot.slotNumber || 1}
Headline: "${activeSlot.headline || 'None'}"
SubHeadline: "${activeSlot.subHeadline || 'None'}"
Category: "${activeSlot.categoryBadge || 'None'}"
Content/Summary: "${activeSlot.summary || 'None'}"
Columns: ${activeSlot.columnsCount || 1}
Width: ${activeSlot.width || 400}px, Height: ${activeSlot.height || 250}px
Image: "${activeSlot.imageUrl || 'None'}"
Image Alignment: "${activeSlot.imageAlignment || 'Center'}"
]\n`;
  }

  const contents = [];

  if (Array.isArray(history) && history.length > 0) {
    for (const msg of history.slice(-6)) {
      contents.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      });
    }
  }

  contents.push({
    role: 'user',
    parts: [{ text: `${contextSnippet}${prompt}` }]
  });

  const modelsToTry = [
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite',
    'gemini-flash-lite-latest',
    'gemma-4-26b-a4b-it'
  ];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `Gemini API Error (${response.status})`);
      }

      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!rawText) {
        throw new Error('Empty response received from Gemini.');
      }

            let parsedNews = null;
      let rawJsonString = '';
      const closedJsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (closedJsonMatch && closedJsonMatch[1]) {
        rawJsonString = closedJsonMatch[1].trim();
      } else {
        const unclosedMatch = rawText.match(/```(?:json)?\s*([\s\S]*)/);
        if (unclosedMatch && unclosedMatch[1]) {
          rawJsonString = unclosedMatch[1].trim();
          if (!rawJsonString.endsWith('}')) {
            rawJsonString += '\n}';
          }
        }
      }

      if (rawJsonString) {
        try {
          const parsed = JSON.parse(rawJsonString);
          if (parsed && parsed.hasNewsContent) {
            parsedNews = {
              actionType: parsed.actionType || 'UPDATE_SLOT',
              categoryBadge: parsed.categoryBadge || '',
              headline: parsed.headline || '',
              subHeadline: parsed.subHeadline || '',
              content: stripHtmlTagsToPlainText(parsed.content || ''),
              imageUrl: parsed.imageUrl || '',
              imageAlignment: parsed.imageAlignment || 'Right',
              imageVertAlign: parsed.imageVertAlign || 'top',
              imageWidth: parsed.imageWidth || 180,
              imageHeight: parsed.imageHeight || 140,
              columnsCount: parsed.columnsCount || 2,
              recommendedHeight: parsed.recommendedHeight || null,
              language: parsed.language || 'hi'
            };
          }
        } catch (e) {
          try {
            const sanitized = rawJsonString.replace(/([\r\n]+)/g, ' ');
            const parsed = JSON.parse(sanitized);
            if (parsed && parsed.hasNewsContent) {
              parsedNews = {
                actionType: parsed.actionType || 'UPDATE_SLOT',
                categoryBadge: parsed.categoryBadge || '',
                headline: parsed.headline || '',
                subHeadline: parsed.subHeadline || '',
                content: stripHtmlTagsToPlainText(parsed.content || ''),
                imageUrl: parsed.imageUrl || '',
                imageAlignment: parsed.imageAlignment || 'Right',
                imageVertAlign: parsed.imageVertAlign || 'top',
                imageWidth: parsed.imageWidth || 180,
                imageHeight: parsed.imageHeight || 140,
                columnsCount: parsed.columnsCount || 2,
                recommendedHeight: parsed.recommendedHeight || null,
                language: parsed.language || 'hi'
              };
            }
          } catch {}
        }
      }

      const cleanMessage = rawText.replace(/```(?:json)?[\s\S]*?(?:```|$)/g, '').trim();

      // CRITICAL FALLBACK FOR LONG-FORM JOURNALISM:
      // If AI outputted the extensive 1000-word article in the conversational message
      // and only a tiny snippet in parsedNews.content, seamlessly merge the full story!
      if (parsedNews) {
        const contentWordCount = (parsedNews.content || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
        const cleanWordCount = cleanMessage.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;

        if (cleanWordCount > contentWordCount + 60 && cleanWordCount > 200) {
          const formattedStory = cleanMessage.includes('<p>')
            ? cleanMessage
            : cleanMessage.split(/\n\n+/).map(p => '<p>' + p.trim() + '</p>').join('');
          parsedNews.content = stripHtmlTagsToPlainText(formattedStory);
          console.log('[AI Agent] Merged full ' + cleanWordCount + '-word story from reply into parsedNews.content!');
        }
      }

      return {
        reply: cleanMessage || rawText,
        fullText: rawText,
        parsedNews,
        modelUsed: model
      };
    } catch (err) {
      lastError = err;
      console.warn(`Model ${model} failed:`, err.message);
    }
  }

  throw lastError || new Error('Failed to generate response from Gemini AI.');
}
