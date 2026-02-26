const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const logger = require('../utils/logger');

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

// Primary and fallback models
const MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];

// STRICT rule appended to every content-generation prompt
const NO_TEMPLATE_RULE = `

CRITICAL RULES — NEVER BREAK THESE:
- NEVER use placeholder text like [Your Name], [Your Company], [Company Name], [Industry], [X years], [Number], etc.
- NEVER use brackets [] for fill-in-the-blank templates anywhere in the output.
- ALL content must be complete, ready-to-post, and contain NO blanks or variables.
- Write as if you ARE the person posting. Use first person ("I", "we", "my") naturally.
- If you need a specific detail, invent a realistic, concrete example instead of using a placeholder.`;

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
          const delay = Math.pow(2, attempt) * 1000;
          logger.warn(`Rate limited (${modelName}), retrying in ${delay / 1000}s...`);
          await new Promise((r) => setTimeout(r, delay));
        } else if (is429) {
          logger.warn(`All retries exhausted for ${modelName}, trying next model...`);
          break;
        } else {
          throw error;
        }
      }
    }
  }
  throw new Error('All AI models rate-limited. Please try again later.');
}

const TONE_DESCRIPTIONS = {
  professional: 'professional yet approachable, suited for LinkedIn',
  casual: 'conversational and friendly, but still business-appropriate',
  'thought-leadership': 'authoritative, visionary, and insightful like a top industry leader',
  storytelling: 'narrative-driven, engaging, using personal anecdotes and lessons learned',
};

function getToneDesc(tone) {
  return TONE_DESCRIPTIONS[tone] || TONE_DESCRIPTIONS.professional;
}

/**
 * Generate 5 post topics from user's configured categories
 */
