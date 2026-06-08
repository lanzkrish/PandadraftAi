const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const logger = require('../utils/logger');

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

// Primary and fallback models
const MODELS = ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];

// STRICT rule appended to every content-generation prompt
const NO_TEMPLATE_RULE = `

CRITICAL RULES — NEVER BREAK THESE:
- NEVER use placeholder text like [Your Name], [Your Company], [Company Name], [Industry], [X years], [Number], etc.
- NEVER use brackets [] for fill-in-the-blank templates anywhere in the output.
- ALL content must be complete, ready-to-post, and contain NO blanks or variables.
- Write as if you ARE the person posting. Use first person ("I", "we", "my") naturally.
- If you need a specific detail, invent a realistic, concrete example instead of using a placeholder.`;

// ── LinkedIn Algorithm Optimization Rules ──────────────────
// These rules are injected into every post-generation prompt

const LINKEDIN_ALGORITHM_RULES = `
## LINKEDIN ALGORITHM CONTEXT
LinkedIn tests every post with a small audience during the first 30–60 minutes.
Posts that get early engagement (likes, comments, reposts) receive exponentially larger distribution.
Your content MUST therefore:
• Be highly relatable to the target audience
• Encourage comments (not just likes)
• Be scannable and easy to read on mobile
• Avoid sounding automated or AI-generated
• Create curiosity and tension in the first 2 lines
• NEVER sound like a generic motivational page`;

const MANDATORY_POST_STRUCTURE = `
## MANDATORY POST STRUCTURE
Follow this structure exactly:

1. Hook (1–2 lines)
   - Must stop the scroll
   - Use one of: curiosity gap, contrarian opinion, surprising mistake, bold claim, or a relatable frustration
   - Examples of great hooks:
     "Most founders are posting on LinkedIn wrong."
     "I spent 6 months building a product nobody wanted."
     "Unpopular opinion: Hustle culture is killing startups."

2. Context (2–3 short lines)
   - Explain the situation, experience, or observation
   - Keep it specific, not abstract

3. Value Section (3–5 bullet points)
   - Practical lessons, frameworks, or actionable tips
   - Each bullet must be short, clear, and standalone
   - Use "→" or "•" for bullets, NOT numbered lists

4. Personal Insight (1–2 lines)
   - A reflective, meaningful, or slightly vulnerable takeaway
   - This creates emotional resonance

5. Engagement CTA (1 line)
   - Ask ONE specific discussion question
   - NOT generic ("What do you think?") — make it specific to the topic
   - Good examples: "What's one mistake you made while hiring early?" / "Agree or disagree: MVPs should be ugly?"`;

const POST_FORMAT_RULES = `
## FORMAT RULES (CRITICAL FOR ALGORITHM)
• 10–14 lines total (including blank lines for spacing)
• One sentence per line — NEVER stack sentences on the same line
• Short paragraphs only (1–2 sentences max per paragraph)
• Add a blank line between each section for readability
• No dense text blocks — LinkedIn penalizes walls of text
• No external links (links kill reach by 40-50%)
• Maximum 3–5 niche hashtags at the very end
• Use bullet points with "→" or "•" in the value section
• Use natural, conversational human tone throughout
• NEVER use marketing buzzwords (synergy, leverage, optimize, etc.)
• NEVER use AI-sounding phrases (in today's fast-paced world, it's important to note, etc.)
• AVOID overusing emojis — maximum 2-3 total in the entire post, placed naturally
• Do NOT start the post with an emoji
• Do NOT use markdown formatting — plain text only`;

const AUTHENTICITY_RULES = `
## AUTHENTICITY RULES
Posts MUST sound like they are written by a real professional sharing genuine insights.
• Write in first person with natural, slightly imperfect language
• Include specific details (numbers, timeframes, real situations)
• Show vulnerability — mention mistakes, doubts, or surprises
• Avoid corporate-speak and polished marketing language
• Sound like a message to a friend, not a press release
• NEVER start with "I'm excited to share" or "Thrilled to announce"`;

// ── Tone Descriptions ─────────────────────────────────────

