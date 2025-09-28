const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin, requireSuperAdmin } = require('../middleware/permission');

// 公开路由
router.post('/register', userController.register);
router.post('/login', userController.login);

// 需要认证的路由
router.use(authenticateToken);

// 用户个人资料路由
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// 用于私信功能的用户列表路由（所有认证用户都可以访问）
router.get('/users/messaging', userController.getUsersForMessaging);

// 管理员路由
router.get('/users', requireAdmin, userController.getAllUsers);
router.put('/users/:id', requireAdmin, userController.updateUser);
router.delete('/users/:id', requireAdmin, userController.deleteUser);
router.get('/users/search', requireAdmin, userController.searchUsers);

// 超级管理员路由
router.put('/users/:id/role', requireSuperAdmin, userController.updateUserRole);

module.exports = router;