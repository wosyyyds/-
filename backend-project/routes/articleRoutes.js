const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { authenticateToken } = require('../middleware/auth');

// 所有文章路由都需要认证
router.use(authenticateToken);

// 文章CRUD路由
router.post('/articles', articleController.createArticle);
router.get('/articles', articleController.getAllArticles);
router.get('/articles/search', articleController.searchArticles);
router.get('/articles/popular', articleController.getPopularArticles);
router.get('/articles/category/:categoryId', articleController.getArticlesByCategory);
router.get('/articles/user/:userId?', articleController.getUserArticles);
router.get('/articles/:id', articleController.getArticle);
router.put('/articles/:id', articleController.updateArticle);
router.delete('/articles/:id', articleController.deleteArticle);

module.exports = router;