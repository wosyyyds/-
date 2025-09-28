const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');

// 所有评论路由都需要认证
router.use(authenticateToken);

// 评论CRUD路由
router.post('/comments', commentController.createComment);
router.get('/comments/article/:articleId', commentController.getArticleComments);
router.put('/comments/:id', commentController.updateComment);
router.delete('/comments/:id', commentController.deleteComment);
router.get('/comments/user/:userId?', commentController.getUserComments);

module.exports = router;