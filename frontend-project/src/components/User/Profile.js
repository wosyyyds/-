import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Loading from '../Common/Loading';
import Message from '../Common/Message';

const Profile = () => {
  const { user, token } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setProfileData(response.data.user);
      setFormData({
        name: response.data.user.name,
        email: response.data.user.email
      });
    } catch (err) {
      setError(err.response?.data?.message || '获取用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await api.put('/users/profile', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setProfileData(response.data.user);
      setSuccess('个人信息更新成功！');
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profileData.name,
      email: profileData.email
    });
    setIsEditing(false);
    setError('');
  };

  if (loading && !profileData) {
    return <Loading />;
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>个人资料</h2>
        
        {error && <Message type="error" message={error} />}
        {success && <Message type="success" message={success} />}

        {!isEditing ? (
          <div className="profile-view">
            <div className="profile-field">
              <label>用户名：</label>
              <span>{profileData?.name}</span>
            </div>
            <div className="profile-field">
              <label>邮箱：</label>
              <span>{profileData?.email}</span>
            </div>
            <div className="profile-field">
              <label>注册时间：</label>
              <span>{profileData?.created_at ? new Date(profileData.created_at).toLocaleString() : '未知'}</span>
            </div>
            <div className="profile-actions">
              <button 
                type="button" 
                onClick={() => setIsEditing(true)}
                className="btn btn-primary"
              >
                编辑资料
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="name">用户名：</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">邮箱：</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? '保存中...' : '保存'}
              </button>
              <button 
                type="button" 
                onClick={handleCancel}
                className="btn btn-secondary"
                disabled={loading}
              >
                取消
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;