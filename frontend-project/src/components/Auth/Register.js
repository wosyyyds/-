import React, { useState } from 'react';
import { userAPI } from '../../services/api';
import Message from '../Common/Message';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setMessage({ text: '密码确认不一致', type: 'error' });
      return;
    }
    
    setLoading(true);
    
    try {
      await userAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      
      setMessage({ 
        text: '注册成功！请登录', 
        type: 'success' 
      });
      
      // 清空表单
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      
      // 3秒后跳转到登录页
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.message || '注册失败', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>用户注册</h2>
      {message.text && (
        <Message type={message.type} text={message.text} />
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>姓名:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>邮箱:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>密码:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>确认密码:</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px' 
          }}
        >
          {loading ? '注册中...' : '注册'}
        </button>
      </form>
      <p style={{ marginTop: '15px' }}>
        已有账号？ <a href="/login">立即登录</a>
      </p>
    </div>
  );
};

export default Register;