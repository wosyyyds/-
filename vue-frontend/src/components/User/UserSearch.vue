<template>
  <div class="user-search-container">
    <div class="search-header">
      <h2>用户搜索</h2>
      <div class="search-box">
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="输入姓名或邮箱进行搜索..."
          @keyup.enter="handleSearch"
          class="search-input"
        />
        <button @click="handleSearch" :disabled="loading" class="search-btn">
          {{ loading ? '搜索中...' : '搜索' }}
        </button>
        <button 
          v-if="searchResults.length > 0" 
          @click="clearSearch" 
          class="clear-btn"
        >
          清除搜索
        </button>
      </div>
    </div>

    <Message v-if="message.text" :type="message.type" :text="message.text" />

    <div v-if="loading" class="loading">
      <Loading />
    </div>

    <div v-else>
      <div v-if="searchResults.length > 0" class="search-results">
        <h3>搜索结果 ({{ searchResults.length }} 条)</h3>
        <table class="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>姓名</th>
              <th>邮箱</th>
              <th>注册时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in searchResults" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>{{ formatDate(user.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="hasSearched" class="no-results">
        <p>没有找到匹配的用户</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { userAPI } from '../../services/api'
import Message from '../Common/Message.vue'
import Loading from '../Common/Loading.vue'

const searchKeyword = ref('')
const searchResults = ref([])
const loading = ref(false)
const hasSearched = ref(false)
const message = reactive({ text: '', type: '' })

const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    message.text = '请输入搜索关键词'
    message.type = 'error'
    return
  }

  loading.value = true
  message.text = ''

  try {
    const response = await userAPI.searchUsers(searchKeyword.value.trim())
    searchResults.value = response.data.users
    hasSearched.value = true
    
    if (response.data.count === 0) {
      message.text = '没有找到匹配的用户'
      message.type = 'info'
    } else {
      message.text = `找到 ${response.data.count} 个匹配的用户`
      message.type = 'success'
    }
  } catch (error) {
    message.text = error.response?.data?.message || '搜索失败'
    message.type = 'error'
    searchResults.value = []
  } finally {
    loading.value = false
  }
}

const clearSearch = () => {
  searchKeyword.value = ''
  searchResults.value = []
  hasSearched.value = false
  message.text = ''
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}
</script>

<style scoped>
.user-search-container {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.search-box {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.search-input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 250px;
  font-size: 14px;
}

.search-btn, .clear-btn {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.search-btn {
  background-color: #007bff;
  color: white;
}

.search-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.clear-btn {
  background-color: #6c757d;
  color: white;
}

.clear-btn:hover {
  background-color: #5a6268;
}

.search-results {
  margin-top: 20px;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
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

.no-results {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

.loading {
  text-align: center;
  padding: 40px;
}

@media (max-width: 768px) {
  .search-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    justify-content: center;
  }
  
  .search-input {
    min-width: 200px;
  }
}
</style>