async function generateTopics(categories = [], isOrgPost = false) {
  const categoriesHint =
    categories.length > 0
      ? `Focus on these areas: ${categories.join(', ')}.`
      : 'Choose trending and engaging professional topics.';

  const voiceRule = isOrgPost
    ? `\n- These topics are for an ORGANIZATION / COMPANY page, NOT a personal profile\n- Topics must be about industry trends, data, company insights, market analysis, or thought leadership\n- Do NOT suggest topics about personal stories, personal journeys, or individual experiences\n- Avoid topics like "My experience with...", "From X to Y journey", "Lessons I learned"\n- Good examples: "How AI is reshaping supply chains in 2025", "5 enterprise cloud trends to watch"`
    : '';

  const prompt = `You are a LinkedIn content strategist. Generate exactly 5 unique, compelling LinkedIn post topics that would drive engagement and showcase thought leadership.

${categoriesHint}

Requirements:
- Each topic should be specific, not generic
- Topics should be timely and relevant to current trends
- Mix between educational, inspirational, and discussion-provoking topics
- Each topic should be a concise 1-line title (max 10 words)${voiceRule}
${NO_TEMPLATE_RULE}

Return ONLY a JSON array of 5 strings, no markdown formatting, no code blocks. Example:
["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"]`;

  try {
    const text = await callWithRetry(prompt);
    const cleaned = text.replace(/\`\`\`(?:json)?\n?/g, '').trim();
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
 * Generate 5 topics related to a specific keyword the user entered
 */
async function generateTopicsFromKeyword(keyword, categories = [], isOrgPost = false) {
  const contextHint =
    categories.length > 0
      ? `The user's general area of expertise includes: ${categories.join(', ')}. Use this as context.`
      : '';

  const voiceRule = isOrgPost
    ? `\n- These topics are for an ORGANIZATION / COMPANY page, NOT a personal profile\n- Topics must be about industry trends, data, company insights, or market analysis related to "${keyword}"\n- Do NOT suggest topics about personal stories, personal journeys, or individual experiences\n- Avoid topics like "My experience with...", "From X to Y journey", "Lessons I learned"\n- Focus on facts, research, and professional analysis`
    : '';

  const prompt = `You are a LinkedIn content strategist. The user wants to write a post about: "${keyword}"

Generate exactly 5 unique, specific LinkedIn post topics related to "${keyword}".
${contextHint}

Requirements:
- Each topic must be directly related to "${keyword}"
- Each topic should be specific and actionable, not vague
- Mix between educational, opinion-based, and ${isOrgPost ? 'industry analysis' : 'experience-sharing'} angles
- Each topic should be a concise 1-line title (max 10 words)${voiceRule}
${NO_TEMPLATE_RULE}

Return ONLY a JSON array of 5 strings, no markdown formatting, no code blocks. Example:
["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"]`;

  try {
    const text = await callWithRetry(prompt);
    const cleaned = text.replace(/\`\`\`(?:json)?\n?/g, '').trim();
    const topics = JSON.parse(cleaned);

    if (!Array.isArray(topics) || topics.length === 0) {
      throw new Error('Invalid topics format from AI');
    }

    logger.info(`Generated ${topics.length} topics for keyword: "${keyword}"`);
    return topics.slice(0, 5);
  } catch (error) {
    logger.error('Failed to generate topics from keyword:', error);
    throw error;
  }
}

/**
 * Generate 3 post ideas for a selected topic
 */
async function generateIdeas(topic, tone = 'professional', isOrgPost = false) {
  const toneDesc = getToneDesc(tone);
  const voiceRule = isOrgPost
    ? `\n- Write from an ORGANIZATION perspective (use "we", "our company", "our team")\n- Focus on industry insights, data, trends, and company achievements\n- Do NOT include personal stories, personal anecdotes, or first-person singular experiences\n- All content must be factual and professional`
    : '';

  const prompt = `You are a LinkedIn content creator. For the topic "${topic}", generate exactly 3 unique post ideas.

Each idea should include:
- A catchy hook (first line that grabs attention)
- A brief description of what the post will cover (2-3 sentences)

The tone should be ${toneDesc}.
${voiceRule}
${NO_TEMPLATE_RULE}

Return ONLY a JSON array of 3 objects with "hook" and "description" keys, no markdown formatting, no code blocks. Example:
[{"hook": "Hook text here...", "description": "Description here..."}, ...]`;

  try {
    const text = await callWithRetry(prompt);
    const cleaned = text.replace(/\`\`\`(?:json)?\n?/g, '').trim();
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
async function generatePost(idea, tone = 'professional', isOrgPost = false) {
  const toneDesc = getToneDesc(tone);

  const personalRules = `- Include a personal insight or lesson learned
- Write in first person singular ("I", "my")`;

  const orgRules = `- Write from an ORGANIZATION perspective — use "we", "our team", "our company" (NEVER "I" or "my")
- Base all claims on real industry facts, data, statistics, and trends
- NEVER fabricate personal stories, personal anecdotes, or fictional experiences
- Focus on company insights, industry analysis, research findings, and thought leadership
- You may reference company achievements, team efforts, or industry milestones`;

  const prompt = `You are an expert LinkedIn content writer. Create a full LinkedIn post based on this idea:

Hook: ${idea.hook}
Description: ${idea.description}

Requirements:
- Start with a powerful, scroll-stopping first line (the hook)
- Use short paragraphs (1-3 sentences each) for readability
${isOrgPost ? orgRules : personalRules}
- End with a question or call-to-action to drive engagement
- Add 3-5 relevant hashtags at the end
- Total length: 150-300 words (optimal for LinkedIn engagement)
- Tone: ${toneDesc}
- Use line breaks generously for readability
- Include 1-2 relevant emojis per paragraph (don't overdo it)
- Do NOT use markdown formatting — plain text only
${NO_TEMPLATE_RULE}

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
async function revisePost(currentPost, feedback, tone = 'professional', isOrgPost = false) {
  const toneDesc = getToneDesc(tone);
  const voiceRule = isOrgPost
    ? `\n- This is an ORGANIZATION post — use "we"/"our", NEVER "I"/"my"\n- Do NOT add personal stories or fictional experiences\n- Keep all content fact-based and professional`
    : '';

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
- Keep the tone ${toneDesc}${voiceRule}
- Do NOT use markdown formatting — plain text only
${NO_TEMPLATE_RULE}

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
  generateTopicsFromKeyword,
  generateIdeas,
  generatePost,
  revisePost,
};
