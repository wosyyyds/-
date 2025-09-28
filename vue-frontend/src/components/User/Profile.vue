<template>
  <div class="profile-container">
    <h2>个人资料</h2>
    
    <Message v-if="message.text" :type="message.type" :text="message.text" />
    
    <!-- 标签页导航 -->
    <div class="profile-tabs">
      <button 
        @click="activeTab = 'info'"
        :class="{ active: activeTab === 'info' }"
        class="tab-btn"
      >
        👤 基本信息
      </button>
      <button 
        @click="setActiveTab('articles')"
        :class="{ active: activeTab === 'articles' }"
        class="tab-btn"
      >
        📝 我的文章
      </button>
      <button 
        @click="setActiveTab('likes')"
        :class="{ active: activeTab === 'likes' }"
        class="tab-btn"
      >
        ❤️ 我的点赞
      </button>
      <button 
        @click="setActiveTab('favorites')"
        :class="{ active: activeTab === 'favorites' }"
        class="tab-btn"
      >
        ⭐ 我的收藏
      </button>
    </div>
    
    <!-- 基本信息标签 -->
    <div v-if="activeTab === 'info'">
      <div v-if="loading && !profileData" class="loading">
        <Loading />
      </div>
      
      <div v-else class="profile-content">
        <!-- 查看模式 -->
        <div v-if="!isEditing" class="profile-view">
          <div class="profile-field">
            <label>用户名：</label>
            <span>{{ profileData?.name || '未知' }}</span>
          </div>
          <div class="profile-field">
            <label>邮箱：</label>
            <span>{{ profileData?.email || '未知' }}</span>
          </div>
          <div class="profile-field">
            <label>注册时间：</label>
            <span>{{ formatDate(profileData?.created_at) }}</span>
          </div>
          <div class="profile-actions">
            <button 
              @click="startEditing" 
              class="btn btn-primary"
            >
              编辑资料
            </button>
          </div>
        </div>
        
        <!-- 编辑模式 -->
        <form v-else @submit.prevent="handleSubmit" class="profile-form">
          <div class="form-group">
            <label for="name">用户名：</label>
            <input
              type="text"
              id="name"
              v-model="formData.name"
              required
            />
          </div>
          <div class="form-group">
            <label for="email">邮箱：</label>
            <input
              type="email"
              id="email"
              v-model="formData.email"
              required
            />
          </div>
          <div class="form-actions">
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="loading"
            >
              {{ loading ? '保存中...' : '保存' }}
            </button>
            <button 
              type="button" 
              @click="cancelEditing"
              class="btn btn-secondary"
              :disabled="loading"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- 我的文章标签 -->
    <div v-else-if="activeTab === 'articles'" class="tab-content">
      <div v-if="articlesLoading" class="loading">
        <Loading />
      </div>
      <div v-else-if="userArticles.length > 0" class="articles-list">
        <div v-for="article in userArticles" :key="article.id" class="article-item">
          <h4 class="article-title">
            <router-link :to="`/articles/${article.id}`">
              {{ article.title || '无标题' }}
            </router-link>
          </h4>
          <p class="article-summary">{{ truncateContent(article.content) }}</p>
          <div class="article-meta">
            <span class="publish-date">发布于: {{ formatDate(article.created_at) }}</span>
            <div class="article-actions">
              <router-link :to="`/articles/edit/${article.id}`" class="edit-link">编辑</router-link>
              <button @click="deleteArticle(article.id)" class="delete-btn">删除</button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-content">
        <div class="no-content-icon">📝</div>
        <h3>还没有发布文章</h3>
        <p>开始写作，分享您的想法吧！</p>
        <router-link to="/articles/create" class="create-article-btn">写文章</router-link>
      </div>
    </div>
    
    <!-- 我的点赞标签 -->
    <div v-else-if="activeTab === 'likes'" class="tab-content">
      <div v-if="likesLoading" class="loading">
        <Loading />
      </div>
      <div v-else-if="likedArticles.length > 0" class="articles-list">
        <div v-for="article in likedArticles" :key="article.id" class="article-item">
          <h4 class="article-title">
            <router-link :to="`/articles/${article.article_id}`">
              {{ article.article_title || '无标题' }}
            </router-link>
          </h4>
          <div class="article-meta">
            <span class="author">作者: {{ article.author_name || '未知' }}</span>
            <span class="like-date">点赞于: {{ formatDate(article.created_at) }}</span>
          </div>
        </div>
      </div>
      <div v-else class="no-content">
        <div class="no-content-icon">❤️</div>
        <h3>还没有点赞文章</h3>
        <p>去发现喜欢的文章吧！</p>
        <router-link to="/articles" class="browse-btn">浏览文章</router-link>
      </div>
    </div>
    
    <!-- 我的收藏标签 -->
    <div v-else-if="activeTab === 'favorites'" class="tab-content">
      <div v-if="favoritesLoading" class="loading">
        <Loading />
      </div>
      <div v-else-if="favoriteArticles.length > 0" class="articles-list">
        <div v-for="article in favoriteArticles" :key="article.id" class="article-item">
          <h4 class="article-title">
            <router-link :to="`/articles/${article.article_id}`">
              {{ article.article_title || '无标题' }}
            </router-link>
          </h4>
          <div class="article-meta">
            <span class="author">作者: {{ article.author_name || '未知' }}</span>
            <span class="favorite-date">收藏于: {{ formatDate(article.created_at) }}</span>
          </div>
        </div>
      </div>
      <div v-else class="no-content">
        <div class="no-content-icon">⭐</div>
        <h3>还没有收藏文章</h3>
        <p>收藏喜欢的文章，方便以后查看！</p>
        <router-link to="/articles" class="browse-btn">浏览文章</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { userAPI, articleAPI, interactionAPI } from '../../services/api'
