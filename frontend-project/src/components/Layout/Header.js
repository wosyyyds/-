import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <header style={{ 
      backgroundColor: '#343a40', 
      color: 'white', 
      padding: '1rem', 
      display: 'flex', 
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <h1 style={{ margin: 0 }}>用户管理系统</h1>
      <nav>
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span>欢迎, {user?.name}</span>
            <a href="/" style={{ color: 'white', textDecoration: 'none' }}>首页</a>
            <a href="/users" style={{ color: 'white', textDecoration: 'none' }}>用户列表</a>
            <button 
              onClick={handleLogout}
              style={{ 
                padding: '5px 10px', 
                backgroundColor: '#dc3545', 
                color: 'white', 
                border: 'none', 
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              退出
            </button>
          </div>
        ) : (
          <div>
            <a href="/login" style={{ color: 'white', textDecoration: 'none', marginRight: '1rem' }}>登录</a>
            <a href="/register" style={{ color: 'white', textDecoration: 'none' }}>注册</a>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;