// This is the old 2-step generation logic saved for future use as requested.

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
 * Generate a full LinkedIn post optimized for maximum impressions based on an IDEA
 */
async function generatePostFromIdea(idea, tone = 'professional', isOrgPost = false, userContext = null) {
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

module.exports = {
  generateIdeas,
  generatePostFromIdea,
};
