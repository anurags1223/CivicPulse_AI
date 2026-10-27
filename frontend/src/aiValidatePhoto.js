/**
 * AI Photo Validator — uses Gemini Vision API if VITE_GEMINI_API_KEY is set,
 * falls back to filename + category keyword heuristic.
 */
import { imageKeywords, categories } from './civic';

const CIVIC_PROMPT = `Look at this image. Is it showing a civic / municipal infrastructure problem such as a pothole, damaged road, broken streetlight, garbage dump, flooding, sewage overflow, broken footpath, or water pipe leak?
Reply with a JSON object exactly like this:
{"isCivic":true,"category":"roads","confidence":"high","description":"Large pothole on a road surface"}
Categories: roads, sanitation, lighting, drainage, water, other
Confidence: high, medium, low
If it is NOT a civic issue, set isCivic to false and use category "other".`;

export async function aiValidatePhoto(dataUrl, filename='') {
  // 1. Try Gemini Vision API
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (apiKey && dataUrl && dataUrl.startsWith('data:image')) {
    try {
      const base64 = dataUrl.split(',')[1];
      const mime = dataUrl.split(';')[0].split(':')[1];
      const body = {
        contents: [{
          parts: [
            { text: CIVIC_PROMPT },
            { inline_data: { mime_type: mime, data: base64 } }
          ]
        }],
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 200 }
      };
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      );
      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const parsed = JSON.parse(text);
        return { ...parsed, source: 'gemini' };
      }
    } catch (e) {
      console.warn('Gemini Vision failed, falling back to heuristic:', e.message);
    }
  }

  // 2. Heuristic fallback — check filename and description text
  const haystack = filename.toLowerCase();
  for (const [key, words] of Object.entries(imageKeywords)) {
    if (key === 'other') continue;
    if (words.some(w => haystack.includes(w))) {
      return { isCivic: true, category: key, confidence: 'low', description: categories[key].label, source: 'heuristic' };
    }
  }

  // 3. No signal — return uncertain (allow upload but warn)
  return { isCivic: null, category: 'other', confidence: 'low', description: 'Could not automatically verify civic content', source: 'heuristic' };
}
