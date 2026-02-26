/**
 * Prompt Enhancer — NO external AI calls, zero credit usage.
 *
 * Strategy:
 *  - For GENERATION: pass the user's prompt (Arabic or English) directly to FAL.
 *    flux/schnell is multilingual. We append English quality suffixes so the
 *    model understands the desired photographic style without changing the subject.
 *  - For EDITING: prepend a preservation instruction so the model keeps the
 *    subject's facial/product features and only applies the requested change.
 */

const QUALITY_SUFFIX =
  ", photorealistic, ultra-detailed, sharp focus, cinematic lighting, professional photography, 8k resolution, no text, no watermark"

const PRESERVE_PREFIX =
  "Preserve all facial features, skin tone, body proportions, identity, and original background exactly. Apply only the following change: "

const NO_CHANGE_PROMPT =
  "Enhance image quality and sharpness while preserving all original features, facial identity, scene, and background exactly as they are. No other modifications."

const NO_CHANGE_PATTERNS = [
  /من غير ما تغير/i,
  /بدون ما تغير/i,
  /ما تغيرش/i,
  /متغيرش/i,
  /without chang/i,
  /don't change/i,
  /keep everything/i,
  /no change/i,
]

/**
 * For image GENERATION via fal-ai/flux/schnell.
 * Appends quality suffixes — does NOT call any AI API.
 */
export async function processPromptForImageGeneration(userPrompt: string): Promise<string> {
  return `${userPrompt.trim()}${QUALITY_SUFFIX}`
}

/**
 * For image EDITING via fal-ai/flux-2/turbo/edit.
 * Prepends a preservation instruction — does NOT call any AI API.
 */
export async function processPromptForImageEditing(userPrompt: string): Promise<string> {
  const wantsNoChange = NO_CHANGE_PATTERNS.some((p) => p.test(userPrompt))
  if (wantsNoChange) return NO_CHANGE_PROMPT
  return `${PRESERVE_PREFIX}${userPrompt.trim()}`
}

/** Backwards compatibility */
export async function translateToEnglish(text: string): Promise<string> {
  return text
}
