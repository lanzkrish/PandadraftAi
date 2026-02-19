const logger = require('../utils/logger');
const ai = require('../services/ai');
const linkedin = require('../services/linkedin');

// Workflow states
const STATE = {
  IDLE: 'IDLE',
  TOPICS_SENT: 'TOPICS_SENT',
  IDEAS_SENT: 'IDEAS_SENT',
  DRAFT_SENT: 'DRAFT_SENT',
  AWAITING_FEEDBACK: 'AWAITING_FEEDBACK',
  POSTED: 'POSTED',
};

class PostWorkflow {
  constructor() {
    this.state = STATE.IDLE;
    this.data = {
      topics: [],
      selectedTopic: null,
      ideas: [],
      selectedIdea: null,
      currentPost: null,
    };
    this.sendMessage = null; // Will be set by telegram service
    this.sendInlineKeyboard = null;
  }

  /**
   * Set the message sender functions (injected by Telegram service)
   */
  setMessageSenders({ sendMessage, sendInlineKeyboard }) {
    this.sendMessage = sendMessage;
    this.sendInlineKeyboard = sendInlineKeyboard;
  }

  /**
   * Get current state
   */
  getState() {
    return this.state;
  }

  /**
   * Reset workflow to idle
   */
  reset() {
    this.state = STATE.IDLE;
    this.data = {
      topics: [],
      selectedTopic: null,
      ideas: [],
      selectedIdea: null,
      currentPost: null,
    };
    logger.info('Workflow reset to IDLE');
  }

  /**
   * Start the workflow — generate and send topics
   */
  async start() {
    if (this.state !== STATE.IDLE) {
      await this.sendMessage(
        '⚠️ A workflow is already in progress. Use /cancel to reset, or continue with the current flow.'
      );
      return;
    }

    try {
      await this.sendMessage('🚀 Starting daily LinkedIn post workflow...\n\n🤖 Generating topics for you...');

      this.data.topics = await ai.generateTopics();
      this.state = STATE.TOPICS_SENT;

      const buttons = this.data.topics.map((topic, index) => [
        { text: topic, callback_data: `topic_${index}` },
      ]);

      await this.sendInlineKeyboard(
        '📋 *Choose a topic for today\'s post:*\n\nPick one that resonates with you:',
        buttons
      );

      logger.info('Topics sent to user, waiting for selection');
    } catch (error) {
      logger.error('Error starting workflow:', error);
      await this.sendMessage(`❌ Error generating topics: ${error.message}\n\nUse /generate to try again.`);
      this.reset();
    }
  }

  /**
   * Handle topic selection
   */
  async handleTopicSelection(topicIndex) {
    if (this.state !== STATE.TOPICS_SENT) {
      return;
    }

    try {
      this.data.selectedTopic = this.data.topics[topicIndex];
      await this.sendMessage(
        `✅ Topic selected: *${this.data.selectedTopic}*\n\n🤖 Generating post ideas...`
      );

      this.data.ideas = await ai.generateIdeas(this.data.selectedTopic);
      this.state = STATE.IDEAS_SENT;

      const buttons = this.data.ideas.map((idea, index) => [
        { text: `💡 ${idea.hook.substring(0, 60)}...`, callback_data: `idea_${index}` },
      ]);

      let ideasText = '📝 *Choose a post idea:*\n\n';
      this.data.ideas.forEach((idea, index) => {
        ideasText += `*${index + 1}. ${idea.hook}*\n${idea.description}\n\n`;
      });

      await this.sendInlineKeyboard(ideasText, buttons);
      logger.info('Ideas sent to user, waiting for selection');
    } catch (error) {
      logger.error('Error generating ideas:', error);
      await this.sendMessage(`❌ Error generating ideas: ${error.message}\n\nUse /generate to start over.`);
      this.reset();
    }
  }

