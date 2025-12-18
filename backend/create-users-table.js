require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createUsersTable() {
  let connection;
  
  try {
    console.log('🔄 Connecting to MySQL...');
    
    // First connect without specifying database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'school_forum'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('✅ Database created/verified');

    // Switch to the database
    await connection.query(`USE ${process.env.DB_NAME || 'school_forum'}`);
    console.log('✅ Using school_forum database');

    // Drop existing users table if it exists (to start fresh)
    await connection.query('DROP TABLE IF EXISTS users');
    console.log('🗑️ Dropped existing users table');

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

    // Create demo accounts
    const adminPassword = await bcrypt.hash('AdminPass123!', 12);
    const modPassword = await bcrypt.hash('ModPass123!', 12);
    const studentPassword = await bcrypt.hash('StudentPass123!', 12);

    // Insert admin user
    await connection.execute(`
      INSERT INTO users (email, password, first_name, last_name, year_level, status, role, email_verified)
      VALUES ('admin@school.edu', ?, 'System', 'Administrator', 'G12', 'active', 'admin', 1)
    `, [adminPassword]);
    console.log('✅ Admin account created');

    // Insert moderator user
    await connection.execute(`
      INSERT INTO users (email, password, first_name, last_name, year_level, status, role, email_verified)
      VALUES ('moderator@school.edu', ?, 'Forum', 'Moderator', 'G12', 'active', 'moderator', 1)
    `, [modPassword]);
    console.log('✅ Moderator account created');

    // Insert demo student
    await connection.execute(`
      INSERT INTO users (email, password, first_name, last_name, year_level, status, role, email_verified)
      VALUES ('student@gmail.com', ?, 'Demo', 'Student', 'G11', 'active', 'student', 1)
    `, [studentPassword]);
    console.log('✅ Demo student account created');

    console.log('\n🎉 Users table setup completed successfully!');
    console.log('\n🔑 Demo Accounts:');
    console.log('   Admin: admin@school.edu / AdminPass123!');
    console.log('   Moderator: moderator@school.edu / ModPass123!');
    console.log('   Student: student@gmail.com / StudentPass123!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n📄 Database connection closed');
    }
  }
}

createUsersTable();