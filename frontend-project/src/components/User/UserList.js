import React, { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import Message from '../Common/Message';
import Loading from '../Common/Loading';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getUsers();
      setUsers(response.data.users);
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.message || '获取用户列表失败', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个用户吗？')) {
      return;
    }
    
    try {
      await userAPI.deleteUser(id);
      setMessage({ text: '用户删除成功', type: 'success' });
      // 重新获取用户列表
      fetchUsers();
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.message || '删除用户失败', 
        type: 'error' 
      });
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>用户列表</h2>
      {message.text && (
        <Message type={message.type} text={message.text} />
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>ID</th>
            <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>姓名</th>
            <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>邮箱</th>
            <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>注册时间</th>
            <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{user.id}</td>
              <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{user.name}</td>
              <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{user.email}</td>
              <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                {new Date(user.created_at).toLocaleDateString()}
              </td>
              <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                <button 
                  onClick={() => handleDelete(user.id)}
                  style={{ 
                    padding: '5px 10px', 
                    backgroundColor: '#dc3545', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  删除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && !loading && (
        <p style={{ textAlign: 'center', marginTop: '20px' }}>暂无用户数据</p>
      )}
    </div>
  );
};

export default UserList;