import Message from '../Common/Message.vue'
import Loading from '../Common/Loading.vue'

const authStore = useAuthStore()

const profileData = ref(null)
const loading = ref(true)
const isEditing = ref(false)
const message = reactive({ text: '', type: '' })

// 标签页状态
const activeTab = ref('info')
const userArticles = ref([])
const likedArticles = ref([])
const favoriteArticles = ref([])
const articlesLoading = ref(false)
const likesLoading = ref(false)
const favoritesLoading = ref(false)

const formData = reactive({
  name: '',
  email: ''
})

onMounted(() => {
  fetchProfile()
})

const fetchProfile = async () => {
  try {
    loading.value = true
    const response = await userAPI.getProfile()
    profileData.value = response.data.user
    
    // 初始化表单数据
    formData.name = response.data.user.name
    formData.email = response.data.user.email
  } catch (error) {
    message.text = error.response?.data?.message || '获取用户信息失败'
    message.type = 'error'
  } finally {
    loading.value = false
  }
}

const startEditing = () => {
  isEditing.value = true
  message.text = ''
  // 重新设置表单数据
  formData.name = profileData.value.name
  formData.email = profileData.value.email
}

const cancelEditing = () => {
  isEditing.value = false
  message.text = ''
  // 恢复原始数据
  formData.name = profileData.value.name
  formData.email = profileData.value.email
}

