const { promisePool } = require('../config/database');

const Interaction = {
  // 点赞文章
  likeArticle: async (articleId, userId) => {
    const query = 'INSERT INTO likes (article_id, user_id) VALUES (?, ?)';
    try {
      const [result] = await promisePool.execute(query, [articleId, userId]);
      return result.affectedRows;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return 0; // 已经点赞过了
      }
      throw error;
    }
  },
  
  // 取消点赞
  unlikeArticle: async (articleId, userId) => {
    const query = 'DELETE FROM likes WHERE article_id = ? AND user_id = ?';
    const [result] = await promisePool.execute(query, [articleId, userId]);
    return result.affectedRows;
  },
  
  // 收藏文章
  favoriteArticle: async (articleId, userId) => {
    const query = 'INSERT INTO favorites (article_id, user_id) VALUES (?, ?)';
    try {
      const [result] = await promisePool.execute(query, [articleId, userId]);
      return result.affectedRows;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return 0; // 已经收藏过了
      }
      throw error;
    }
  },
  
  // 取消收藏
  unfavoriteArticle: async (articleId, userId) => {
    const query = 'DELETE FROM favorites WHERE article_id = ? AND user_id = ?';
    const [result] = await promisePool.execute(query, [articleId, userId]);
    return result.affectedRows;
  },
  
  // 获取文章的点赞数
  getLikeCount: async (articleId) => {
    const query = 'SELECT COUNT(*) as count FROM likes WHERE article_id = ?';
    const [rows] = await promisePool.execute(query, [articleId]);
    return rows[0].count;
  },
  
  // 获取文章的收藏数
  getFavoriteCount: async (articleId) => {
    const query = 'SELECT COUNT(*) as count FROM favorites WHERE article_id = ?';
    const [rows] = await promisePool.execute(query, [articleId]);
    return rows[0].count;
  },
  
  // 检查用户是否点赞
  hasLiked: async (articleId, userId) => {
    const query = 'SELECT id FROM likes WHERE article_id = ? AND user_id = ?';
    const [rows] = await promisePool.execute(query, [articleId, userId]);
    return rows.length > 0;
  },
  
  // 检查用户是否收藏
  hasFavorited: async (articleId, userId) => {
    const query = 'SELECT id FROM favorites WHERE article_id = ? AND user_id = ?';
    const [rows] = await promisePool.execute(query, [articleId, userId]);
    return rows.length > 0;
  },
  
  // 获取用户的点赞列表
  getUserLikes: async (userId) => {
    const query = `
      SELECT 
        l.*,
        a.title as article_title,
        a.content as article_content,
        u.name as author_name
      FROM likes l
      LEFT JOIN articles a ON l.article_id = a.id
      LEFT JOIN users u ON a.author_id = u.id
      WHERE l.user_id = ?
      ORDER BY l.created_at DESC
    `;
    const [rows] = await promisePool.execute(query, [userId]);
    return rows;
  },
  
  // 获取用户的收藏列表
  getUserFavorites: async (userId) => {
    const query = `
      SELECT 
        f.*,
        a.title as article_title,
        a.content as article_content,
        u.name as author_name
      FROM favorites f
      LEFT JOIN articles a ON f.article_id = a.id
      LEFT JOIN users u ON a.author_id = u.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `;
    const [rows] = await promisePool.execute(query, [userId]);
    return rows;
  },

  // 检查用户对文章的互动状态
  checkUserInteraction: async (articleId, userId) => {
    const liked = await Interaction.hasLiked(articleId, userId);
    const favorited = await Interaction.hasFavorited(articleId, userId);
    
    return {
      liked,
      favorited
    };
  }
};

module.exports = Interaction;