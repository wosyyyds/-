const Article = require('../models/articleModel');
const Category = require('../models/categoryModel');
const Interaction = require('../models/interactionModel');

const articleController = {
  // 创建文章（带分类）
  createArticle: async (req, res) => {
    try {
      const { title, content, category_id } = req.body;
      const author_id = req.user.id; // 从认证中间件获取用户ID
      
      // 验证输入
      if (!title || !content) {
        return res.status(400).json({ message: '标题和内容不能为空' });
      }
      
      if (title.length > 200) {
        return res.status(400).json({ message: '标题长度不能超过200个字符' });
      }
      
      // 创建文章
      const articleId = await Article.create({ title, content, author_id });
      const article = await Article.findById(articleId);
      
      // 添加分类（如果提供了）
      if (category_id) {
        await Category.addToArticle(articleId, category_id);
      }
      
      res.status(201).json({
        message: '文章创建成功',
        article
      });
    } catch (error) {
      console.error('Create article error:', error);
      res.status(500).json({ message: '创建文章时发生错误' });
    }
  },
  
  // 分页获取文章
  getAllArticles: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      // 验证参数范围
      if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({ message: '页码和每页数量参数无效' });
      }
      
      const result = await Article.findWithPagination(page, limit);
      
      res.json({
        message: '获取文章列表成功',
        ...result
      });
    } catch (error) {
      console.error('Get articles paginated error:', error);
      res.status(500).json({ message: '获取文章列表时发生错误' });
    }
  },
  
  // 获取单个文章（带互动信息）
  getArticle: async (req, res) => {
    try {
      const { id } = req.params;
      const article = await Article.findByIdWithStats(id);
      
      if (!article) {
        return res.status(404).json({ message: '文章不存在' });
      }
      
      // 增加阅读计数
      await Article.incrementViewCount(id);
      
      // 获取分类信息
      const categories = await Category.findByArticle(id);
      
      // 获取用户互动状态
      const interaction = await Interaction.checkUserInteraction(id, req.user.id);
      
      res.json({
        message: '获取文章成功',
        article: {
          ...article,
          categories,
          userInteraction: interaction
        }
      });
    } catch (error) {
      console.error('Get article error:', error);
      res.status(500).json({ message: '获取文章时发生错误' });
    }
  },
  
  // 获取用户文章
  getUserArticles: async (req, res) => {
    try {
      const authorId = req.params.userId || req.user.id;
      const articles = await Article.findByAuthor(authorId);
      
      res.json({
        message: '获取用户文章成功',
        articles,
        count: articles.length
      });
    } catch (error) {
      console.error('Get user articles error:', error);
      res.status(500).json({ message: '获取用户文章时发生错误' });
    }
  },
  
  // 更新文章
  updateArticle: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content, category_id } = req.body;
      const userId = req.user.id;
      
      // 验证输入
      if (!title || !content) {
        return res.status(400).json({ message: '标题和内容不能为空' });
      }
      
      // 检查文章是否存在且属于当前用户
      const existingArticle = await Article.findById(id);
      if (!existingArticle) {
        return res.status(404).json({ message: '文章不存在' });
      }
      
      if (existingArticle.author_id !== userId) {
        return res.status(403).json({ message: '无权修改此文章' });
      }
      
      // 更新文章
      const affectedRows = await Article.update(id, { title, content });
      
      if (affectedRows === 0) {
        return res.status(404).json({ message: '文章更新失败' });
      }
      
      // 更新分类（如果提供了）
      if (category_id !== undefined) {
        // 先删除所有旧的分类关联
        await Category.removeFromArticle(id);
        // 如果新的分类ID不为空，则添加新的关联
        if (category_id) {
          await Category.addToArticle(id, category_id);
        }
      }
      
      const updatedArticle = await Article.findById(id);
      res.json({
        message: '文章更新成功',
        article: updatedArticle
      });
    } catch (error) {
      console.error('Update article error:', error);
      res.status(500).json({ message: '更新文章时发生错误' });
    }
  },
  
  // 删除文章
  deleteArticle: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // 检查文章是否存在且属于当前用户
      const existingArticle = await Article.findById(id);
      if (!existingArticle) {
        return res.status(404).json({ message: '文章不存在' });
      }
      
      if (existingArticle.author_id !== userId) {
        return res.status(403).json({ message: '无权删除此文章' });
      }
      
      // 删除文章
      const affectedRows = await Article.delete(id);
      
      if (affectedRows === 0) {
        return res.status(404).json({ message: '文章删除失败' });
      }
      
      res.json({ message: '文章删除成功' });
    } catch (error) {
      console.error('Delete article error:', error);
      res.status(500).json({ message: '删除文章时发生错误' });
    }
  },
  
  // 搜索文章
  searchArticles: async (req, res) => {
    try {
      const { keyword } = req.query;
      
      if (!keyword || keyword.trim() === '') {
        return res.status(400).json({ message: '搜索关键词不能为空' });
      }
      
      const articles = await Article.search(keyword.trim());
      
      res.json({
        message: '搜索成功',
        articles,
        count: articles.length
      });
    } catch (error) {
      console.error('Search articles error:', error);
      res.status(500).json({ message: '搜索文章时发生错误' });
    }
  },

  // 根据分类获取文章
  getArticlesByCategory: async (req, res) => {
    try {
      const { categoryId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      // 验证参数
      if (!categoryId || isNaN(parseInt(categoryId))) {
        return res.status(400).json({ message: '分类ID无效' });
      }
      
      if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({ message: '页码和每页数量参数无效' });
      }
      
      const result = await Article.findByCategory(categoryId, page, limit);
      
      res.json({
        message: '获取分类文章成功',
        ...result
      });
    } catch (error) {
      console.error('Get articles by category error:', error);
      res.status(500).json({ message: '获取分类文章时发生错误' });
    }
  },
  
  // 获取热门文章
  getPopularArticles: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      
      // 验证参数范围
      if (limit < 1 || limit > 100) {
        return res.status(400).json({ message: '数量限制参数无效' });
      }
      
      const articles = await Article.findPopular(limit);
      
      res.json({
        message: '获取热门文章成功',
        articles
      });
    } catch (error) {
      console.error('Get popular articles error:', error);
      res.status(500).json({ message: '获取热门文章时发生错误' });
    }
  }
};

module.exports = articleController;