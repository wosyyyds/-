<template>
  <div class="user-management-container">
    <h2>用户管理</h2>
    
    <Message v-if="message.text" :type="message.type" :text="message.text" />
    
    <div v-if="loading" class="loading">
      <Loading />
    </div>
    
    <div v-else>
      <!-- 搜索框 -->
      <div class="search-section">
        <input 
          v-model="searchKeyword" 
          @keyup.enter="searchUsers" 
          placeholder="搜索用户..." 
          class="search-input"
        />
        <button @click="searchUsers" class="search-btn">搜索</button>
        <button @click="loadAllUsers" class="refresh-btn">刷新</button>
      </div>
      
      <!-- 用户列表 -->
      <div v-if="users.length > 0" class="users-list">
        <div v-for="user in users" :key="user.id" class="user-item">
          <div class="user-info">
            <h4 class="user-name">{{ user.name }}</h4>
            <p class="user-email">{{ user.email }}</p>
            <div class="user-meta">
              <span class="user-role" :class="user.role">
                {{ getRoleDisplayName(user.role) }}
              </span>
              <span class="user-created">
                注册于: {{ formatDate(user.created_at) }}
              </span>
            </div>
          </div>
          
          <div class="user-actions">
            <!-- 角色选择器（仅超级管理员可见） -->
            <div v-if="authStore.user.role === 'super_admin'" class="role-selector">
              <select 
                :value="user.role" 
                @change="changeUserRole(user.id, $event.target.value)"
                :disabled="user.id === authStore.user.id"
              >
                <option value="user">普通用户</option>
                <option value="admin">管理员</option>
                <option value="super_admin">超级管理员</option>
              </select>
            </div>
            
            <!-- 删除按钮（管理员可见，但不能删除自己或超级管理员） -->
            <button 
              v-if="canDeleteUser(user)" 
              @click="deleteUser(user.id)" 
              class="delete-btn"
            >
              删除
            </button>
          </div>
        </div>
      </div>
      
      <div v-else class="no-users">
        <div class="no-users-icon">👥</div>
        <h3>暂无用户</h3>
        <p>还没有用户注册</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { userAPI } from '../../services/api'
import Message from '../Common/Message.vue'
import Loading from '../Common/Loading.vue'

const authStore = useAuthStore()

const users = ref([])
const loading = ref(true)
const message = reactive({ text: '', type: '' })
const searchKeyword = ref('')

onMounted(() => {
  loadAllUsers()
})

const loadAllUsers = async () => {
  try {
    loading.value = true
    const response = await userAPI.getUsers()
    users.value = response.data.users
  } catch (error) {
    message.text = error.response?.data?.message || '获取用户列表失败'
    message.type = 'error'
  } finally {
    loading.value = false
  }
}

const searchUsers = async () => {
  if (!searchKeyword.value.trim()) {
    loadAllUsers()
    return
  }
  
  try {
    loading.value = true
    const response = await userAPI.searchUsers(searchKeyword.value)
    users.value = response.data.users
  } catch (error) {
    message.text = error.response?.data?.message || '搜索用户失败'
    message.type = 'error'
  } finally {
    loading.value = false
  }
}

const changeUserRole = async (userId, newRole) => {
  if (!confirm(`确定要将此用户的角色更改为${getRoleDisplayName(newRole)}吗？`)) {
    // 重置选择器的值
    const selectElement = event.target
    const user = users.value.find(u => u.id === userId)
    if (user) {
      selectElement.value = user.role
    }
    return
  }
  
  try {
    await userAPI.updateUserRole(userId, { role: newRole })
    message.text = '用户角色更新成功'
    message.type = 'success'
    
    // 更新本地数据
    const user = users.value.find(u => u.id === userId)
    if (user) {
      user.role = newRole
    }
  } catch (error) {
    message.text = error.response?.data?.message || '更新用户角色失败'
    message.type = 'error'
    
    // 重置选择器的值
    const selectElement = event.target
    const user = users.value.find(u => u.id === userId)
    if (user) {
      selectElement.value = user.role
    }
  }
}

const deleteUser = async (userId) => {
  const user = users.value.find(u => u.id === userId)
  if (!user) return
  
  if (!confirm(`确定要删除用户"${user.name}"吗？此操作不可撤销！`)) {
    return
  }
  
  try {
    await userAPI.deleteUser(userId)
    message.text = '用户删除成功'
    message.type = 'success'
    
    // 从列表中移除
    users.value = users.value.filter(u => u.id !== userId)
  } catch (error) {
    message.text = error.response?.data?.message || '删除用户失败'
    message.type = 'error'
  }
}

const canDeleteUser = (user) => {
  // 不能删除自己
  if (user.id === authStore.user.id) return false
  
  // 超级管理员可以删除任何人（除了自己）
  if (authStore.user.role === 'super_admin') return true
  
  // 管理员不能删除超级管理员
  if (user.role === 'super_admin') return false
  
  // 管理员可以删除普通用户
  return authStore.user.role === 'admin' && user.role === 'user'
}

const getRoleDisplayName = (role) => {
  switch (role) {
    case 'super_admin': return '超级管理员'
    case 'admin': return '管理员'
    case 'user': return '普通用户'
    default: return '未知'
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}
</script>

<style scoped>
.user-management-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.search-section {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.search-btn, .refresh-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.search-btn {
  background-color: #007bff;
  color: white;
}

.refresh-btn {
  background-color: #28a745;
  color: white;
}

.users-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.user-item {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-item:hover {
  transform: translateY(-2px);
}

.user-info {
  flex: 1;
}

.user-name {
  color: #333;
  margin: 0 0 8px 0;
  font-size: 1.2rem;
}

.user-email {
  color: #666;
  margin: 0 0 10px 0;
  word-break: break-all;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.user-role {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.user-role.super_admin {
  background-color: #dc3545;
  color: white;
}

.user-role.admin {
  background-color: #ffc107;
  color: #212529;
}

.user-role.user {
  background-color: #17a2b8;
  color: white;
}

.user-created {
  font-size: 0.9rem;
  color: #888;
}

.user-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-left: 15px;
}

.role-selector select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.delete-btn {
  padding: 6px 12px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.delete-btn:hover {
  background-color: #c82333;
}

.delete-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.no-users {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.no-users-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.no-users h3 {
  color: #333;
  margin-bottom: 10px;
}

.no-users p {
  color: #666;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .search-section {
    flex-direction: column;
  }
  
  .users-list {
    grid-template-columns: 1fr;
  }
  
  .user-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .user-actions {
    margin-left: 0;
    margin-top: 15px;
    align-self: flex-end;
  }
}
</style>