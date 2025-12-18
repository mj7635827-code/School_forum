require('dotenv').config();
const { setupDatabase } = require('./src/utils/setupDatabase.js');
const { runMigrations } = require('./src/migrations/index.js');

async function resetDatabase() {
  console.log('🚀 Starting complete database reset...');
  
  try {
    // First setup the main database and users table
    console.log('\n📦 Step 1: Setting up main database structure...');
    const setupSuccess = await setupDatabase();
    if (!setupSuccess) {
      console.error('❌ Database setup failed!');
      process.exit(1);
    }
    
    // Then run all migrations
    console.log('\n📦 Step 2: Running all migrations...');
    await runMigrations();
    
    console.log('\n✅ Database reset completed successfully!');
    console.log('\n🔑 Demo Accounts Available:');
    console.log('   Admin: admin@school.edu / AdminPass123!');
    console.log('   Moderator: moderator@school.edu / ModPass123!');
    console.log('   Student: student@gmail.com / StudentPass123!');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  }
}

resetDatabase();