const TONE_DESCRIPTIONS = {
  professional: 'professional yet approachable — like a respected colleague sharing advice over coffee. Authoritative but warm, using clear language without jargon. This tone performs well for frameworks, tips, and industry analysis posts.',
  casual: 'conversational and friendly — like texting a smart friend about work. Uses informal language, contractions, and personality. This tone drives the most comments because it feels approachable and invites responses.',
  'thought-leadership': 'bold, authoritative, and visionary — like a keynote speaker sharing an original perspective. Uses strong opinions, data-backed claims, and forward-looking statements. This tone generates controversy and discussion, which boosts reach.',
  storytelling: 'narrative-driven and engaging — using personal anecdotes, specific moments, and emotional beats. Follows a "situation → complication → resolution → lesson" arc. This tone gets the highest share rate because stories are memorable and relatable.',
};

function getToneDesc(tone) {
  return TONE_DESCRIPTIONS[tone] || TONE_DESCRIPTIONS.professional;
}

// ── Content Theme Rotation ────────────────────────────────

const CONTENT_THEMES = [
  'Founder lessons — mistakes made, lessons learned, things you wish you knew earlier',
  'Build-in-public updates — sharing real progress, metrics, or behind-the-scenes decisions',
  'Frameworks and actionable tips — step-by-step methods the reader can apply immediately',
  'Contrarian opinions — challenging conventional wisdom in the industry with well-reasoned arguments',
  'Story-driven insights — a specific moment or experience that led to a breakthrough or realization',
  'Startup building experiences — real challenges of building a product, hiring, fundraising, or launching',
];

/**
 * Build a user context string for personalized prompts
 */
function buildUserContextPrompt(userContext) {
  if (!userContext) return '';
  const parts = [];
  if (userContext.name) parts.push(`The author's name is ${userContext.name}.`);
  if (userContext.profession) parts.push(`They are a ${userContext.profession}.`);
  if (userContext.domain) parts.push(`Their domain/industry is ${userContext.domain}.`);
  if (parts.length === 0) return '';
  return `\n\n## AUTHOR CONTEXT\n${parts.join(' ')}\nUse this context to make the content feel authentic and niche-specific. Reference their domain naturally. Do NOT mention their name in the post unless it fits organically.`;
}

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

/**
 * Generate 5 post topics from user's configured categories
 * Optimized for LinkedIn algorithm reach
 */
async function generateTopics(categories = [], isOrgPost = false) {
  const categoriesHint =
    categories.length > 0
      ? `Focus on these areas: ${categories.join(', ')}.`
      : 'Choose trending and engaging professional topics.';

  // Pick 2 random themes for variety
  const shuffled = [...CONTENT_THEMES].sort(() => Math.random() - 0.5);
  const themeHint = `Rotate across these content angles:\n${shuffled.slice(0, 3).map(t => `• ${t}`).join('\n')}`;

  const voiceRule = isOrgPost
    ? `\n- These topics are for an ORGANIZATION / COMPANY page, NOT a personal profile\n- Topics must be about industry trends, data, company insights, market analysis, or thought leadership\n- Do NOT suggest topics about personal stories, personal journeys, or individual experiences\n- Avoid topics like "My experience with...", "From X to Y journey", "Lessons I learned"\n- Good examples: "How AI is reshaping supply chains in 2025", "5 enterprise cloud trends to watch"`
    : '';

  const prompt = `You are a LinkedIn growth strategist who specializes in creating viral content. Your posts consistently get 10K+ impressions.

Generate exactly 5 unique LinkedIn post topics that will MAXIMIZE impressions and engagement.

${categoriesHint}

${themeHint}

Requirements:
- Each topic must create a CURIOSITY GAP — the reader must feel compelled to click "see more"
- Topics should be specific and opinionated, NEVER generic
- Maximum 8 words per topic — shorter titles perform better
- Mix between: contrarian takes, practical frameworks, mistake-driven lessons, and build-in-public angles
- Each topic should feel like a real person sharing a real insight
- AVOID generic motivational topics like "The power of perseverance" or "Why mindset matters"
- AVOID topics that start with "How to" — they underperform on LinkedIn
- Good examples: "We lost our biggest client. Here's what happened.", "Stop building features nobody asked for", "The hiring mistake that cost us 6 months"${voiceRule}
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
 * Optimized for LinkedIn virality
 */
async function generateTopicsFromKeyword(keyword, categories = [], isOrgPost = false) {
  const contextHint =
    categories.length > 0
      ? `The user's general area of expertise includes: ${categories.join(', ')}. Use this as context to make topics more niche and authority-building.`
      : '';

  const voiceRule = isOrgPost
    ? `\n- These topics are for an ORGANIZATION / COMPANY page, NOT a personal profile\n- Topics must be about industry trends, data, company insights, or market analysis related to "${keyword}"\n- Do NOT suggest topics about personal stories, personal journeys, or individual experiences\n- Focus on facts, research, and professional analysis`
    : '';

  const prompt = `You are a LinkedIn growth strategist who creates viral content. The user wants to write about: "${keyword}"

Generate exactly 5 LinkedIn post topics about "${keyword}" that will get 10K+ impressions.
${contextHint}

Requirements:
- Each topic must create a CURIOSITY GAP that makes people want to read more
- Topics must be directly related to "${keyword}" but with a UNIQUE ANGLE
- Maximum 8 words per topic
- Mix between: contrarian takes on "${keyword}", practical lessons, mistakes made with "${keyword}", and surprising insights
- AVOID generic topics like "The future of ${keyword}" or "Why ${keyword} matters"
- Each topic should sound like a real founder/professional sharing a genuine insight
- Good examples for "AI": "We replaced our support team with AI. Results?", "AI won't take your job. Lazy thinking will.", "I built an AI tool in 48 hours. Lessons."${voiceRule}
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
 * Each idea includes a hook, description, and recommended format
 */
async function generateIdeas(topic, tone = 'professional', isOrgPost = false) {
  const toneDesc = getToneDesc(tone);
  const voiceRule = isOrgPost
    ? `\n- Write from an ORGANIZATION perspective (use "we", "our company", "our team")\n- Focus on industry insights, data, trends, and company achievements\n- Do NOT include personal stories, personal anecdotes, or first-person singular experiences\n- All content must be factual and professional`
    : '';

  const prompt = `You are a LinkedIn growth strategist. For the topic "${topic}", generate exactly 3 unique post ideas that would get 10K+ impressions on LinkedIn.

LinkedIn's algorithm favors posts that get comments in the first 30 minutes. Each idea must be designed to trigger responses.

Each idea should include:
- "hook": A scroll-stopping first line (this is the MOST important part — it determines if anyone reads the post)
  * Use one of these proven patterns: curiosity gap, contrarian opinion, surprising mistake, bold statistic, or relatable frustration
  * Keep it under 15 words
  * It should create TENSION that the reader needs to resolve
- "description": What the post will cover and why it will drive engagement (2-3 sentences)
- "format": The recommended post format — one of: "list" (bullet-point tips), "story" (narrative arc), "hot-take" (opinion-driven), "framework" (step-by-step method)

The tone should be ${toneDesc}.
${voiceRule}
${NO_TEMPLATE_RULE}

Return ONLY a JSON array of 3 objects with "hook", "description", and "format" keys, no markdown formatting, no code blocks. Example:
[{"hook": "Hook text here...", "description": "Description here...", "format": "story"}, ...]`;

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
 * Generate a full LinkedIn post optimized for maximum impressions
 */
async function generatePost(idea, tone = 'professional', isOrgPost = false, userContext = null) {
  const toneDesc = getToneDesc(tone);
  const userContextPrompt = buildUserContextPrompt(userContext);

  const personalRules = `- Write in first person singular ("I", "my")
- Include a genuine personal insight or hard-won lesson
- Be specific — mention real-sounding timeframes, numbers, and situations
- Show some vulnerability — what went wrong, what surprised you, what you'd do differently`;

  const orgRules = `- Write from an ORGANIZATION perspective — use "we", "our team", "our company" (NEVER "I" or "my")
- Base all claims on real industry facts, data, statistics, and trends
- NEVER fabricate personal stories, personal anecdotes, or fictional experiences
- Focus on company insights, industry analysis, research findings, and thought leadership
- You may reference company achievements, team efforts, or industry milestones`;

  const formatGuidance = idea.format ? `\nThe recommended format for this post is "${idea.format}":
${idea.format === 'list' ? '- Structure the value section as clear, actionable bullet points with "→" markers' : ''}
${idea.format === 'story' ? '- Tell a short narrative: situation → challenge → what happened → lesson learned' : ''}
${idea.format === 'hot-take' ? '- Lead with a bold, contrarian opinion. Back it up with 3-4 sharp reasons.' : ''}
${idea.format === 'framework' ? '- Present a clear, named framework or step-by-step method the reader can apply today' : ''}` : '';

  const prompt = `You are a LinkedIn content creator who consistently generates posts with 10K+ impressions. You deeply understand LinkedIn's distribution algorithm.

Create a LinkedIn post based on this idea:

Hook: ${idea.hook}
Description: ${idea.description}
${formatGuidance}
${LINKEDIN_ALGORITHM_RULES}
${MANDATORY_POST_STRUCTURE}
${POST_FORMAT_RULES}
${AUTHENTICITY_RULES}
${userContextPrompt}

## TONE
${toneDesc}

## VOICE
${isOrgPost ? orgRules : personalRules}

## HASHTAG RULES
- Add exactly 3-5 niche hashtags at the very end
- Use niche, community-specific hashtags (e.g., #buildinpublic #startuplife #founderjourney)
- AVOID broad/spam hashtags (#success #motivation #business #innovation)
- Hashtags should help the post reach the RIGHT audience, not the biggest audience

## FINAL CHECKLIST BEFORE OUTPUT
Before returning the post, verify:
✓ Hook stops the scroll and creates curiosity
✓ Total post is 10-14 lines (including spacing)
✓ One sentence per line
✓ Value section has 3-5 clear bullet points
✓ Ends with ONE specific discussion question
✓ 3-5 niche hashtags at the end
✓ No external links
✓ No markdown formatting
✓ Sounds human, not AI-generated
✓ No placeholder text or brackets

${NO_TEMPLATE_RULE}

Return ONLY the post text, nothing else. No explanations, no labels, no commentary.`;

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
 * Revise a post based on user feedback while maintaining LinkedIn optimization
 */
async function revisePost(currentPost, feedback, tone = 'professional', isOrgPost = false, userContext = null) {
  const toneDesc = getToneDesc(tone);
  const userContextPrompt = buildUserContextPrompt(userContext);
  const voiceRule = isOrgPost
    ? `\n- This is an ORGANIZATION post — use "we"/"our", NEVER "I"/"my"\n- Do NOT add personal stories or fictional experiences\n- Keep all content fact-based and professional`
    : '';

  const prompt = `You are a LinkedIn content expert who creates posts with 10K+ impressions. Revise the following post based on the user's feedback.

Current Post:
---
${currentPost}
---

User Feedback: ${feedback}

## REVISION RULES
- Apply the user's requested changes precisely
- MAINTAIN the LinkedIn-optimized structure: Hook → Context → Value bullets → Insight → CTA
- If the user asks to change tone or length, adjust while keeping the structure intact
- Keep 10-14 lines total with one sentence per line
- Keep the engagement CTA (discussion question) at the end
- Keep 3-5 niche hashtags
- Tone: ${toneDesc}${voiceRule}
${userContextPrompt}
${POST_FORMAT_RULES}
${AUTHENTICITY_RULES}
${NO_TEMPLATE_RULE}

## FINAL CHECK
Verify the revised post still:
✓ Has a scroll-stopping hook
✓ Is 10-14 lines with short paragraphs
✓ Ends with a specific discussion question
✓ Has 3-5 niche hashtags
✓ Sounds human and authentic

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
