<template>
  <div class="article-list-container">
    <div class="list-header">
      <h2>文章列表</h2>
      <router-link to="/articles/create" class="create-btn">
        ✏️ 写文章
      </router-link>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="filters-section">
      <div class="search-box">
        <input 
          v-model="searchKeyword" 
          @keyup.enter="handleSearch"
          placeholder="搜索文章标题或内容..."
          class="search-input"
        />
        <button @click="handleSearch" class="search-btn">🔍</button>
      </div>
      
      <div class="filter-tabs">
        <button 
          @click="setActiveTab('all')"
          :class="{ active: activeTab === 'all' }"
          class="tab-btn"
        >
          全部文章
        </button>
        <button 
          @click="setActiveTab('popular')"
          :class="{ active: activeTab === 'popular' }"
          class="tab-btn"
        >
          热门文章
        </button>
        <button 
          @click="setActiveTab('category')"
          :class="{ active: activeTab === 'category' }"
          class="tab-btn"
        >
          分类浏览
        </button>
      </div>
      
      <!-- 分类选择 -->
      <div v-if="activeTab === 'category'" class="category-filters">
        <select v-model="selectedCategory" @change="handleCategoryChange" class="category-select">
          <option value="">选择分类</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
      </div>
    </div>

    <Message v-if="message.text" :type="message.type" :text="message.text" />

    <div v-if="loading" class="loading">
      <Loading />
    </div>

    <div v-else>
      <div v-if="articles.length > 0" class="articles-grid">
        <div v-for="article in articles" :key="article.id" class="article-card">
          <h3 class="article-title">
            <router-link :to="`/articles/${article.id}`">
              {{ article.title }}
            </router-link>
          </h3>
          <p class="article-content">{{ truncateContent(article.content) }}</p>
          <div class="article-meta">
            <span class="author">作者: {{ article.author_name }}</span>
            <span class="date">发布于: {{ formatDate(article.created_at) }}</span>
          </div>
          <div v-if="article.author_id === authStore.user?.id" class="article-actions">
            <router-link 
              :to="`/articles/edit/${article.id}`" 
              class="edit-btn"
            >
              编辑
            </router-link>
            <button 
              @click="handleDelete(article.id)" 
              class="delete-btn"
            >
              删除
            </button>
          </div>
        </div>
      </div>

      <div v-else class="no-articles">
        <p>暂无文章</p>
        <router-link to="/articles/create" class="create-link">
          开始写第一篇文章
        </router-link>
      </div>
      
      <!-- 分页控件 -->
      <div v-if="pagination.totalPages > 1" class="pagination">
        <button 
          @click="changePage(pagination.page - 1)" 
          :disabled="pagination.page <= 1"
          class="page-btn"
        >
          上一页
        </button>
        
        <span class="page-info">
          第 {{ pagination.page }} 页 / 共 {{ pagination.totalPages }} 页
          （共 {{ pagination.total }} 篇文章）
        </span>
        
        <button 
          @click="changePage(pagination.page + 1)" 
          :disabled="pagination.page >= pagination.totalPages"
          class="page-btn"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { articleAPI, categoryAPI } from '../../services/api'
import Message from '../Common/Message.vue'
import Loading from '../Common/Loading.vue'

const authStore = useAuthStore()
const articles = ref([])
const loading = ref(true)
const message = reactive({ text: '', type: '' })
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
})

// 搜索和筛选状态
const searchKeyword = ref('')
const activeTab = ref('all')
const selectedCategory = ref('')
const categories = ref([])
const isSearching = ref(false)

onMounted(() => {
  fetchArticles()
  fetchCategories()
})

