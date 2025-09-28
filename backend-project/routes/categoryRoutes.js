const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken } = require('../middleware/auth');

// 所有分类路由都需要认证
router.use(authenticateToken);

// 分类CRUD路由
router.get('/categories', categoryController.getAllCategories);
router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// 文章分类关联路由
router.post('/categories/add-to-article', categoryController.addCategoryToArticle);
router.delete('/categories/remove-from-article', categoryController.removeCategoryFromArticle);

module.exports = router;