const Comment = require('../models/commentModel');

const commentController = {
  // 创建评论
  createComment: async (req, res) => {
    try {
      const { content, article_id, parent_id } = req.body;
      const user_id = req.user.id;
      
      if (!content || !article_id) {
        return res.status(400).json({ message: '评论内容和文章ID不能为空' });
      }
      
      const commentId = await Comment.create({ content, article_id, user_id, parent_id });
      const comment = await Comment.findById(commentId);
      
      res.status(201).json({
        message: '评论发布成功',
        comment
      });
    } catch (error) {
      console.error('Create comment error:', error);
      res.status(500).json({ message: '发布评论时发生错误' });
    }
  },
  
  // 获取文章评论
  getArticleComments: async (req, res) => {
    try {
      const { articleId } = req.params;
      const comments = await Comment.findByArticle(articleId);
      
      // 获取每个评论的回复
      const commentsWithReplies = await Promise.all(
        comments.map(async (comment) => {
          const replies = await Comment.findReplies(comment.id);
          return { ...comment, replies };
        })
      );
      
      res.json({
        message: '获取评论成功',
        comments: commentsWithReplies
      });
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({ message: '获取评论时发生错误' });
    }
  },
  
  // 更新评论
  updateComment: async (req, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const user_id = req.user.id;
      
      if (!content) {
        return res.status(400).json({ message: '评论内容不能为空' });
      }
      
      // 检查评论是否存在且属于当前用户
      const existingComment = await Comment.findById(id);
      if (!existingComment) {
        return res.status(404).json({ message: '评论不存在' });
      }
      
      if (existingComment.user_id !== user_id) {
        return res.status(403).json({ message: '无权修改此评论' });
      }
      
      const affectedRows = await Comment.update(id, content);
      
      if (affectedRows === 0) {
        return res.status(404).json({ message: '评论更新失败' });
      }
      
      const updatedComment = await Comment.findById(id);
      res.json({
        message: '评论更新成功',
        comment: updatedComment
      });
    } catch (error) {
      console.error('Update comment error:', error);
      res.status(500).json({ message: '更新评论时发生错误' });
    }
  },
  
  // 删除评论
  deleteComment: async (req, res) => {
    try {
      const { id } = req.params;
      const user_id = req.user.id;
      
      // 检查评论是否存在且属于当前用户
      const existingComment = await Comment.findById(id);
      if (!existingComment) {
        return res.status(404).json({ message: '评论不存在' });
      }
      
      if (existingComment.user_id !== user_id) {
        return res.status(403).json({ message: '无权删除此评论' });
      }
      
      const affectedRows = await Comment.delete(id);
      
      if (affectedRows === 0) {
        return res.status(404).json({ message: '评论删除失败' });
      }
      
      res.json({ message: '评论删除成功' });
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({ message: '删除评论时发生错误' });
    }
  },
  
  // 获取用户评论
  getUserComments: async (req, res) => {
    try {
      const userId = req.params.userId || req.user.id;
      const comments = await Comment.findByUser(userId);
      
      res.json({
        message: '获取用户评论成功',
        comments
      });
    } catch (error) {
      console.error('Get user comments error:', error);
      res.status(500).json({ message: '获取用户评论时发生错误' });
    }
  }
};

module.exports = commentController;