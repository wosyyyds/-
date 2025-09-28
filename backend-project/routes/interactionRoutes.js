const express = require('express');
const router = express.Router();
const interactionController = require('../controllers/interactionController');
const { authenticateToken } = require('../middleware/auth');

// 所有互动路由都需要认证
router.use(authenticateToken);

// 点赞相关路由
router.post('/interactions/like/:articleId', interactionController.likeArticle);
router.delete('/interactions/like/:articleId', interactionController.unlikeArticle);

// 收藏相关路由  
router.post('/interactions/favorite/:articleId', interactionController.favoriteArticle);
router.delete('/interactions/favorite/:articleId', interactionController.unfavoriteArticle);

// 检查互动状态
router.get('/interactions/check/:articleId', interactionController.checkUserInteraction);

// 获取用户互动列表
router.get('/interactions/likes/user/:userId?', interactionController.getUserLikes);
router.get('/interactions/favorites/user/:userId?', interactionController.getUserFavorites);

module.exports = router;