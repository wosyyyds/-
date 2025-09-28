const User = require('../models/userModel');

// 检查用户是否为管理员的中间件
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (!User.isAdmin(req.user)) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  next();
};

// 检查用户是否为超级管理员的中间件
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (!User.isSuperAdmin(req.user)) {
    return res.status(403).json({ message: 'Super admin access required' });
  }
  
  next();
};

module.exports = { requireAdmin, requireSuperAdmin };