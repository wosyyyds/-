import axios from 'axios'

const API_BASE_URL = 'http://192.168.1.15:3000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加token到请求头
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理token过期等情况
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 用户相关API
export const userAPI = {
  register: (userData) => api.post('/register', userData),
  login: (credentials) => api.post('/login', credentials),
  getProfile: () => api.get('/profile'),
  updateProfile: (userData) => api.put('/profile', userData),
  getUsers: () => api.get('/users'),
  getUsersForMessaging: () => api.get('/users/messaging'), // 添加用于私信功能的用户列表获取方法
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  searchUsers:(keyword)=>api.get(`/users/search?keyword=${encodeURIComponent(keyword)}`),
  updateUserRole: (id, roleData) => api.put(`/users/${id}/role`, roleData) // 添加更新用户角色的API
};

// 在userAPI后添加articleAPI
export const articleAPI = {
  create: (articleData) => api.post('/articles', articleData),
  getAll: (page = 1, limit = 10) => api.get(`/articles?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/articles/${id}`),
  getByUser: (userId) => api.get(`/articles/user/${userId || ''}`),
  getByCategory: (categoryId, page = 1, limit = 10) => api.get(`/articles/category/${categoryId}?page=${page}&limit=${limit}`),
  getPopular: (limit = 10) => api.get(`/articles/popular?limit=${limit}`),
  update: (id, articleData) => api.put(`/articles/${id}`, articleData),
  delete: (id) => api.delete(`/articles/${id}`),
  search: (keyword) => api.get(`/articles/search?keyword=${encodeURIComponent(keyword)}`)
};

// 评论相关API
export const commentAPI = {
  create: (commentData) => api.post('/comments', commentData),
  getByArticle: (articleId) => api.get(`/comments/article/${articleId}`),
  update: (id, content) => api.put(`/comments/${id}`, { content }),
  delete: (id) => api.delete(`/comments/${id}`),
  getUserComments: (userId) => api.get(`/comments/user/${userId || ''}`)
};

// 分类相关API
export const categoryAPI = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (categoryData) => api.post('/categories', categoryData),
  update: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  delete: (id) => api.delete(`/categories/${id}`)
};

// 互动相关API
export const interactionAPI = {
  like: (articleId) => api.post(`/interactions/like/${articleId}`),
  unlike: (articleId) => api.delete(`/interactions/like/${articleId}`),
  favorite: (articleId) => api.post(`/interactions/favorite/${articleId}`),
  unfavorite: (articleId) => api.delete(`/interactions/favorite/${articleId}`),
  checkInteraction: (articleId) => api.get(`/interactions/check/${articleId}`),
  getUserLikes: (userId) => api.get(`/interactions/likes/user/${userId || ''}`),
  getUserFavorites: (userId) => api.get(`/interactions/favorites/user/${userId || ''}`)
};

// 私信相关API
export const messageAPI = {
  send: (messageData) => api.post('/messages', messageData),
  getReceived: (page = 1, limit = 20) => api.get(`/messages/received?page=${page}&limit=${limit}`),
  getSent: (page = 1, limit = 20) => api.get(`/messages/sent?page=${page}&limit=${limit}`),
  getConversation: (userId, page = 1, limit = 20) => api.get(`/messages/conversation/${userId}?page=${page}&limit=${limit}`),
  getUnreadCount: () => api.get('/messages/unread-count'),
  markAsRead: (messageId) => api.put(`/messages/${messageId}/read`),
  delete: (messageId) => api.delete(`/messages/${messageId}`)
};

// 群组相关API
export const groupAPI = {
  create: (groupData) => api.post('/groups', groupData),
  getUserGroups: () => api.get('/groups'),
  searchGroups: (keyword) => api.get(`/groups/search?keyword=${encodeURIComponent(keyword)}`),
  getGroupDetails: (groupId) => api.get(`/groups/${groupId}`),
  updateGroup: (groupId, groupData) => api.put(`/groups/${groupId}`, groupData),
  deleteGroup: (groupId) => api.delete(`/groups/${groupId}`),
  addMember: (groupId, userId) => api.post(`/groups/${groupId}/members`, { userId }),
  removeMember: (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}`),
  sendMessage: (groupId, messageData) => api.post(`/groups/${groupId}/messages`, messageData),
  getMessages: (groupId, page = 1, limit = 50) => api.get(`/groups/${groupId}/messages?page=${page}&limit=${limit}`)
};

export default api