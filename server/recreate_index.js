const mongoose = require('mongoose');
const config = require('./src/config');

async function recreateIndex() {
  try {
    await mongoose.connect(config.database.uri);
    const db = mongoose.connection.db;
    await db.collection('users').createIndex(
      { telegram_chat_id: 1 }, 
      { unique: true, sparse: true, name: 'telegram_chat_id_1' }
    );
    console.log("Index recreated successfully with sparse: true!");
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

recreateIndex();
