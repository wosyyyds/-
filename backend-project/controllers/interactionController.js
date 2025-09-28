const Interaction = require('../models/interactionModel');

const interactionController = {
  // 点赞文章
  likeArticle: async (req, res) => {
    try {
      const { articleId } = req.params;
      const userId = req.user.id;
      
      const affectedRows = await Interaction.likeArticle(articleId, userId);
      
      if (affectedRows === 0) {
        return res.json({ message: '已经点赞过了', liked: true });
      }
      
      const likeCount = await Interaction.getLikeCount(articleId);
      res.json({
        message: '点赞成功',
        liked: true,
        likeCount
      });
    } catch (error) {
      console.error('Like article error:', error);
      res.status(500).json({ message: '点赞时发生错误' });
    }
  },
  
  // 取消点赞
  unlikeArticle: async (req, res) => {
    try {
      const { articleId } = req.params;
      const userId = req.user.id;
      
      const affectedRows = await Interaction.unlikeArticle(articleId, userId);
      
      if (affectedRows === 0) {
        return res.json({ message: '尚未点赞', liked: false });
      }
      
      const likeCount = await Interaction.getLikeCount(articleId);
      res.json({
        message: '取消点赞成功',
        liked: false,
        likeCount
      });
    } catch (error) {
      console.error('Unlike article error:', error);
      res.status(500).json({ message: '取消点赞时发生错误' });
    }
  },
  
  // 收藏文章
  favoriteArticle: async (req, res) => {
    try {
      const { articleId } = req.params;
      const userId = req.user.id;
      
      const affectedRows = await Interaction.favoriteArticle(articleId, userId);
      
      if (affectedRows === 0) {
        return res.json({ message: '已经收藏过了', favorited: true });
      }
      
      const favoriteCount = await Interaction.getFavoriteCount(articleId);
      res.json({
        message: '收藏成功',
        favorited: true,
        favoriteCount
      });
    } catch (error) {
      console.error('Favorite article error:', error);
      res.status(500).json({ message: '收藏时发生错误' });
    }
  },
  
  // 取消收藏
  unfavoriteArticle: async (req, res) => {
    try {
      const { articleId } = req.params;
      const userId = req.user.id;
      
      const affectedRows = await Interaction.unfavoriteArticle(articleId, userId);
      
      if (affectedRows === 0) {
        return res.json({ message: '尚未收藏', favorited: false });
      }
      
      const favoriteCount = await Interaction.getFavoriteCount(articleId);
      res.json({
        message: '取消收藏成功',
        favorited: false,
        favoriteCount
      });
    } catch (error) {
      console.error('Unfavorite article error:', error);
      res.status(500).json({ message: '取消收藏时发生错误' });
    }
  },
  
  // 检查用户互动状态
  checkUserInteraction: async (req, res) => {
    try {
      const { articleId } = req.params;
      const userId = req.user.id;
      
      const [liked, favorited] = await Promise.all([
        Interaction.hasLiked(articleId, userId),
        Interaction.hasFavorited(articleId, userId)
      ]);
      
      res.json({
        liked,
        favorited
      });
    } catch (error) {
      console.error('Check interaction error:', error);
      res.status(500).json({ message: '检查互动状态时发生错误' });
    }
  },
  
  // 获取用户点赞列表
  getUserLikes: async (req, res) => {
    try {
      const userId = req.params.userId || req.user.id;
      const likes = await Interaction.getUserLikes(userId);
      
      res.json({
        message: '获取点赞列表成功',
        likes
      });
    } catch (error) {
      console.error('Get user likes error:', error);
      res.status(500).json({ message: '获取点赞列表时发生错误' });
    }
  },
  
  // 获取用户收藏列表
  getUserFavorites: async (req, res) => {
    try {
      const userId = req.params.userId || req.user.id;
      const favorites = await Interaction.getUserFavorites(userId);
      
      res.json({
        message: '获取收藏列表成功',
        favorites
      });
    } catch (error) {
      console.error('Get user favorites error:', error);
      res.status(500).json({ message: '获取收藏列表时发生错误' });
    }
  }
};

module.exports = interactionController;