const handleSubmit = async () => {
  try {
    loading.value = true
    message.text = ''

    const response = await userAPI.updateProfile(formData)
    
    // 更新本地数据
    profileData.value = response.data.user
    
    // 更新认证存储中的用户信息
    authStore.user.name = response.data.user.name
    authStore.user.email = response.data.user.email
    localStorage.setItem('user', JSON.stringify(authStore.user))
    
    message.text = '个人信息更新成功！'
    message.type = 'success'
    isEditing.value = false
  } catch (error) {
    message.text = error.response?.data?.message || '更新失败'
    message.type = 'error'
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '未知'
  return new Date(dateString).toLocaleString()
}

// 标签切换
const setActiveTab = async (tab) => {
  activeTab.value = tab
  message.text = ''
  
  if (tab === 'articles' && userArticles.value.length === 0) {
    await fetchUserArticles()
  } else if (tab === 'likes' && likedArticles.value.length === 0) {
    await fetchLikedArticles()
  } else if (tab === 'favorites' && favoriteArticles.value.length === 0) {
    await fetchFavoriteArticles()
  }
}

// 获取用户文章
const fetchUserArticles = async () => {
  try {
    articlesLoading.value = true
    const response = await articleAPI.getByUser(authStore.user.id)
    // 确保返回的数据是数组
    userArticles.value = Array.isArray(response.data.articles) ? response.data.articles : []
  } catch (error) {
    message.text = error.response?.data?.message || '获取文章列表失败'
    message.type = 'error'
  } finally {
    articlesLoading.value = false
  }
}

// 获取点赞文章
const fetchLikedArticles = async () => {
  try {
    likesLoading.value = true
    const response = await interactionAPI.getUserLikes(authStore.user.id)
    // 确保返回的数据是数组
    likedArticles.value = Array.isArray(response.data.likes) ? response.data.likes : []
  } catch (error) {
    message.text = error.response?.data?.message || '获取点赞列表失败'
    message.type = 'error'
  } finally {
    likesLoading.value = false
  }
}

// 获取收藏文章
const fetchFavoriteArticles = async () => {
  try {
    favoritesLoading.value = true
    const response = await interactionAPI.getUserFavorites(authStore.user.id)
    // 确保返回的数据是数组
    favoriteArticles.value = Array.isArray(response.data.favorites) ? response.data.favorites : []
  } catch (error) {
    message.text = error.response?.data?.message || '获取收藏列表失败'
    message.type = 'error'
  } finally {
    favoritesLoading.value = false
  }
}

// 删除文章
const deleteArticle = async (articleId) => {
  if (!confirm('确定要删除这篇文章吗？')) {
    return
  }
  
  try {
    await articleAPI.delete(articleId)
    message.text = '文章删除成功'
    message.type = 'success'
    // 重新获取文章列表
    await fetchUserArticles()
  } catch (error) {
    message.text = error.response?.data?.message || '删除文章失败'
    message.type = 'error'
  }
}

const truncateContent = (content) => {
  if (!content) return ''
  return content.length > 100 ? content.substring(0, 100) + '...' : content
}
</script>

<style scoped>
.profile-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

/* 标签页样式 */
.profile-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 2px solid #e9ecef;
  overflow-x: auto;
}

.tab-btn {
  padding: 12px 20px;
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 3px solid transparent;
  white-space: nowrap;
  font-size: 16px;
}

.tab-btn:hover {
  color: #007bff;
}

.tab-btn.active {
  color: #007bff;
  border-bottom-color: #007bff;
  font-weight: bold;
}

.tab-content {
  min-height: 400px;
}

.profile-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.loading {
  text-align: center;
  padding: 40px;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.profile-field {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.profile-field label {
  font-weight: bold;
  min-width: 120px;
  margin-right: 15px;
  color: #555;
}

.profile-field span {
  color: #333;
  font-size: 16px;
}

.profile-actions {
  text-align: center;
  margin-top: 30px;
}

.profile-form .form-group {
  margin-bottom: 20px;
}

.profile-form label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #555;
}

.profile-form input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.profile-form input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #545b62;
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 文章列表样式 */
.articles-list {
  display: grid;
  gap: 20px;
}

.article-item {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.article-item:hover {
  transform: translateY(-2px);
}

.article-title {
  margin: 0 0 10px 0;
  font-size: 1.2rem;
}

.article-title a {
  color: #007bff;
  text-decoration: none;
}

.article-title a:hover {
  text-decoration: underline;
}

.article-summary {
  color: #666;
  line-height: 1.5;
  margin-bottom: 15px;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #888;
}

.article-actions {
  display: flex;
  gap: 10px;
}

.edit-link {
  color: #ffc107;
  text-decoration: none;
  padding: 4px 8px;
  border-radius: 3px;
  background-color: rgba(255, 193, 7, 0.1);
}

.edit-link:hover {
  background-color: rgba(255, 193, 7, 0.2);
}

.delete-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8rem;
}

.delete-btn:hover {
  background-color: #c82333;
}

/* 空状态样式 */
.no-content {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.no-content-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.no-content h3 {
  color: #333;
  margin-bottom: 10px;
}

.no-content p {
  color: #666;
  margin-bottom: 20px;
}

.create-article-btn, .browse-btn {
  display: inline-block;
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.create-article-btn:hover, .browse-btn:hover {
  background-color: #0056b3;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-tabs {
    justify-content: center;
  }
  
  .tab-btn {
    padding: 10px 15px;
    font-size: 14px;
  }
  
  .article-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .article-actions {
    margin-top: 5px;
  }
}
</style>