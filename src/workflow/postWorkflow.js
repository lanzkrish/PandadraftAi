const logger = require('../utils/logger');
const ai = require('../services/ai');
const linkedin = require('../services/linkedin');
const db = require('../db');

const STATE = {
  IDLE: 'IDLE',
  TOPICS_SENT: 'TOPICS_SENT',
  IDEAS_SENT: 'IDEAS_SENT',
  DRAFT_SENT: 'DRAFT_SENT',
  AWAITING_FEEDBACK: 'AWAITING_FEEDBACK',
  POSTED: 'POSTED',
};

class PostWorkflow {
  constructor(user, { sendMessage, sendInlineKeyboard }) {
    this.user = user;
    this.userId = user._id;
    this.state = STATE.IDLE;
    this.data = {
      topics: [],
      selectedTopic: null,
      ideas: [],
      selectedIdea: null,
      currentPost: null,
      postHistoryId: null,
    };
    this.sendMessage = sendMessage;
    this.sendInlineKeyboard = sendInlineKeyboard;

    this.categories = user.content_categories
      ? user.content_categories.split(',').map((c) => c.trim()).filter(Boolean)
      : [];
    this.tone = user.content_tone || 'professional';
  }

  getState() { return this.state; }

  reset() {
    this.state = STATE.IDLE;
    this.data = { topics: [], selectedTopic: null, ideas: [], selectedIdea: null, currentPost: null, postHistoryId: null };
    logger.info(`Workflow reset for user ${this.userId}`);
  }

  async start() {
    if (this.state !== STATE.IDLE) {
      await this.sendMessage('⚠️ A workflow is already in progress. Use /cancel to reset.');
      return;
    }

    try {
      await this.sendMessage('🚀 Starting LinkedIn post workflow...\n\n🤖 Generating topics...');
      this.data.topics = await ai.generateTopics(this.categories);
      this.state = STATE.TOPICS_SENT;

      const buttons = this.data.topics.map((topic, i) => [
        { text: topic, callback_data: `topic_${i}` },
      ]);

      await this.sendInlineKeyboard(
        '📋 *Choose a topic for today\'s post:*\n\nPick one that resonates:',
        buttons
      );
      logger.info(`Topics sent to user ${this.userId}`);
    } catch (error) {
      logger.error(`Error starting workflow for user ${this.userId}:`, error);
      await this.sendMessage(`❌ Error generating topics: ${error.message}\n\nUse /generate to try again.`);
      this.reset();
    }
  }

  async handleTopicSelection(topicIndex) {
    if (this.state !== STATE.TOPICS_SENT) return;
    try {
      this.data.selectedTopic = this.data.topics[topicIndex];
      await this.sendMessage(`✅ Topic: *${this.data.selectedTopic}*\n\n🤖 Generating ideas...`);

      this.data.ideas = await ai.generateIdeas(this.data.selectedTopic, this.tone);
      this.state = STATE.IDEAS_SENT;

      const buttons = this.data.ideas.map((idea, i) => [
        { text: `💡 ${idea.hook.substring(0, 60)}...`, callback_data: `idea_${i}` },
      ]);

      let text = '📝 *Choose a post idea:*\n\n';
      this.data.ideas.forEach((idea, i) => {
        text += `*${i + 1}. ${idea.hook}*\n${idea.description}\n\n`;
      });

      await this.sendInlineKeyboard(text, buttons);
    } catch (error) {
      logger.error(`Error for user ${this.userId}:`, error);
      await this.sendMessage(`❌ Error: ${error.message}\n\nUse /generate to start over.`);
      this.reset();
    }
  }

  async handleIdeaSelection(ideaIndex) {
    if (this.state !== STATE.IDEAS_SENT) return;
    try {
      this.data.selectedIdea = this.data.ideas[ideaIndex];
      await this.sendMessage('✅ Idea selected!\n\n🤖 Crafting your post...');

      this.data.currentPost = await ai.generatePost(this.data.selectedIdea, this.tone);
      this.state = STATE.DRAFT_SENT;

      const post = await db.savePostHistory(this.userId, {
        topic: this.data.selectedTopic,
        idea: this.data.selectedIdea.hook,
        postContent: this.data.currentPost,
        status: 'drafted',
      });
      this.data.postHistoryId = post._id;

      await this.sendMessage(`📄 *Draft post:*\n\n---\n${this.data.currentPost}\n---`);
      await this.sendInlineKeyboard('👆 *Review the post.* What would you like to do?', [
        [{ text: '✅ Approve & Post', callback_data: 'approve' }, { text: '✏️ Edit', callback_data: 'edit' }],
        [{ text: '🔄 Regenerate', callback_data: 'regenerate' }, { text: '❌ Cancel', callback_data: 'cancel' }],
      ]);
    } catch (error) {
      logger.error(`Error for user ${this.userId}:`, error);
      await this.sendMessage(`❌ Error: ${error.message}\n\nUse /generate to start over.`);
      this.reset();
    }
  }

  async handleApproval() {
    if (this.state !== STATE.DRAFT_SENT) return;
    try {
      await this.sendMessage('📤 Posting to LinkedIn...');
      const result = await linkedin.createPost(this.userId, this.data.currentPost);
      this.state = STATE.POSTED;

      if (this.data.postHistoryId) {
        await db.updatePostHistory(this.data.postHistoryId, { linkedinPostId: result.postId, status: 'posted' });
      }

      await this.sendMessage(
        `🎉 *Posted to LinkedIn!*\n\n📍 ${result.target}\nID: \`${result.postId}\`\n\nCheck your LinkedIn! 🚀`
      );
      this.reset();
    } catch (error) {
      logger.error(`Error posting for user ${this.userId}:`, error);
      if (this.data.postHistoryId) {
        await db.updatePostHistory(this.data.postHistoryId, { status: 'failed' });
      }
      await this.sendMessage(`❌ ${error.message}\n\nUse /approve to retry.`);
    }
  }

  async handleEditRequest() {
    if (this.state !== STATE.DRAFT_SENT) return;
    this.state = STATE.AWAITING_FEEDBACK;
    await this.sendMessage('✏️ *Send your feedback.* What should I change?');
  }

  async handleFeedback(feedback) {
    if (this.state !== STATE.AWAITING_FEEDBACK) return false;
    try {
      await this.sendMessage('🤖 Revising...');
      this.data.currentPost = await ai.revisePost(this.data.currentPost, feedback, this.tone);
      this.state = STATE.DRAFT_SENT;

      await this.sendMessage(`📄 *Revised post:*\n\n---\n${this.data.currentPost}\n---`);
      await this.sendInlineKeyboard('👆 *Review.* What next?', [
        [{ text: '✅ Approve & Post', callback_data: 'approve' }, { text: '✏️ Edit Again', callback_data: 'edit' }],
        [{ text: '🔄 Regenerate', callback_data: 'regenerate' }, { text: '❌ Cancel', callback_data: 'cancel' }],
      ]);
      return true;
    } catch (error) {
      logger.error(`Error revising for user ${this.userId}:`, error);
      await this.sendMessage(`❌ Error: ${error.message}`);
      this.state = STATE.DRAFT_SENT;
      return true;
    }
  }

  async handleRegenerate() {
    if (this.state !== STATE.DRAFT_SENT) return;
    await this.sendMessage('🔄 Regenerating...');
    this.state = STATE.IDEAS_SENT;
    await this.handleIdeaSelection(this.data.ideas.indexOf(this.data.selectedIdea));
  }
}

module.exports = { PostWorkflow, STATE };
