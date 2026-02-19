const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const logger = require('../utils/logger');

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

// Primary and fallback models
const MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];

/**
 * Call Gemini with automatic retry + model fallback on rate limits
 */
async function callWithRetry(prompt, maxRetries = 3) {
  for (const modelName of MODELS) {
    const model = genAI.getGenerativeModel({ model: modelName });
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`AI call: model=${modelName}, attempt=${attempt}`);
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
      } catch (error) {
        const is429 = error.message?.includes('429') || error.message?.includes('quota');
        if (is429 && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          logger.warn(`Rate limited (${modelName}), retrying in ${delay / 1000}s...`);
          await new Promise((r) => setTimeout(r, delay));
        } else if (is429) {
          logger.warn(`All retries exhausted for ${modelName}, trying next model...`);
          break; // Try next model
        } else {
          throw error; // Non-rate-limit error, throw immediately
        }
      }
    }
  }
  throw new Error('All AI models rate-limited. Please try again later or check your Gemini API quota at https://ai.google.dev/gemini-api/docs/rate-limits');
}

const TONE_DESCRIPTIONS = {
  professional: 'professional yet approachable, suited for LinkedIn',
  casual: 'conversational and friendly, but still business-appropriate',
  'thought-leadership': 'authoritative, visionary, and insightful like a top industry leader',
  storytelling: 'narrative-driven, engaging, using personal anecdotes and lessons learned',
};

const toneDesc = TONE_DESCRIPTIONS[config.content.tone] || TONE_DESCRIPTIONS.professional;

/**
 * Generate 5 post topics for LinkedIn
 */
async function generateTopics() {
  const categoriesHint =
    config.content.categories.length > 0
      ? `Focus on these areas: ${config.content.categories.join(', ')}.`
      : 'Choose trending and engaging professional topics.';

  const prompt = `You are a LinkedIn content strategist. Generate exactly 5 unique, compelling LinkedIn post topics that would drive engagement and showcase thought leadership.

${categoriesHint}

Requirements:
- Each topic should be specific, not generic
- Topics should be timely and relevant to current trends
- Mix between educational, inspirational, and discussion-provoking topics
- Each topic should be a concise 1-line title (max 10 words)

Return ONLY a JSON array of 5 strings, no markdown formatting, no code blocks. Example:
["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"]`;

  try {
    const text = await callWithRetry(prompt);
    // Strip markdown code blocks if present
    const cleaned = text.replace(/```(?:json)?\n?/g, '').trim();
    const topics = JSON.parse(cleaned);

    if (!Array.isArray(topics) || topics.length === 0) {
      throw new Error('Invalid topics format from AI');
    }

    logger.info(`Generated ${topics.length} topics`);
    return topics.slice(0, 5);
  } catch (error) {
    logger.error('Failed to generate topics:', error);
    throw error;
  }
}

/**
 * Generate 3 post ideas for a selected topic
 */
async function generateIdeas(topic) {
  const prompt = `You are a LinkedIn content creator. For the topic "${topic}", generate exactly 3 unique post ideas.

Each idea should include:
- A catchy hook (first line that grabs attention)
- A brief description of what the post will cover (2-3 sentences)

The tone should be ${toneDesc}.

Return ONLY a JSON array of 3 objects with "hook" and "description" keys, no markdown formatting, no code blocks. Example:
[{"hook": "Hook text here...", "description": "Description here..."}, ...]`;

  try {
    const text = await callWithRetry(prompt);
    const cleaned = text.replace(/```(?:json)?\n?/g, '').trim();
    const ideas = JSON.parse(cleaned);

    if (!Array.isArray(ideas) || ideas.length === 0) {
      throw new Error('Invalid ideas format from AI');
    }

    logger.info(`Generated ${ideas.length} ideas for topic: ${topic}`);
    return ideas.slice(0, 3);
  } catch (error) {
    logger.error('Failed to generate ideas:', error);
    throw error;
  }
}

/**
 * Generate a full LinkedIn post for a selected idea
 */
async function generatePost(idea) {
  const prompt = `You are an expert LinkedIn content writer. Create a full LinkedIn post based on this idea:

Hook: ${idea.hook}
Description: ${idea.description}

Requirements:
- Start with a powerful, scroll-stopping first line (the hook)
- Use short paragraphs (1-3 sentences each) for readability
- Include a personal insight or lesson learned
- End with a question or call-to-action to drive engagement
- Add 3-5 relevant hashtags at the end
- Total length: 150-300 words (optimal for LinkedIn engagement)
- Tone: ${toneDesc}
- Use line breaks generously for readability
- Include 1-2 relevant emojis per paragraph (don't overdo it)
- Do NOT use markdown formatting — plain text only

Return ONLY the post text, nothing else. No explanations, no labels.`;

  try {
    const post = await callWithRetry(prompt);

    logger.info(`Generated post (${post.split(/\s+/).length} words)`);
    return post;
  } catch (error) {
    logger.error('Failed to generate post:', error);
    throw error;
  }
}

/**
 * Revise a post based on user feedback
 */
async function revisePost(currentPost, feedback) {
  const prompt = `You are an expert LinkedIn content writer. Revise the following LinkedIn post based on the user's feedback.

Current Post:
---
${currentPost}
---

User Feedback: ${feedback}

Requirements:
- Apply the user's requested changes
- Maintain the same general structure and tone unless asked to change
- Keep length between 150-300 words
- Keep hashtags relevant
- Keep the tone ${toneDesc}
- Do NOT use markdown formatting — plain text only

Return ONLY the revised post text, nothing else.`;

  try {
    const revisedPost = await callWithRetry(prompt);

    logger.info('Post revised based on feedback');
    return revisedPost;
  } catch (error) {
    logger.error('Failed to revise post:', error);
    throw error;
  }
}

module.exports = {
  generateTopics,
  generateIdeas,
  generatePost,
  revisePost,
};
