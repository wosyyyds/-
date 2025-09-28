<template>
  <div class="user-list-container">
    <h2>用户列表</h2>
    <router-link to="/users/search" class="search-link">
        🔍 搜索用户
      </router-link>
    <Message v-if="message.text" :type="message.type" :text="message.text" />
    
    <div v-if="loading" class="loading">
      <Loading />
    </div>
    
    <table v-else class="user-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>姓名</th>
          <th>邮箱</th>
          <th>注册时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.id }}</td>
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
          <td>{{ formatDate(user.created_at) }}</td>
          <td>
            <button 
              @click="handleDelete(user.id)"
              class="delete-btn"
            >
              删除
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    
    <p v-if="!loading && users.length === 0" class="no-data">
      暂无用户数据
    </p>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { userAPI } from '../../services/api'
import Message from '../Common/Message.vue'
import Loading from '../Common/Loading.vue'

const users = ref([])
const loading = ref(true)
const message = reactive({ text: '', type: '' })

onMounted(() => {
  fetchUsers()
})

const fetchUsers = async () => {
  try {
    const response = await userAPI.getUsers()
    users.value = response.data.users
  } catch (error) {
    message.text = error.response?.data?.message || '获取用户列表失败'
    message.type = 'error'
  } finally {
    loading.value = false
  }
}

const handleDelete = async (id) => {
  if (!confirm('确定要删除这个用户吗？')) {
    return
  }
  
  try {
    await userAPI.deleteUser(id)
    message.text = '用户删除成功'
    message.type = 'success'
    // 重新获取用户列表
    fetchUsers()
  } catch (error) {
    message.text = error.response?.data?.message || '删除用户失败'
    message.type = 'error'
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}
</script>

<style scoped>
.user-list-container {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.loading {
  text-align: center;
  padding: 40px;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.user-table th,
.user-table td {
  padding: 12px;
  border: 1px solid #dee2e6;
  text-align: left;
}

.user-table th {
  background-color: #f8f9fa;
  font-weight: bold;
}

.delete-btn {
  padding: 5px 10px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.delete-btn:hover {
  background-color: #c82333;
}

.no-data {
  text-align: center;
  margin-top: 20px;
  color: #6c757d;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.search-link {
  padding: 8px 16px;
  background-color: #28a745;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-size: 14px;
}

.search-link:hover {
  background-color: #218838;
  text-decoration: none;
}

@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-link {
    text-align: center;
  }
}
</style>