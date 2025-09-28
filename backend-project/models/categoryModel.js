const { promisePool } = require('../config/database');

const Category = {
  // 获取所有分类（包含文章计数）
  findAll: async () => {
    const query = `
      SELECT 
        c.*,
        COUNT(ac.article_id) as article_count
      FROM categories c
      LEFT JOIN article_categories ac ON c.id = ac.category_id
      GROUP BY c.id
      ORDER BY c.name
    `;
    const [rows] = await promisePool.execute(query);
    return rows;
  },
  
  // 根据ID获取分类
  findById: async (id) => {
    const query = 'SELECT * FROM categories WHERE id = ?';
    const [rows] = await promisePool.execute(query, [id]);
    return rows[0];
  },
  
  // 创建分类
  create: async (categoryData) => {
    const { name, description } = categoryData;
    const query = 'INSERT INTO categories (name, description) VALUES (?, ?)';
    const [result] = await promisePool.execute(query, [name, description]);
    return result.insertId;
  },
  
  // 更新分类
  update: async (id, categoryData) => {
    const { name, description } = categoryData;
    const query = 'UPDATE categories SET name = ?, description = ? WHERE id = ?';
    const [result] = await promisePool.execute(query, [name, description, id]);
    return result.affectedRows;
  },
  
  // 删除分类
  delete: async (id) => {
    const query = 'DELETE FROM categories WHERE id = ?';
    const [result] = await promisePool.execute(query, [id]);
    return result.affectedRows;
  },
  
  // 获取文章的分类
  findByArticle: async (articleId) => {
    const query = `
      SELECT c.* 
      FROM categories c
      INNER JOIN article_categories ac ON c.id = ac.category_id
      WHERE ac.article_id = ?
    `;
    const [rows] = await promisePool.execute(query, [articleId]);
    return rows;
  },
  
  // 为文章添加分类
  addToArticle: async (articleId, categoryId) => {
    const query = 'INSERT INTO article_categories (article_id, category_id) VALUES (?, ?)';
    const [result] = await promisePool.execute(query, [articleId, categoryId]);
    return result.affectedRows;
  },
  
  // 移除文章的分类
  removeFromArticle: async (articleId, categoryId) => {
    let query, params;
    
    if (categoryId) {
      // 删除特定分类关联
      query = 'DELETE FROM article_categories WHERE article_id = ? AND category_id = ?';
      params = [articleId, categoryId];
    } else {
      // 删除所有分类关联
      query = 'DELETE FROM article_categories WHERE article_id = ?';
      params = [articleId];
    }
    
    const [result] = await promisePool.execute(query, params);
    return result.affectedRows;
  }
};

module.exports = Category;