const mysql = require('mysql2');
require('dotenv').config();

//创建数据库
const pool = mysql.createPool({
    host:process.env.DB_HOST || 'localhost',
    user:process.env.DB_USER || 'root',
    password:process.env.DB_PASSWORD || '',
    database:process.env.DB_NAME || 'user_management',
    waitForConnections:true,
    connectionLimit:10,
    queueLimit:0
});

// 将pool promise化，以便使用async/await
const promisePool = pool.promise();

//创建用户表（如果不存在）
const createUserTable = async()=>{
    try{
        const query = `
        CREATE TABLE IF NOT EXISTS users(
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin', 'super_admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        await promisePool.execute(query);
        
        // 添加role字段（如果不存在）
        try {
            const alterQuery = "ALTER TABLE users ADD COLUMN role ENUM('user', 'admin', 'super_admin') DEFAULT 'user'";
            await promisePool.execute(alterQuery);
        } catch (alterError) {
            // 字段已存在，忽略错误
            if (alterError.code !== 'ER_DUP_FIELDNAME') {
                console.error('Error adding role column:', alterError);
            }
        }
        
        console.log('Users table ready');
    }catch(error){
        console.error('Error creating users table:', error);
        if(error && error.code === 'ER_ACCESS_DENIED_ERROR'){
            console.error('Database access denied. Check DB_USER/DB_PASSWORD/DB_HOST in your .env file.');
        }
        throw error;
    }
};

// 创建文章表
const createArticleTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        author_id INT NOT NULL,
        view_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;
    await promisePool.execute(query);
    
    // 检查是否需要添加 view_count 字段（为了兼容旧数据）
    try {
      const alterQuery = 'ALTER TABLE articles ADD COLUMN view_count INT DEFAULT 0';
      await promisePool.execute(alterQuery);
    } catch (alterError) {
      // 字段已存在，忽略错误
      if (alterError.code !== 'ER_DUP_FIELDNAME') {
        console.error('Error adding view_count column:', alterError);
      }
    }
    
    console.log('Articles table ready');
  } catch (error) {
    console.error('Error creating articles table:', error);
  }
};

// 创建分类表
const createCategoryTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await promisePool.execute(query);
    console.log('Categories table ready');
  } catch (error) {
    console.error('Error creating categories table:', error);
  }
};

// 创建文章分类关联表
const createArticleCategoryTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS article_categories (
        article_id INT NOT NULL,
        category_id INT NOT NULL,
        PRIMARY KEY (article_id, category_id),
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `;
    await promisePool.execute(query);
    console.log('Article categories table ready');
  } catch (error) {
    console.error('Error creating article_categories table:', error);
  }
};

// 创建评论表
const createCommentTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content TEXT NOT NULL,
        article_id INT NOT NULL,
        user_id INT NOT NULL,
        parent_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
      )
    `;
    await promisePool.execute(query);
    console.log('Comments table ready');
  } catch (error) {
    console.error('Error creating comments table:', error);
  }
};

// 创建点赞表
const createLikeTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        article_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_like (article_id, user_id),
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;
    await promisePool.execute(query);
    console.log('Likes table ready');
  } catch (error) {
    console.error('Error creating likes table:', error);
  }
};

// 创建收藏表
const createFavoriteTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        article_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_favorite (article_id, user_id),
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;
    await promisePool.execute(query);
    console.log('Favorites table ready');
  } catch (error) {
    console.error('Error creating favorites table:', error);
  }
};

// 创建私信表
const createMessageTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_sender_receiver (sender_id, receiver_id),
        INDEX idx_receiver_created (receiver_id, created_at)
      )
    `;
    await promisePool.execute(query);
    console.log('Messages table ready');
  } catch (error) {
    console.error('Error creating messages table:', error);
  }
};

// 创建群组表
const createGroupTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS \`groups\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `;
    await promisePool.execute(query);
    console.log('Groups table ready');
  } catch (error) {
    console.error('Error creating groups table:', error);
  }
};

// 创建群组成员表
const createGroupMemberTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS group_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        user_id INT NOT NULL,
        role ENUM('member', 'admin', 'owner') DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES \`groups\`(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_group_user (group_id, user_id)
      )
    `;
    await promisePool.execute(query);
    console.log('Group members table ready');
  } catch (error) {
    console.error('Error creating group members table:', error);
  }
};

// 创建群组消息表
const createGroupMessageTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS group_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        sender_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES \`groups\`(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_group_created (group_id, created_at)
      )
    `;
    await promisePool.execute(query);
    console.log('Group messages table ready');
  } catch (error) {
    console.error('Error creating group messages table:', error);
  }
};

// 插入默认分类
const insertDefaultCategories = async () => {
  try {
    const defaultCategories = [
      { name: '技术', description: '技术相关文章' },
      { name: '生活', description: '生活相关文章' },
      { name: '旅行', description: '旅行相关文章' },
      { name: '美食', description: '美食相关文章' },
      { name: '学习', description: '学习相关文章' }
    ];

    for (const category of defaultCategories) {
      const checkQuery = 'SELECT id FROM categories WHERE name = ?';
      const [rows] = await promisePool.execute(checkQuery, [category.name]);
      
      if (rows.length === 0) {
        const insertQuery = 'INSERT INTO categories (name, description) VALUES (?, ?)';
        await promisePool.execute(insertQuery, [category.name, category.description]);
      }
    }
    console.log('Default categories ready');
  } catch (error) {
    console.error('Error inserting default categories:', error);
  }
};

module.exports = { 
    promisePool, 
    createUserTable, 
    createArticleTable, 
    createFavoriteTable, 
    createLikeTable, 
    createCommentTable,
    createCategoryTable,
    createArticleCategoryTable,
    createMessageTable,  // 添加私信表创建函数
    createGroupTable,    // 添加群组表创建函数
    createGroupMemberTable,  // 添加群组成员表创建函数
    createGroupMessageTable, // 添加群组消息表创建函数
    insertDefaultCategories
    
  };