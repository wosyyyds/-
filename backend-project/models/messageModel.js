const { promisePool } = require('../config/database');

const Message = {
  // 发送私信
  send: async (messageData) => {
    const { sender_id, receiver_id, content } = messageData;
    const query = 'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)';
    const [result] = await promisePool.execute(query, [sender_id, receiver_id, content]);
    return result.insertId;
  },

  // 获取用户收到的私信
  getReceivedMessages: async (userId, limit = 20, offset = 0) => {
    const query = `
      SELECT 
        m.*,
        u.name as sender_name,
        u.email as sender_email
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.receiver_id = ?
      ORDER BY m.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;
    const [rows] = await promisePool.execute(query, [userId]);
    return rows;
  },

  // 获取用户发送的私信
  getSentMessages: async (userId, limit = 20, offset = 0) => {
    const query = `
      SELECT 
        m.*,
        u.name as receiver_name,
        u.email as receiver_email
      FROM messages m
      LEFT JOIN users u ON m.receiver_id = u.id
      WHERE m.sender_id = ?
      ORDER BY m.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;
    const [rows] = await promisePool.execute(query, [userId]);
    return rows;
  },

  // 获取两个用户之间的私信对话
  getConversation: async (userId1, userId2, limit = 20, offset = 0) => {
    const query = `
      SELECT 
        m.*,
        u1.name as sender_name,
        u2.name as receiver_name
      FROM messages m
      LEFT JOIN users u1 ON m.sender_id = u1.id
      LEFT JOIN users u2 ON m.receiver_id = u2.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;
    const [rows] = await promisePool.execute(query, [userId1, userId2, userId2, userId1]);
    return rows;
  },

  // 标记私信为已读
  markAsRead: async (messageId, userId) => {
    const query = 'UPDATE messages SET is_read = TRUE WHERE id = ? AND receiver_id = ?';
    const [result] = await promisePool.execute(query, [messageId, userId]);
    return result.affectedRows;
  },

  // 批量标记私信为已读
  markConversationAsRead: async (userId1, userId2) => {
    const query = 'UPDATE messages SET is_read = TRUE WHERE receiver_id = ? AND sender_id = ? AND is_read = FALSE';
    const [result] = await promisePool.execute(query, [userId1, userId2]);
    return result.affectedRows;
  },

  // 获取未读私信数量
  getUnreadCount: async (userId) => {
    const query = 'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = FALSE';
    const [rows] = await promisePool.execute(query, [userId]);
    return rows[0].count;
  },

  // 删除私信
  delete: async (messageId, userId) => {
    // 用户只能删除自己发送或接收的私信
    const query = 'DELETE FROM messages WHERE id = ? AND (sender_id = ? OR receiver_id = ?)';
    const [result] = await promisePool.execute(query, [messageId, userId, userId]);
    return result.affectedRows;
  },

  // 获取用户之间的未读消息数
  getUnreadCountBetweenUsers: async (userId1, userId2) => {
    const query = 'SELECT COUNT(*) as count FROM messages WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE';
    const [rows] = await promisePool.execute(query, [userId1, userId2]);
    return rows[0].count;
  }
};

module.exports = Message;