const { promisePool } = require('../config/database');

const Article = {
  // 创建文章
  create: async (articleData) => {
    const { title, content, author_id } = articleData;
    const query = 'INSERT INTO articles (title, content, author_id) VALUES (?, ?, ?)';
    const [result] = await promisePool.execute(query, [title, content, author_id]);
    return result.insertId;
  },
  
  // 获取所有文章（带作者信息）
  findAll: async () => {
    const query = `
      SELECT 
        a.*, 
        u.name as author_name,
        u.email as author_email
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      ORDER BY a.created_at DESC
    `;
    const [rows] = await promisePool.execute(query);
    return rows;
  },
  
  // 根据ID获取文章
  findById: async (id) => {
    const query = `
      SELECT 
        a.*, 
        u.name as author_name,
        u.email as author_email
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.id = ?
    `;
    const [rows] = await promisePool.execute(query, [id]);
    return rows[0];
  },
  
  // 获取用户的所有文章
  findByAuthor: async (authorId) => {
    const query = `
      SELECT 
        a.*, 
        u.name as author_name,
        u.email as author_email
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.author_id = ?
      ORDER BY a.created_at DESC
    `;
    const [rows] = await promisePool.execute(query, [authorId]);
    return rows;
  },
  
  // 更新文章
  update: async (id, articleData) => {
    const { title, content } = articleData;
    const query = 'UPDATE articles SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    const [result] = await promisePool.execute(query, [title, content, id]);
    return result.affectedRows;
  },
  
  // 删除文章
  delete: async (id) => {
    const query = 'DELETE FROM articles WHERE id = ?';
    const [result] = await promisePool.execute(query, [id]);
    return result.affectedRows;
  },
  
  // 搜索文章
  search: async (keyword) => {
    const query = `
      SELECT 
        a.*, 
        u.name as author_name,
        u.email as author_email
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.title LIKE ? OR a.content LIKE ? OR u.name LIKE ?
      ORDER BY a.created_at DESC
    `;
    const searchPattern = `%${keyword}%`;
    const [rows] = await promisePool.execute(query, [searchPattern, searchPattern, searchPattern]);
    return rows;
  },

  // 获取文章详情（带统计信息）
  findByIdWithStats: async (id) => {
    const query = `
      SELECT 
        a.*, 
        u.name as author_name,
        u.email as author_email,
        (SELECT COUNT(*) FROM likes WHERE article_id = a.id) as like_count,
        (SELECT COUNT(*) FROM favorites WHERE article_id = a.id) as favorite_count,
        (SELECT COUNT(*) FROM comments WHERE article_id = a.id) as comment_count
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.id = ?
    `;
    const [rows] = await promisePool.execute(query, [id]);
    return rows[0];
  },
  
  // 分页获取文章（简化版本）
  findWithPagination: async (page = 1, limit = 10) => {
    try {
      // 确保参数是整数
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const offset = (pageNum - 1) * limitNum;
      
      console.log('Debug pagination params:', { pageNum, limitNum, offset });
      
      // 先试试最简单的查询
      const query = `SELECT a.*, u.name as author_name, u.email as author_email FROM articles a LEFT JOIN users u ON a.author_id = u.id ORDER BY a.created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;
      
      console.log('SQL Query:', query);
      
      const [rows] = await promisePool.execute(query);
      
      // 获取总数
      const countQuery = 'SELECT COUNT(*) as total FROM articles';
      const [countRows] = await promisePool.execute(countQuery);
      
      return {
        articles: rows,
        total: countRows[0].total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(countRows[0].total / limitNum)
      };
    } catch (error) {
      console.error('FindWithPagination error:', error);
      throw error;
    }
  },
  
  // 根据分类获取文章
  findByCategory: async (categoryId, page = 1, limit = 10) => {
    try {
      // 确保参数是整数
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const offset = (pageNum - 1) * limitNum;
      
      // 验证参数范围
      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        throw new Error('分页参数无效');
      }
      
      console.log('Debug findByCategory params:', { categoryId, pageNum, limitNum, offset });
      
      // 使用字符串拼接避免MySQL参数绑定问题
      const query = `
        SELECT 
          a.*, 
          u.name as author_name,
          u.email as author_email,
          (SELECT COUNT(*) FROM likes WHERE article_id = a.id) as like_count,
          (SELECT COUNT(*) FROM favorites WHERE article_id = a.id) as favorite_count,
          (SELECT COUNT(*) FROM comments WHERE article_id = a.id) as comment_count
        FROM articles a
        LEFT JOIN users u ON a.author_id = u.id
        INNER JOIN article_categories ac ON a.id = ac.article_id
        WHERE ac.category_id = ?
        ORDER BY a.created_at DESC
        LIMIT ${limitNum} OFFSET ${offset}
      `;
      
      console.log('SQL Query:', query);
      
      const [rows] = await promisePool.execute(query, [parseInt(categoryId)]);
      
      // 获取总数
      const countQuery = 'SELECT COUNT(*) as total FROM article_categories WHERE category_id = ?';
      const [countRows] = await promisePool.execute(countQuery, [parseInt(categoryId)]);
      
      return {
        articles: rows,
        total: countRows[0].total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(countRows[0].total / limitNum)
      };
    } catch (error) {
      console.error('FindByCategory error:', error);
      throw error;
    }
  },
  
  // 获取热门文章
  findPopular: async (limit = 10) => {
    try {
      const limitNum = parseInt(limit) || 10;
      
      // 验证参数范围
      if (limitNum < 1 || limitNum > 100) {
        throw new Error('数量限制参数无效');
      }
      
      console.log('Debug findPopular params:', { limitNum });
      
      // 简化查询，只按阅读量和创建时间排序
      const query = `
        SELECT 
          a.*, 
          u.name as author_name,
          u.email as author_email,
          COALESCE(a.view_count, 0) as like_count,
          0 as favorite_count,
          0 as comment_count,
          COALESCE(a.view_count, 0) as popularity
        FROM articles a
        LEFT JOIN users u ON a.author_id = u.id
        ORDER BY a.view_count DESC, a.created_at DESC
        LIMIT ${limitNum}
      `;
      
      console.log('SQL Query:', query);
      
      const [rows] = await promisePool.execute(query);
      return rows;
    } catch (error) {
      console.error('FindPopular error:', error);
      throw error;
    }
  },
  
  // 增加阅读计数（可选）
  incrementViewCount: async (id) => {
    const query = 'UPDATE articles SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?';
    const [result] = await promisePool.execute(query, [id]);
    return result.affectedRows;
  }
};

// 还需要修改articles表，增加view_count字段
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
    console.log('Articles table ready');
  } catch (error) {
    console.error('Error creating articles table:', error);
  }
};

module.exports = Article;