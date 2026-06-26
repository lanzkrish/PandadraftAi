const mongoose = require('mongoose');
const config = require('./src/config');

async function checkIndexes() {
  try {
    await mongoose.connect(config.database.uri);
    const db = mongoose.connection.db;
    const indexes = await db.collection('users').indexes();
    console.log(JSON.stringify(indexes, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

checkIndexes();
