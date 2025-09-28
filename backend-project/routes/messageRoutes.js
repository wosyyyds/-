const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

// 所有私信路由都需要认证
router.use(authenticateToken);

// 私信CRUD路由
router.post('/messages', messageController.sendMessage); // 发送私信
router.get('/messages/received', messageController.getReceivedMessages); // 获取收到的私信
router.get('/messages/sent', messageController.getSentMessages); // 获取发送的私信
router.get('/messages/conversation/:userId', messageController.getConversation); // 获取与特定用户的对话
router.get('/messages/unread-count', messageController.getUnreadCount); // 获取未读私信数量
router.put('/messages/:messageId/read', messageController.markAsRead); // 标记私信为已读
router.delete('/messages/:messageId', messageController.deleteMessage); // 删除私信

module.exports = router;