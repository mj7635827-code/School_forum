@echo off
echo 🔄 Resetting School Forum Database...
echo.

echo 📦 Step 1: Setting up main database structure...
node backend/src/utils/setupDatabase.js

echo.
echo 📦 Step 2: Running all migrations...
node -e "
const { setupDatabase } = require('./backend/src/utils/setupDatabase.js');
const { runMigrations } = require('./backend/src/migrations/index.js');

async function resetDatabase() {
  console.log('🚀 Starting complete database reset...');
  
  // First setup the main database and users table
  const setupSuccess = await setupDatabase();
  if (!setupSuccess) {
    console.error('❌ Database setup failed!');
    process.exit(1);
  }
  
  // Then run all migrations
  await runMigrations();
  
  console.log('✅ Database reset completed successfully!');
}

resetDatabase().catch(console.error);
"

echo.
echo ✅ Database reset completed!
echo.
echo 🔑 Demo Accounts Created:
echo    Admin: admin@school.edu / AdminPass123!
echo    Moderator: moderator@school.edu / ModPass123!
echo    Student: student@gmail.com / StudentPass123!
echo.
pause