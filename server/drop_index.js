const mongoose = require('mongoose');
const config = require('./src/config');

async function dropIndex() {
  try {
    await mongoose.connect(config.database.uri);
    const db = mongoose.connection.db;
    await db.collection('users').dropIndex('telegram_chat_id_1');
    console.log("Index dropped successfully!");
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

dropIndex();
