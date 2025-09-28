const { promisePool } = require('../config/database');

const Group = {
  // 创建群组
  create: async (groupData) => {
    const { name, description, created_by } = groupData;
    const query = 'INSERT INTO `groups` (name, description, created_by) VALUES (?, ?, ?)';
    const [result] = await promisePool.execute(query, [name, description, created_by]);
    return result.insertId;
  },

  // 获取用户所属的所有群组
  getUserGroups: async (userId) => {
    const query = `
      SELECT g.*, gm.role as user_role, 
             (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
      FROM \`groups\` g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = ?
      ORDER BY g.updated_at DESC
    `;
    const [rows] = await promisePool.execute(query, [userId]);
    return rows;
  },

  // 通过ID获取群组信息
  getById: async (groupId) => {
    const query = `
      SELECT g.*, u.name as creator_name
      FROM \`groups\` g
      JOIN users u ON g.created_by = u.id
      WHERE g.id = ?
    `;
    const [rows] = await promisePool.execute(query, [groupId]);
    return rows[0];
  },

  // 更新群组信息
  update: async (groupId, groupData) => {
    const { name, description } = groupData;
    const query = 'UPDATE `groups` SET name = ?, description = ? WHERE id = ?';
    const [result] = await promisePool.execute(query, [name, description, groupId]);
    return result.affectedRows;
  },

  // 删除群组
  delete: async (groupId) => {
    const query = 'DELETE FROM `groups` WHERE id = ?';
    const [result] = await promisePool.execute(query, [groupId]);
    return result.affectedRows;
  },

  // 添加群组成员
  addMember: async (groupId, userId, role = 'member') => {
    const query = 'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)';
    const [result] = await promisePool.execute(query, [groupId, userId, role]);
    return result.insertId;
  },

  // 获取群组成员
  getMembers: async (groupId) => {
    const query = `
      SELECT u.id, u.name, u.email, gm.role, gm.joined_at
      FROM users u
      JOIN group_members gm ON u.id = gm.user_id
      WHERE gm.group_id = ?
      ORDER BY gm.role DESC, gm.joined_at ASC
    `;
    const [rows] = await promisePool.execute(query, [groupId]);
    return rows;
  },

  // 检查用户是否为群组成员
  isMember: async (groupId, userId) => {
    const query = 'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?';
    const [rows] = await promisePool.execute(query, [groupId, userId]);
    return rows.length > 0;
  },

  // 检查用户是否为群组管理员或创建者
  isAdmin: async (groupId, userId) => {
    const query = 'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?';
    const [rows] = await promisePool.execute(query, [groupId, userId]);
    return rows.length > 0 && (rows[0].role === 'admin' || rows[0].role === 'owner');
  },

  // 移除群组成员
  removeMember: async (groupId, userId) => {
    // 不能移除群组创建者
    const checkQuery = 'SELECT created_by FROM `groups` WHERE id = ?';
    const [checkRows] = await promisePool.execute(checkQuery, [groupId]);
    
    if (checkRows.length > 0 && checkRows[0].created_by == userId) {
      throw new Error('Cannot remove group owner');
    }
    
    const query = 'DELETE FROM group_members WHERE group_id = ? AND user_id = ?';
    const [result] = await promisePool.execute(query, [groupId, userId]);
    return result.affectedRows;
  },

  // 发送群组消息
  sendMessage: async (messageData) => {
    const { group_id, sender_id, content } = messageData;
    const query = 'INSERT INTO group_messages (group_id, sender_id, content) VALUES (?, ?, ?)';
    const [result] = await promisePool.execute(query, [group_id, sender_id, content]);
    return result.insertId;
  },

  // 获取群组消息
  getMessages: async (groupId, limit = 50, offset = 0) => {
    const query = `
      SELECT gm.*, u.name as sender_name
      FROM group_messages gm
      JOIN users u ON gm.sender_id = u.id
      WHERE gm.group_id = ?
      ORDER BY gm.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;
    const [rows] = await promisePool.execute(query, [groupId]);
    return rows.reverse(); // 按时间顺序返回
  },

  // 搜索群组
  search: async (keyword, userId) => {
    const query = `
      SELECT g.*, gm.role as user_role,
             (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
      FROM \`groups\` g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = ? AND g.name LIKE ?
      ORDER BY g.updated_at DESC
    `;
    const searchPattern = `%${keyword}%`;
    const [rows] = await promisePool.execute(query, [userId, searchPattern]);
    return rows;
  }
};

module.exports = Group;