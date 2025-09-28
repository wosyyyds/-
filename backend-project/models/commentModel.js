const { promisePool } = require('../config/database');

const Comment = {
  // 创建评论
  create: async (commentData) => {
    const { content, article_id, user_id, parent_id } = commentData;
    const query = 'INSERT INTO comments (content, article_id, user_id, parent_id) VALUES (?, ?, ?, ?)';
    const [result] = await promisePool.execute(query, [content, article_id, user_id, parent_id || null]);
    return result.insertId;
  },
  
  // 获取文章的所有评论（带用户信息和回复）
  findByArticle: async (articleId) => {
    const query = `
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email,
        COUNT(r.id) as reply_count
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN comments r ON c.id = r.parent_id
      WHERE c.article_id = ? AND c.parent_id IS NULL
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;
    const [rows] = await promisePool.execute(query, [articleId]);
    return rows;
  },
  
  // 获取评论的回复
  findReplies: async (parentId) => {
    const query = `
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.parent_id = ?
      ORDER BY c.created_at ASC
    `;
    const [rows] = await promisePool.execute(query, [parentId]);
    return rows;
  },
  
  // 根据ID获取评论
  findById: async (id) => {
    const query = `
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `;
    const [rows] = await promisePool.execute(query, [id]);
    return rows[0];
  },
  
  // 更新评论
  update: async (id, content) => {
    const query = 'UPDATE comments SET content = ? WHERE id = ?';
    const [result] = await promisePool.execute(query, [content, id]);
    return result.affectedRows;
  },
  
  // 删除评论
  delete: async (id) => {
    const query = 'DELETE FROM comments WHERE id = ? OR parent_id = ?';
    const [result] = await promisePool.execute(query, [id, id]);
    return result.affectedRows;
  },
  
  // 获取用户的评论
  findByUser: async (userId) => {
    const query = `
      SELECT 
        c.*,
        a.title as article_title,
        u.name as user_name
      FROM comments c
      LEFT JOIN articles a ON c.article_id = a.id
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `;
    const [rows] = await promisePool.execute(query, [userId]);
    return rows;
  }
};

module.exports = Comment;