const Message = require('../models/messageModel');
const User = require('../models/userModel');
const { promisePool } = require('../config/database'); // 添加这行

const messageController = {
  // 发送私信
  sendMessage: async (req, res) => {
    try {
      const { receiver_id, content } = req.body;
      const sender_id = req.user.id;

      // 验证输入
      if (!receiver_id || !content) {
        return res.status(400).json({ message: '接收者和内容不能为空' });
      }

      // 检查接收者是否存在
      const receiver = await User.findById(receiver_id);
      if (!receiver) {
        return res.status(404).json({ message: '接收者不存在' });
      }

      // 不能给自己发私信
      if (sender_id == receiver_id) {
        return res.status(400).json({ message: '不能给自己发送私信' });
      }

      // 发送私信
      const messageId = await Message.send({ sender_id, receiver_id, content });
      const message = await getFullMessage(messageId);

      res.status(201).json({
        message: '私信发送成功',
        data: message
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ message: '发送私信时发生错误' });
    }
  },

  // 获取收到的私信
  getReceivedMessages: async (req, res) => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const messages = await Message.getReceivedMessages(userId, limit, offset);

      res.json({
        message: '获取收到的私信成功',
        data: messages,
        pagination: {
          page,
          limit,
          total: messages.length
        }
      });
    } catch (error) {
      console.error('Get received messages error:', error);
      res.status(500).json({ message: '获取收到的私信时发生错误' });
    }
  },

  // 获取发送的私信
  getSentMessages: async (req, res) => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const messages = await Message.getSentMessages(userId, limit, offset);

      res.json({
        message: '获取发送的私信成功',
        data: messages,
        pagination: {
          page,
          limit,
          total: messages.length
        }
      });
    } catch (error) {
      console.error('Get sent messages error:', error);
      res.status(500).json({ message: '获取发送的私信时发生错误' });
    }
  },

  // 获取与特定用户的对话
  getConversation: async (req, res) => {
    try {
      const userId = req.user.id;
      const { userId: otherUserId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      // 检查用户是否存在
      const otherUser = await User.findById(otherUserId);
      if (!otherUser) {
        return res.status(404).json({ message: '用户不存在' });
      }

      const messages = await Message.getConversation(userId, otherUserId, limit, offset);

      // 标记对话中的消息为已读
      await Message.markConversationAsRead(userId, otherUserId);

      res.json({
        message: '获取对话成功',
        data: {
          messages,
          otherUser: {
            id: otherUser.id,
            name: otherUser.name,
            email: otherUser.email
          }
        },
        pagination: {
          page,
          limit,
          total: messages.length
        }
      });
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({ message: '获取对话时发生错误' });
    }
  },

  // 获取未读私信数量
  getUnreadCount: async (req, res) => {
    try {
      const userId = req.user.id;
      const count = await Message.getUnreadCount(userId);

      res.json({
        message: '获取未读私信数量成功',
        data: { count }
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({ message: '获取未读私信数量时发生错误' });
    }
  },

  // 标记私信为已读
  markAsRead: async (req, res) => {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;

      const affectedRows = await Message.markAsRead(messageId, userId);

      if (affectedRows === 0) {
        return res.status(404).json({ message: '私信不存在或无权标记为已读' });
      }

      res.json({ message: '私信已标记为已读' });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({ message: '标记私信为已读时发生错误' });
    }
  },

  // 删除私信
  deleteMessage: async (req, res) => {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;

      const affectedRows = await Message.delete(messageId, userId);

      if (affectedRows === 0) {
        return res.status(404).json({ message: '私信不存在或无权删除' });
      }

      res.json({ message: '私信删除成功' });
    } catch (error) {
      console.error('Delete message error:', error);
      res.status(500).json({ message: '删除私信时发生错误' });
    }
  }
};

// 辅助函数：获取完整的消息信息
const getFullMessage = async (messageId) => {
  const query = `
    SELECT 
      m.*,
      u1.name as sender_name,
      u2.name as receiver_name
    FROM messages m
    LEFT JOIN users u1 ON m.sender_id = u1.id
    LEFT JOIN users u2 ON m.receiver_id = u2.id
    WHERE m.id = ?
  `;
  const [rows] = await promisePool.execute(query, [messageId]);
  return rows[0];
};

module.exports = messageController;