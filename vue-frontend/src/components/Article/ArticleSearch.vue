<template>
  <div class="search-container">
    <div class="search-header">
      <h2>文章搜索</h2>
      <router-link to="/articles" class="back-btn">
        ← 返回文章列表
      </router-link>
    </div>

    <div class="search-form">
      <div class="search-box">
        <input 
          v-model="searchKeyword" 
          @keyup.enter="handleSearch"
          placeholder="搜索文章标题或内容..."
          class="search-input"
          ref="searchInput"
        />
        <button @click="handleSearch" class="search-btn" :disabled="!searchKeyword.trim()">
          🔍 搜索
        </button>
      </div>
      
      <div class="search-tips">
        <p>💡 搜索技巧：输入关键词搜索文章标题和内容</p>
      </div>
    </div>

    <Message v-if="message.text" :type="message.type" :text="message.text" />

    <div v-if="loading" class="loading">
      <Loading />
    </div>

    <div v-else-if="hasSearched">
      <div class="search-results-header">
        <h3>搜索结果</h3>
        <span class="results-count">
          找到 {{ searchResults.length }} 篇相关文章
        </span>
      </div>

      <div v-if="searchResults.length > 0" class="search-results">
        <div v-for="article in searchResults" :key="article.id" class="result-item">
          <h4 class="result-title">
            <router-link :to="`/articles/${article.id}`" v-html="highlightKeyword(article.title)">
            </router-link>
          </h4>
          <p class="result-content" v-html="highlightKeyword(truncateContent(article.content))"></p>
          <div class="result-meta">
            <span class="author">作者: {{ article.author_name }}</span>
            <span class="date">发布于: {{ formatDate(article.created_at) }}</span>
          </div>
        </div>
      </div>

      <div v-else class="no-results">
        <div class="no-results-icon">🔍</div>
        <h3>没有找到相关文章</h3>
        <p>尝试使用不同的关键词或检查拼写</p>
        <button @click="clearSearch" class="clear-btn">清空搜索</button>
      </div>
    </div>

    <div v-else class="search-welcome">
      <div class="welcome-icon">📚</div>
      <h3>开始搜索文章</h3>
      <p>在上面的搜索框中输入关键词，找到您感兴趣的文章</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { articleAPI } from '../../services/api'
import Message from '../Common/Message.vue'
import Loading from '../Common/Loading.vue'

const route = useRoute()
const searchKeyword = ref('')
const searchResults = ref([])
const loading = ref(false)
const hasSearched = ref(false)
const message = reactive({ text: '', type: '' })
const searchInput = ref(null)

onMounted(() => {
  // 如果URL中有搜索关键词，自动搜索
  const urlKeyword = route.query.keyword
  if (urlKeyword) {
    searchKeyword.value = urlKeyword
    handleSearch()
  }
  
  // 聚焦到搜索框
  if (searchInput.value) {
    searchInput.value.focus()
  }
})

const handleSearch = async () => {
  const keyword = searchKeyword.value.trim()
  if (!keyword) {
    message.text = '请输入搜索关键词'
    message.type = 'warning'
    return
  }

  try {
    loading.value = true
    message.text = ''
    
    const response = await articleAPI.search(keyword)
    searchResults.value = response.data.articles

    console.log(response.data)
    hasSearched.value = true
    
    if (searchResults.value.length === 0) {
      message.text = `没有找到包含 "${keyword}" 的文章`
      message.type = 'info'
    }
  } catch (error) {
    message.text = error.response?.data?.message || '搜索失败'
    message.type = 'error'
  } finally {
    loading.value = false
  }
}

const clearSearch = () => {
  searchKeyword.value = ''
  searchResults.value = []
  hasSearched.value = false
  message.text = ''
  if (searchInput.value) {
    searchInput.value.focus()
  }
}

const truncateContent = (content) => {
  return content.length > 200 ? content.substring(0, 200) + '...' : content
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

const highlightKeyword = (text) => {
  if (!searchKeyword.value.trim()) return text
  
  const keyword = searchKeyword.value.trim()
  const regex = new RegExp(`(${keyword})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}
</script>

<style scoped>
.search-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.back-btn {
  padding: 8px 16px;
  background-color: #6c757d;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background-color: #5a6268;
}

.search-form {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.search-box {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.search-input {
  flex: 1;
  padding: 15px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
}

.search-btn {
  padding: 15px 25px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.search-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.search-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.search-tips {
  color: #6c757d;
  font-size: 0.9rem;
}

.search-results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.results-count {
  color: #6c757d;
  font-size: 0.9rem;
}

.search-results {
  space-y: 20px;
}

.result-item {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.result-title {
  margin: 0 0 10px 0;
  font-size: 1.2rem;
}

.result-title a {
  color: #007bff;
  text-decoration: none;
}

.result-title a:hover {
  text-decoration: underline;
}

.result-content {
  color: #666;
  line-height: 1.6;
  margin-bottom: 15px;
}

.result-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #888;
}

.no-results, .search-welcome {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.no-results-icon, .welcome-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.no-results h3, .search-welcome h3 {
  color: #333;
  margin-bottom: 10px;
}

.no-results p, .search-welcome p {
  color: #666;
  margin-bottom: 20px;
}

.clear-btn {
  padding: 10px 20px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.clear-btn:hover {
  background-color: #218838;
}

:deep(mark) {
  background-color: #fff3cd;
  padding: 2px 4px;
  border-radius: 2px;
  font-weight: bold;
}

@media (max-width: 768px) {
  .search-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .search-box {
    flex-direction: column;
  }
  
  .result-meta {
    flex-direction: column;
    gap: 5px;
  }
}
</style>