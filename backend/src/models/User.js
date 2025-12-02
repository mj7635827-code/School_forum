const db = require('../config/database');

class User {
  static async create(userData) {
    const { email, password, firstName, lastName, yearLevel, schoolIdPath } = userData;
    
    const [result] = await db.execute(
      `INSERT INTO users (email, password, first_name, last_name, year_level, school_id_path, status, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', 'student', NOW())`,
      [email, password, firstName, lastName, yearLevel, schoolIdPath]
    );
    
    return result.insertId;
  }
  
  static async findByEmail(email) {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  }
  
  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT id, email, first_name as firstName, last_name as lastName, year_level, year_level as yearLevel, status, role, email_verified as emailVerified, school_id_number as schoolIdNumber, created_at as createdAt FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }
  
  static async updateEmailVerification(id, isVerified = true) {
    await db.execute(
      'UPDATE users SET email_verified = ?, updated_at = NOW() WHERE id = ?',
      [isVerified, id]
    );
  }
  
  static async updateStatus(id, status, role = null) {
    if (role) {
      await db.execute(
        'UPDATE users SET status = ?, role = ?, updated_at = NOW() WHERE id = ?',
        [status, role, id]
      );
    } else {
      await db.execute(
        'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, id]
      );
    }
  }
  
  static async getPendingUsers() {
    const [rows] = await db.execute(
      `SELECT id, email, first_name, last_name, year_level, school_id_path, created_at 
       FROM users 
       WHERE status = 'pending' AND email_verified = 1
       ORDER BY created_at ASC`
    );
    return rows;
  }
  
  static async deleteSchoolId(id) {
    await db.execute(
      'UPDATE users SET school_id_path = NULL WHERE id = ?',
      [id]
    );
  }
  
  static async updateYearLevel(id, yearLevel) {
    await db.execute(
      'UPDATE users SET year_level = ?, updated_at = NOW() WHERE id = ?',
      [yearLevel, id]
    );
  }
  
  static async updateSchoolId(id, schoolIdPath) {
    await db.execute(
      'UPDATE users SET school_id_path = ?, updated_at = NOW() WHERE id = ?',
      [schoolIdPath, id]
    );
  }
  
  static async updateSchoolIdNumber(id, schoolIdNumber) {
    await db.execute(
      'UPDATE users SET school_id_number = ?, updated_at = NOW() WHERE id = ?',
      [schoolIdNumber, id]
    );
  }
  
  static async query(query, params) {
    const [rows] = await db.execute(query, params);
    return rows;
  }
  
  static async getStats() {
    const [totalUsers] = await db.execute('SELECT COUNT(*) as count FROM users');
    const [pendingUsers] = await db.execute('SELECT COUNT(*) as count FROM users WHERE status = "pending"');
    const [activeUsers] = await db.execute('SELECT COUNT(*) as count FROM users WHERE status = "active"');
    const [g11Users] = await db.execute('SELECT COUNT(*) as count FROM users WHERE year_level = "G11" AND status = "active"');
    const [g12Users] = await db.execute('SELECT COUNT(*) as count FROM users WHERE year_level = "G12" AND status = "active"');
    
    return {
      total: totalUsers[0].count,
      pending: pendingUsers[0].count,
      active: activeUsers[0].count,
      g11: g11Users[0].count,
      g12: g12Users[0].count
    };
  }

  static async findAll() {
    const [rows] = await db.execute(`
      SELECT 
        id, 
        email, 
        first_name as firstName, 
        last_name as lastName, 
        year_level as gradeLevel, 
        status, 
        role, 
        email_verified as emailVerified, 
        school_id_number as schoolIdNumber,
        created_at as createdAt
      FROM users 
      ORDER BY created_at DESC
    `);
    return rows;
  }
  static async updatePassword(id, hashedPassword) {
  await db.execute(
    'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
    [hashedPassword, id]
  );
}

}


module.exports = User;