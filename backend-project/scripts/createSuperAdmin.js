const User = require('../models/userModel');
const { promisePool } = require('../config/database');
const bcrypt = require('bcryptjs');

// 创建超级管理员账号
const createSuperAdmin = async () => {
  try {
    // 检查是否已存在超级管理员
    const checkQuery = "SELECT id FROM users WHERE role = 'super_admin' LIMIT 1";
    const [rows] = await promisePool.execute(checkQuery);
    
    if (rows.length > 0) {
      console.log('超级管理员账号已存在');
      return;
    }
    
    // 创建超级管理员账号
    const superAdminData = {
      name: 'Super Admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'super_admin'
    };
    
    const hashedPassword = await bcrypt.hash(superAdminData.password, 10);
    
    const insertQuery = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
    const [result] = await promisePool.execute(insertQuery, [
      superAdminData.name,
      superAdminData.email,
      hashedPassword,
      superAdminData.role
    ]);
    
    console.log('超级管理员账号创建成功！');
    console.log('邮箱:', superAdminData.email);
    console.log('密码:', superAdminData.password);
    console.log('请登录后立即修改密码！');
    
  } catch (error) {
    console.error('创建超级管理员账号失败:', error);
  } finally {
    await promisePool.end();
  }
};

createSuperAdmin();