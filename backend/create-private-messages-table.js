require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function createPrivateMessagesTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_forum',
    multipleStatements: true
  });

  try {
    console.log('📝 Creating private_messages table...');

    const sql = fs.readFileSync(
      path.join(__dirname, '../database/create_private_messages.sql'),
      'utf8'
    );

    await connection.query(sql);

    console.log('✅ private_messages table created successfully!');
    console.log('');
    console.log('Private messaging feature enabled:');
    console.log('- 1-on-1 conversations between users');
    console.log('- Messages stored in database');
    console.log('- Can be polled for near real-time chat');

  } catch (error) {
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️  private_messages table already exists');
    } else {
      console.error('❌ Error creating private_messages table:', error.message);
      throw error;
    }
  } finally {
    await connection.end();
  }
}

createPrivateMessagesTable()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });