const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET;

// 验证JWT token的中间件
const authenticateToken = async(req, res, next)=>{
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if(!token){
        return res.status(401).json({message:'Access token required'});
    }

    try{
        const decoded = jwt.verify(token,JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if(!user){
            return res.status(401).json({message:'Invalid token'});
        }

        req.user = user;
        next();
    }catch(error){
        return res.status(403).json({message:'Invalid or expired token'});
    }
};

// 生成JWT token
const generateToken = (userId)=>{
    return jwt.sign({userId},JWT_SECRET,{expiresIn:'24h'});
};

module.exports = {authenticateToken,generateToken};