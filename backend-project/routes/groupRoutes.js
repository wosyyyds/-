const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticateToken } = require('../middleware/auth');

// 所有群组路由都需要认证
router.use(authenticateToken);

// 群组CRUD路由
router.post('/groups', groupController.createGroup); // 创建群组
router.get('/groups', groupController.getUserGroups); // 获取用户所属的群组
router.get('/groups/search', groupController.searchGroups); // 搜索群组
router.get('/groups/:groupId', groupController.getGroupDetails); // 获取群组详情
router.put('/groups/:groupId', groupController.updateGroup); // 更新群组信息
router.delete('/groups/:groupId', groupController.deleteGroup); // 删除群组

// 群组成员管理路由
router.post('/groups/:groupId/members', groupController.addMember); // 添加成员
router.delete('/groups/:groupId/members/:userId', groupController.removeMember); // 移除成员

// 群组消息路由
router.post('/groups/:groupId/messages', groupController.sendMessage); // 发送消息
router.get('/groups/:groupId/messages', groupController.getMessages); // 获取消息

module.exports = router;