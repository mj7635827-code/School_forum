require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function simpleFix() {
  let connection;
  
  try {
    console.log('🔄 Connecting to MySQL...');
    
    // Connect directly to the school_forum database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'school_forum',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to school_forum database');

    // Check if users table exists
    const [tables] = await connection.query("SHOW TABLES LIKE 'users'");
    
    if (tables.length === 0) {
      console.log('📝 Users table not found, creating it...');
      
      // Create users table
      const createUsersTable = `
        CREATE TABLE users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          year_level ENUM('G11', 'G12') NOT NULL,
          status ENUM('pending', 'active', 'suspended', 'banned') DEFAULT 'pending',
          role ENUM('student', 'moderator', 'admin') DEFAULT 'student',
          email_verified BOOLEAN DEFAULT FALSE,
          school_id_path VARCHAR(500) NULL,
          school_id_number VARCHAR(50) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          INDEX idx_email (email),
          INDEX idx_status (status),
          INDEX idx_role (role)
        )
      `;
      
      await connection.query(createUsersTable);
      console.log('✅ Users table created successfully');
    }

    console.log('🎉 Simple fix completed successfully');

  } catch (error) {
    console.error('❌ Error during simple fix:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the fix
simpleFix()
  .then(() => {
    console.log('✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });