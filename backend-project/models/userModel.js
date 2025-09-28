const { promisePool } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = {
    //创建用户
    create:async(userData)=>{
        const {name,email,password, role = 'user'} =userData;
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = 'INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)';
        const [result] = await promisePool.execute(query, [name, email, hashedPassword, role]);

        return result.insertId;
    },

    //通过邮箱查找用户
    findByEmail:async(email)=>{
        const query = 'SELECT * FROM users WHERE email = ?';
        const [rows] = await promisePool.execute(query,[email]);
        return rows[0];
    },

    // 通过ID查找用户
    findById:async(id)=>{
        const query = 'SELECT id, name, email, role, created_at FROM users WHERE id = ?';
        const [rows] = await promisePool.execute(query,[id]);
        return rows[0];
    },

    // 获取所有用户（不返回密码）
    findAll:async()=>{
        const query = 'SELECT id, name, email, role, created_at FROM users';
        const [rows] = await promisePool.execute(query);
        return rows;
    },

    //更新用户信息
    update:async(id,userData)=>{
        const {name,email,role}=userData;
        let query, params;
        
        // 根据提供的参数动态构建查询
        if (name !== undefined && email !== undefined && role !== undefined) {
            // 更新所有字段
            query='UPDATE users SET name =?, email = ?, role = ? WHERE id = ?';
            params = [name, email, role, id];
        } else if (name !== undefined && email !== undefined) {
            // 只更新name和email
            query='UPDATE users SET name =?, email = ? WHERE id = ?';
            params = [name, email, id];
        } else if (role !== undefined) {
            // 只更新role
            query='UPDATE users SET role = ? WHERE id = ?';
            params = [role, id];
        } else {
            // 没有提供有效的更新字段
            return 0;
        }
        
        const [result] =await promisePool.execute(query, params);
        return result.affectedRows;
    },

    // 删除用户
    delete:async(id)=>{
        const query = 'DELETE FROM users WHERE id =?';
        const [result] = await promisePool.execute(query,[id]);
        return result.affectedRows;
    },

    // 验证密码
    validatePassword:async (plainPassword, hashedPassword)=>{
        return await bcrypt.compare(plainPassword,hashedPassword);
    },

    search:async(keyword)=>{
        const query=`
        SELECT id, name, email, role, created_at
        FROM users
        WHERE name LIKE ? OR email LIKE ?
        ORDER BY created_at DESC;
        `;
        const seachPattern = `%${keyword}%`;
        const [rows] = await promisePool.execute(query, [seachPattern, seachPattern]);
        return rows;
    },
    
    // 检查用户是否为管理员
    isAdmin: (user) => {
        return user && (user.role === 'admin' || user.role === 'super_admin');
    },
    
    // 检查用户是否为超级管理员
    isSuperAdmin: (user) => {
        return user && user.role === 'super_admin';
    }
};

module.exports = User;