const fetchArticles = async () => {
  try {
    loading.value = true
    let response
    
    if (isSearching.value && searchKeyword.value.trim()) {
      // 搜索模式
      response = await articleAPI.search(searchKeyword.value.trim())
      articles.value = response.data
      pagination.total = response.data.length
      pagination.totalPages = 1
    } else if (activeTab.value === 'popular') {
      // 热门文章
      response = await articleAPI.getPopular(pagination.limit)
      articles.value = response.data
      pagination.total = response.data.length
      pagination.totalPages = 1
    } else if (activeTab.value === 'category' && selectedCategory.value) {
      // 分类筛选
      response = await articleAPI.getByCategory(selectedCategory.value, pagination.page, pagination.limit)
      articles.value = response.data.articles
      pagination.total = response.data.total
      pagination.totalPages = response.data.totalPages
    } else {
      // 默认全部文章
      response = await articleAPI.getAll(pagination.page, pagination.limit)
      articles.value = response.data.articles
      pagination.total = response.data.total
      pagination.totalPages = response.data.totalPages
    }
    
    // 清除之前的消息
    message.text = ''
  } catch (error) {
    message.text = error.response?.data?.message || '获取文章列表失败'
    message.type = 'error'
  } finally {
    loading.value = false
  }
}

const handleDelete = async (id) => {
  if (!confirm('确定要删除这篇文章吗？')) {
    return
  }

  try {
    await articleAPI.delete(id)
    message.text = '文章删除成功'
    message.type = 'success'
    // 重新获取文章列表
    fetchArticles()
  } catch (error) {
    message.text = error.response?.data?.message || '删除文章失败'
    message.type = 'error'
  }
}

const truncateContent = (content) => {
  return content.length > 150 ? content.substring(0, 150) + '...' : content
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

const changePage = async (newPage) => {
  if (newPage < 1 || newPage > pagination.totalPages) {
    return
  }
  
  pagination.page = newPage
  await fetchArticles()
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await categoryAPI.getAll()
    categories.value = response.data.categories
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

// 搜索处理
const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    isSearching.value = false
    pagination.page = 1
    await fetchArticles()
    return
  }
  
  isSearching.value = true
  pagination.page = 1
  await fetchArticles()
}

// 标签切换
const setActiveTab = async (tab) => {
  activeTab.value = tab
  isSearching.value = false
  searchKeyword.value = ''
  selectedCategory.value = ''
  pagination.page = 1
  await fetchArticles()
}

// 分类切换
const handleCategoryChange = async () => {
  pagination.page = 1
  await fetchArticles()
}
</script>

<style scoped>
.article-list-container {
  padding: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.create-btn {
  padding: 10px 20px;
  background-color: #28a745;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: bold;
}

.create-btn:hover {
  background-color: #218838;
}

/* 搜索和筛选样式 */
.filters-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.search-box {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
}

.search-btn {
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.search-btn:hover {
  background-color: #0056b3;
}

.filter-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 8px 16px;
  border: 1px solid #dee2e6;
  background-color: #f8f9fa;
  color: #495057;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  background-color: #e9ecef;
}

.tab-btn.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.category-filters {
  margin-top: 10px;
}

.category-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  min-width: 200px;
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.article-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.article-card:hover {
  transform: translateY(-2px);
}

.article-title {
  margin: 0 0 10px 0;
  font-size: 1.2rem;
}

.article-title a {
  color: #333;
  text-decoration: none;
}

.article-title a:hover {
  color: #007bff;
}

.article-content {
  color: #666;
  line-height: 1.5;
  margin-bottom: 15px;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #888;
  margin-bottom: 15px;
}

.article-actions {
  display: flex;
  gap: 10px;
}

.edit-btn, .delete-btn {
  padding: 5px 10px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.9rem;
}

.edit-btn {
  background-color: #ffc107;
  color: #212529;
  text-decoration: none;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
}

.no-articles {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

.create-link {
  display: inline-block;
  margin-top: 10px;
  color: #007bff;
  text-decoration: none;
}

.create-link:hover {
  text-decoration: underline;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
  padding: 20px 0;
}

.page-btn {
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.page-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.page-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.page-info {
  color: #666;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .articles-grid {
    grid-template-columns: 1fr;
  }
  
  .article-meta {
    flex-direction: column;
    gap: 5px;
  }
  
  .search-box {
    flex-direction: column;
  }
  
  .filter-tabs {
    justify-content: center;
  }
  
  .tab-btn {
    flex: 1;
    min-width: 80px;
  }
}
</style>