const User = require('../models/userModel');
const {generateToken} = require('../middleware/auth');

const userController = {
    //用户注册
    register:async(req,res)=>{
        try{
            const {name,email,password, role='user'}=req.body;

            //验证输入
            if(!name||!email||!password){
                return res.status(400).json({message:'All fields are required'});
            }

            //检查用户是否存在
            const existingUser = await User.findByEmail(email);
            if(existingUser){
                return res.status(400).json({message:'User already exists'});
            }

            //创建用户
            const userId = await User.create({name, email, password, role});

            //获取用户信息（不包含密码）
            const user = await User.findById(userId);

            //生成token
            const token = generateToken(userId);

            res.status(201).json({
                message:'User created successfully',
                user,
                token
            });
        }catch(error){
            console.error('Registration error:',error);
            res.status(500).json({message:'Internal server error'});
        }
    },

    //用户登录
    login:async(req,res)=>{
        try{
            const{email,password}=req.body;

            //验证输入
            if(!email || !password){
                return res.status(400).json({message:'Email and password are required'});
            }

            //查找用户
            const user = await User.findByEmail(email);
            if(!user){
                return res.status(401).json({message:'Invalid credentials'});
            }

            //验证密码
            const isValidPassword = await User.validatePassword(password, user.password);
            if(!isValidPassword){
                return res.status(401).json({message:'Invalid credentials'});
            }

            //生成token
            const token = generateToken(user.id);

            //返回用户信息（不包含密码）
            const userWithoutPassword={
                id:user.id,
                name:user.name,
                email:user.email,
                role:user.role,
                created_at:user.created_at
            };

            res.json({
                message:'Login successful',
                user:userWithoutPassword,
                token
            });
        }catch(error){
            console.error('Login error:',error);
            res.status(500).json({message:'Internal server error'});
        }
    },

    //获取当前用户信息
    getProfile:async(req,res)=>{
        res.json({user:req.user});
    },

    //更新当前用户个人资料
    updateProfile:async(req,res)=>{
        try{
            const userId = req.user.id;
            const {name,email}=req.body;

            //验证输入
            if(!name||!email){
                return res.status(400).json({message:'Name and email are required'});
            }

            //检查邮箱是否被其他用户使用
            const existingUser = await User.findByEmail(email);
            if(existingUser && existingUser.id !== userId){
                return res.status(400).json({message:'Email already in use'});
            }

            const affectedRows = await User.update(userId,{name,email,role:req.user.role});

            if(affectedRows===0){
                return res.status(404).json({message:'User not found'});
            }

            const updatedUser = await User.findById(userId);
            res.json({message:'Profile updated successfully',user: updatedUser});
        }catch(error){
            console.error('Update profile error:',error);
            res.status(500).json({message:'Internal server error'});
        }
    },

    //获取所有的用户
    getAllUsers:async(req,res)=>{
        try{
            // 只有管理员可以获取所有用户列表
            if (!User.isAdmin(req.user)) {
                return res.status(403).json({message:'Admin access required'});
            }
            
            const users = await User.findAll();
            res.json({users});
        }catch(error){
            console.error('Get users error:',error);
            res.status(500).json({message:'Internal server error'});
        }
    },

    // 获取用户列表（供私信功能使用）- 允许普通用户访问
    getUsersForMessaging: async(req,res)=>{
        try{
            // 所有认证用户都可以获取用户列表用于私信功能
            const users = await User.findAll();
            res.json({users});
        }catch(error){
            console.error('Get users for messaging error:',error);
            res.status(500).json({message:'Internal server error'});
        }
    },

    //更新用户信息（需要管理员权限）
    updateUser:async(req,res)=>{
        try{
            // 检查权限
            if (!User.isAdmin(req.user)) {
                return res.status(403).json({message:'Admin access required'});
            }
            
            const {id}=req.params;
            const {name,email,role}=req.body;

            //验证输入
            if(!name||!email){
                return res.status(400).json({message:'Name and email are requied'});
            }

            const affectedRowas = await User.update(id,{name,email,role});

            if(affectedRowas===0){
                return res.status(404).json({message:'User not found'});
            }

            const updateUser = await User.findById(id);
            res.json({message:'User updated successfully',user: updateUser});
        }catch(error){
            console.error('Update user error:',error);
            res.status(500).json({message:'Internal server error'});
        }
    },

    //删除用户（需要管理员权限）
    deleteUser:async(req,res)=>{
        try{
            // 检查权限
            if (!User.isAdmin(req.user)) {
                return res.status(403).json({message:'Admin access required'});
            }
            
            const {id}=req.params;

            // 不能删除自己
            if (req.user.id == id) {
                return res.status(400).json({message:'Cannot delete yourself'});
            }

            const affectedRows = await User.delete(id);

            if(affectedRows===0){
                return res.status(404).json({message:'User not found'});
            }

            res.json({message:'User deleted successfully'});
        }catch(error){
            console.error('Delete user error:',error);
            res.status(500).json({message:'Internal server error'});
        }
    },

    // 搜索用户
    searchUsers:async(req, res)=>{
        try{
            // 检查权限
            if (!User.isAdmin(req.user)) {
                return res.status(403).json({message:'Admin access required'});
            }
            
            const { keyword } =req.query;
            
            //验证输入
            if(!keyword || keyword.trim()===''){
                return res.status(400).json({ message:'搜索关键词不能为空'})
            }

            //搜索用户
            const users = await User.search(keyword.trim());

            res.json({
                message:'搜索成功',
                users,
                count:users.length
            });
        }catch(error){
            console.error('Search users error:',error);
            res.status(500).json({ message:'搜索用户时发生错误'});
        }
    },
    
    // 更新用户权限（仅超级管理员）
    updateUserRole:async(req,res)=>{
        try{
            // 检查权限
            if (!User.isSuperAdmin(req.user)) {
                return res.status(403).json({message:'Super admin access required'});
            }
            
            const {id}=req.params;
            const {role}=req.body;

            //验证输入
            if(!role || !['user', 'admin', 'super_admin'].includes(role)){
                return res.status(400).json({message:'Invalid role'});
            }

            // 不能更改自己的角色
            if (req.user.id == id) {
                return res.status(400).json({message:'Cannot change your own role'});
            }

            const affectedRows = await User.update(id,{role});

            if(affectedRows===0){
                return res.status(404).json({message:'User not found'});
            }

            const updatedUser = await User.findById(id);
            res.json({message:'User role updated successfully',user: updatedUser});
        }catch(error){
            console.error('Update user role error:',error);
            res.status(500).json({message:'Internal server error'});
        }
    }
};

module.exports = userController;
    
 