  /**
   * Handle idea selection — generate the full post
   */
  async handleIdeaSelection(ideaIndex) {
    if (this.state !== STATE.IDEAS_SENT) {
      return;
    }

    try {
      this.data.selectedIdea = this.data.ideas[ideaIndex];
      await this.sendMessage(
        `✅ Idea selected!\n\n🤖 Crafting your LinkedIn post...`
      );

      this.data.currentPost = await ai.generatePost(this.data.selectedIdea);
      this.state = STATE.DRAFT_SENT;

      await this.sendMessage(`📄 *Here's your draft post:*\n\n---\n${this.data.currentPost}\n---`);

      await this.sendInlineKeyboard(
        '👆 *Review the post above.* What would you like to do?',
        [
          [
            { text: '✅ Approve & Post', callback_data: 'approve' },
            { text: '✏️ Edit', callback_data: 'edit' },
          ],
          [
            { text: '🔄 Regenerate', callback_data: 'regenerate' },
            { text: '❌ Cancel', callback_data: 'cancel' },
          ],
        ]
      );

      logger.info('Draft sent to user, waiting for approval');
    } catch (error) {
      logger.error('Error generating post:', error);
      await this.sendMessage(`❌ Error generating post: ${error.message}\n\nUse /generate to start over.`);
      this.reset();
    }
  }

  /**
   * Handle post approval — post to LinkedIn
   */
  async handleApproval() {
    if (this.state !== STATE.DRAFT_SENT) {
      return;
    }

    try {
      await this.sendMessage('📤 Posting to LinkedIn...');

      const result = await linkedin.createPost(this.data.currentPost);
      this.state = STATE.POSTED;

      await this.sendMessage(
        `🎉 *Successfully posted to LinkedIn!*\n\nPost ID: \`${result.postId}\`\n\nCheck your LinkedIn profile to see it live! 🚀`
      );

      logger.info(`Post published to LinkedIn. ID: ${result.postId}`);
      this.reset();
    } catch (error) {
      logger.error('Error posting to LinkedIn:', error);
      const errMsg = error.message.includes('not authorized')
        ? error.message
        : `Failed to post: ${error.message}`;
      await this.sendMessage(
        `❌ ${errMsg}\n\nYour draft is saved. Use /approve to try posting again.`
      );
    }
  }

  /**
   * Handle edit request — wait for user feedback
   */
  async handleEditRequest() {
    if (this.state !== STATE.DRAFT_SENT) {
      return;
    }

    this.state = STATE.AWAITING_FEEDBACK;
    await this.sendMessage(
      '✏️ *Send me your feedback or changes.*\n\nTell me what you\'d like to change (e.g., "make it shorter", "add more data points", "change the tone to be more casual").'
    );
    logger.info('Waiting for user feedback on post');
  }

  /**
   * Handle user feedback — revise the post
   */
  async handleFeedback(feedback) {
    if (this.state !== STATE.AWAITING_FEEDBACK) {
      return false;
    }

    try {
      await this.sendMessage('🤖 Revising your post...');

      this.data.currentPost = await ai.revisePost(this.data.currentPost, feedback);
      this.state = STATE.DRAFT_SENT;

      await this.sendMessage(`📄 *Revised post:*\n\n---\n${this.data.currentPost}\n---`);

      await this.sendInlineKeyboard(
        '👆 *Review the revised post.* What would you like to do?',
        [
          [
            { text: '✅ Approve & Post', callback_data: 'approve' },
            { text: '✏️ Edit Again', callback_data: 'edit' },
          ],
          [
            { text: '🔄 Regenerate', callback_data: 'regenerate' },
            { text: '❌ Cancel', callback_data: 'cancel' },
          ],
        ]
      );

      return true;
    } catch (error) {
      logger.error('Error revising post:', error);
      await this.sendMessage(`❌ Error revising post: ${error.message}`);
      this.state = STATE.DRAFT_SENT;
      return true;
    }
  }

  /**
   * Regenerate the post with the same idea
   */
  async handleRegenerate() {
    if (this.state !== STATE.DRAFT_SENT) {
      return;
    }

    try {
      await this.sendMessage('🔄 Regenerating post...');
      this.state = STATE.IDEAS_SENT;
      await this.handleIdeaSelection(this.data.ideas.indexOf(this.data.selectedIdea));
    } catch (error) {
      logger.error('Error regenerating post:', error);
      await this.sendMessage(`❌ Error: ${error.message}`);
    }
  }
}

module.exports = { PostWorkflow, STATE };
