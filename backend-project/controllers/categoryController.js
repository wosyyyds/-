const Category = require('../models/categoryModel');

const categoryController = {
  // 获取所有分类
  getAllCategories: async (req, res) => {
    try {
      const categories = await Category.findAll();
      res.json({
        message: '获取分类成功',
        categories
      });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ message: '获取分类时发生错误' });
    }
  },
  
  // 创建分类
  createCategory: async (req, res) => {
    try {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: '分类名称不能为空' });
      }
      
      const categoryId = await Category.create({ name, description });
      const category = await Category.findById(categoryId);
      
      res.status(201).json({
        message: '分类创建成功',
        category
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: '分类名称已存在' });
      }
      console.error('Create category error:', error);
      res.status(500).json({ message: '创建分类时发生错误' });
    }
  },
  
  // 更新分类
  updateCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: '分类名称不能为空' });
      }
      
      const affectedRows = await Category.update(id, { name, description });
      
      if (affectedRows === 0) {
        return res.status(404).json({ message: '分类不存在' });
      }
      
      const category = await Category.findById(id);
      res.json({
        message: '分类更新成功',
        category
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: '分类名称已存在' });
      }
      console.error('Update category error:', error);
      res.status(500).json({ message: '更新分类时发生错误' });
    }
  },
  
  // 删除分类
  deleteCategory: async (req, res) => {
    try {
      const { id } = req.params;
      
      const affectedRows = await Category.delete(id);
      
      if (affectedRows === 0) {
        return res.status(404).json({ message: '分类不存在' });
      }
      
      res.json({ message: '分类删除成功' });
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({ message: '删除分类时发生错误' });
    }
  },
  
  // 为文章添加分类
  addCategoryToArticle: async (req, res) => {
    try {
      const { articleId, categoryId } = req.body;
      
      const affectedRows = await Category.addToArticle(articleId, categoryId);
      
      if (affectedRows === 0) {
        return res.status(400).json({ message: '添加分类失败' });
      }
      
      res.json({ message: '分类添加成功' });
    } catch (error) {
      console.error('Add category to article error:', error);
      res.status(500).json({ message: '添加分类时发生错误' });
    }
  },
  
  // 移除文章的分类
  removeCategoryFromArticle: async (req, res) => {
    try {
      const { articleId, categoryId } = req.body;
      
      const affectedRows = await Category.removeFromArticle(articleId, categoryId);
      
      if (affectedRows === 0) {
        return res.status(400).json({ message: '移除分类失败' });
      }
      
      res.json({ message: '分类移除成功' });
    } catch (error) {
      console.error('Remove category from article error:', error);
      res.status(500).json({ message: '移除分类时发生错误' });
    }
  }
};

module.exports = categoryController;