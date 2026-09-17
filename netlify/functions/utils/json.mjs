/**
 * Netlify Serverless Functions: Shared JSON Extraction Utility
 * 
 * Extracts and parses JSON from raw LLM responses or Markdown code blocks.
 */

/**
 * Safely parse JSON from raw LLM text, stripping markdown code fences if present.
 * @param {string} text - Raw model response text
 * @returns {object|null} Parsed JSON object or null if invalid
 */
export function extractJSON(text) {
  if (!text || typeof text !== 'string') return null;

  // 1. Direct JSON parse attempt
  try {
    return JSON.parse(text.trim());
  } catch {}

  // 2. Extract from markdown code fence (```json ... ``` or ``` ... ```)
  try {
    const stripped = text
      .replace(/^[\s\S]*?```(?:json|JSON)?\s*\n?/, '')
      .replace(/\n?\s*```[\s\S]*$/, '')
      .trim();
    if (stripped.startsWith('{') || stripped.startsWith('[')) {
      return JSON.parse(stripped);
    }
  } catch {}

  // 3. Fallback: Find outermost curly braces
  try {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    }
  } catch {}

  return null;
}
