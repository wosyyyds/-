const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const  { 
    createUserTable,
    createArticleTable, 
    createCategoryTable, 
    createArticleCategoryTable, 
    createCommentTable, 
    createLikeTable, 
    createFavoriteTable,
    createMessageTable,  // 添加私信表
    createGroupTable,    // 添加群组表
    createGroupMemberTable,  // 添加群组成员表
    createGroupMessageTable, // 添加群组消息表
    insertDefaultCategories 
} = require('./config/database');
const userRoutes = require('./routes/userRoutes');
const articleRoutes = require('./routes/articleRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const interactionRoutes = require('./routes/interactionRoutes');
const commentRoutes = require('./routes/commentRoutes');
const messageRoutes = require('./routes/messageRoutes'); // 添加私信路由
const groupRoutes = require('./routes/groupRoutes'); // 添加群组路由
const app = express();
const PORT = process.env.PORT || 3000;

//中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//路由
app.use('/api',userRoutes);
app.use('/api', articleRoutes);
app.use('/api', categoryRoutes);
app.use('/api', interactionRoutes);
app.use('/api', commentRoutes);
app.use('/api', messageRoutes); // 注册私信路由
app.use('/api', groupRoutes); // 注册群组路由

//健康检查端点
app.get('/health',(req,res)=>{
    res.json({message:'Server is running'});
});

//初始化数据库并启动服务器
const startServer = async()=>{
    try{
        await createUserTable();
        await createArticleTable();
        await createCategoryTable();
        await createArticleCategoryTable();
        await createCommentTable();
        await createLikeTable();
        await createFavoriteTable();
        await createMessageTable();  // 创建私信表
        await createGroupTable();    // 创建群组表
        await createGroupMemberTable();  // 创建群组成员表
        await createGroupMessageTable(); // 创建群组消息表

        // 插入默认分类
        await insertDefaultCategories();

        app.listen(PORT, '0.0.0.0', ()=>{
            console.log(`Server is running on port ${PORT}`);
        });
    }catch(error){
        console.error('Failed to start server:',error);
        process.exit(1);
    };

    
}

startServer();