<template>
  <div class="article-detail-container">
    <div v-if="loading" class="loading">
      <Loading />
    </div>
    
    <div v-else-if="article" class="article-detail">
      <!-- 文章头部 -->
      <div class="article-header">
        <h1 class="article-title">{{ article.title }}</h1>
        <div class="article-meta">
          <div class="meta-left">
            <span class="author">👤 {{ article.author_name }}</span>
            <span class="date">📅 {{ formatDate(article.created_at) }}</span>
            <span v-if="article.updated_at !== article.created_at" class="updated">
              ✏️ 更新于 {{ formatDate(article.updated_at) }}
            </span>
            <span class="views">👁️ {{ article.view_count || 0 }} 次阅读</span>
          </div>
          <div v-if="article.author_id === authStore.user?.id" class="article-actions">
            <router-link 
              :to="`/articles/edit/${article.id}`" 
              class="edit-btn"
            >
              ✏️ 编辑
            </router-link>
            <button 
              @click="handleDelete" 
              class="delete-btn"
            >
              🗑️ 删除
            </button>
          </div>
        </div>
        
        <!-- 分类信息 -->
        <div v-if="article.categories && article.categories.length > 0" class="article-categories">
          <span class="category-label">🏷️ 分类：</span>
          <span 
            v-for="category in article.categories" 
            :key="category.id" 
            class="category-tag"
          >
            {{ category.name }}
          </span>
        </div>
        
        <!-- 互动按钮 -->
        <div class="interaction-buttons">
          <button 
            @click="toggleLike" 
            :class="['like-btn', { 'liked': userInteraction.liked }]"
            :disabled="interactionLoading"
          >
            {{ userInteraction.liked ? '❤️' : '🤍' }} 
            {{ article.like_count || 0 }}
          </button>
          <button 
            @click="toggleFavorite" 
            :class="['favorite-btn', { 'favorited': userInteraction.favorited }]"
            :disabled="interactionLoading"
          >
            {{ userInteraction.favorited ? '⭐' : '☆' }} 
            {{ article.favorite_count || 0 }}
          </button>
          <span class="comment-count">
            💬 {{ article.comment_count || 0 }} 评论
          </span>
        </div>
      </div>

      <!-- 文章内容 -->
      <div class="article-content">
        <div v-html="formatContent(article.content)"></div>
      </div>

      <!-- 评论区域 -->
      <div class="comments-section">
        <h3>💬 评论 ({{ article.comment_count || 0 }})</h3>
        
        <!-- 评论输入框 -->
        <div v-if="authStore.user" class="comment-form">
          <textarea 
            v-model="newComment.content"
            placeholder="写下你的评论..."
            rows="4"
          ></textarea>
          <button 
            @click="submitComment" 
            :disabled="commentLoading || !newComment.content.trim()"
            class="submit-comment-btn"
          >
            {{ commentLoading ? '发布中...' : '发布评论' }}
          </button>
        </div>
        <div v-else class="login-prompt">
          <p>请 <router-link to="/login">登录</router-link> 后发表评论</p>
        </div>

        <!-- 评论列表 -->
        <div class="comments-list">
          <div 
            v-for="comment in comments" 
            :key="comment.id" 
            class="comment-item"
          >
            <div class="comment-header">
              <span class="comment-author">{{ comment.user_name }}</span>
              <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
              <div v-if="comment.user_id === authStore.user?.id" class="comment-actions">
                <button 
                  @click="deleteComment(comment.id)" 
                  class="delete-comment-btn"
                  :disabled="commentLoading"
                >
                  删除
                </button>
              </div>
            </div>
            <div class="comment-content">
              {{ comment.content }}
            </div>
          </div>
          
          <div v-if="comments.length === 0" class="no-comments">
            <p>暂无评论，快来抢沙发吧！</p>
          </div>
        </div>
      </div>

      <!-- 返回按钮 -->
      <div class="article-footer">
        <router-link to="/articles" class="back-btn">
          ← 返回文章列表
        </router-link>
      </div>
    </div>

    <div v-else class="error-state">
      <h2>😕 文章未找到</h2>
      <p>抱歉，您查找的文章不存在或已被删除。</p>
      <router-link to="/articles" class="back-btn">
        ← 返回文章列表
      </router-link>
    </div>

    <Message v-if="message.text" :type="message.type" :text="message.text" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { articleAPI, interactionAPI, commentAPI } from '../../services/api'
import Message from '../Common/Message.vue'
import Loading from '../Common/Loading.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const article = ref(null)
const comments = ref([])
const loading = ref(true)
const interactionLoading = ref(false)
const commentLoading = ref(false)
const message = reactive({ text: '', type: '' })
const userInteraction = reactive({ liked: false, favorited: false })
const newComment = reactive({ content: '' })

onMounted(() => {
  fetchArticle()
  fetchComments()
})

const fetchArticle = async () => {
  try {
    loading.value = true
    const response = await articleAPI.getById(route.params.id)
    article.value = response.data.article
    
    // 更新用户互动状态
    if (response.data.article.userInteraction) {
      userInteraction.liked = response.data.article.userInteraction.liked
      userInteraction.favorited = response.data.article.userInteraction.favorited
    }
  } catch (error) {
    console.error('获取文章失败:', error)
    message.text = error.response?.data?.message || '获取文章失败'
    message.type = 'error'
  } finally {
    loading.value = false
  }
}

const fetchComments = async () => {
  try {
    const response = await commentAPI.getByArticle(route.params.id)
    comments.value = response.data.comments || []
  } catch (error) {
    console.error('获取评论失败:', error)
    message.text = error.response?.data?.message || '获取评论失败'
    message.type = 'error'
  }
}

const submitComment = async () => {
  if (!newComment.content.trim()) return
  
  try {
    commentLoading.value = true
    const commentData = {
      content: newComment.content,
      article_id: route.params.id
    }
    
    await commentAPI.create(commentData)
    message.text = '评论发布成功'
    message.type = 'success'
    
    // 清空输入框
    newComment.content = ''
    
    // 重新获取评论
    await fetchComments()
    
    // 更新文章的评论计数
    if (article.value) {
      article.value.comment_count = (article.value.comment_count || 0) + 1
    }
  } catch (error) {
    message.text = error.response?.data?.message || '发布评论失败'
    message.type = 'error'
  } finally {
    commentLoading.value = false
  }
}

const deleteComment = async (commentId) => {
  if (!confirm('确定要删除这条评论吗？')) return
  
  try {
    commentLoading.value = true
    await commentAPI.delete(commentId)
    message.text = '评论删除成功'
    message.type = 'success'
    
    // 重新获取评论
    await fetchComments()
    
    // 更新文章的评论计数
    if (article.value) {
      article.value.comment_count = Math.max(0, (article.value.comment_count || 0) - 1)
    }
  } catch (error) {
    message.text = error.response?.data?.message || '删除评论失败'
    message.type = 'error'
  } finally {
    commentLoading.value = false
  }
}

const handleDelete = async () => {
  if (!confirm('确定要删除这篇文章吗？此操作不可撤销！')) {
    return
  }

  try {
    await articleAPI.delete(article.value.id)
    message.text = '文章删除成功'
    message.type = 'success'
    
    // 延迟跳转到文章列表
    setTimeout(() => {
      router.push('/articles')
    }, 1500)
  } catch (error) {
    message.text = error.response?.data?.message || '删除文章失败'
    message.type = 'error'
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '未知'
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatContent = (content) => {
  if (!content) return ''
  
  // 简单的文本格式化
  return content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
}

const toggleLike = async () => {
  try {
    interactionLoading.value = true
    
    if (userInteraction.liked) {
      await interactionAPI.unlike(article.value.id)
      userInteraction.liked = false
      article.value.like_count = Math.max(0, (article.value.like_count || 0) - 1)
    } else {
      await interactionAPI.like(article.value.id)
      userInteraction.liked = true
      article.value.like_count = (article.value.like_count || 0) + 1
    }
  } catch (error) {
    message.text = error.response?.data?.message || '点赞操作失败'
    message.type = 'error'
  } finally {
    interactionLoading.value = false
  }
}

const toggleFavorite = async () => {
  try {
    interactionLoading.value = true
    
    if (userInteraction.favorited) {
      await interactionAPI.unfavorite(article.value.id)
      userInteraction.favorited = false
      article.value.favorite_count = Math.max(0, (article.value.favorite_count || 0) - 1)
    } else {
      await interactionAPI.favorite(article.value.id)
      userInteraction.favorited = true
      article.value.favorite_count = (article.value.favorite_count || 0) + 1
    }
  } catch (error) {
    message.text = error.response?.data?.message || '收藏操作失败'
    message.type = 'error'
  } finally {
    interactionLoading.value = false
  }
}
</script>

<style scoped>
.article-detail-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 60px 20px;
}

.article-detail {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.article-header {
  padding: 30px 30px 20px;
  border-bottom: 1px solid #eee;
}

.article-title {
  font-size: 2rem;
  font-weight: bold;
  margin: 0 0 20px 0;
  line-height: 1.3;
  color: #333;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.meta-left {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  color: #666;
  font-size: 0.9rem;
}

.author, .date, .updated, .views {
  display: flex;
  align-items: center;
  gap: 5px;
}

.article-categories {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.category-label {
  font-weight: bold;
  margin-right: 10px;
  color: #555;
}

.category-tag {
  display: inline-block;
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  margin-right: 8px;
  margin-bottom: 4px;
}

.interaction-buttons {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.like-btn, .favorite-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.like-btn:hover, .favorite-btn:hover {
  background-color: #f5f5f5;
  transform: translateY(-1px);
}

.like-btn.liked {
  background-color: #ffebee;
  border-color: #f44336;
  color: #f44336;
}

.favorite-btn.favorited {
  background-color: #fff3e0;
  border-color: #ff9800;
  color: #ff9800;
}

.comment-count {
  color: #666;
  font-size: 0.9rem;
}

.article-actions {
  display: flex;
  gap: 10px;
}

.edit-btn, .delete-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.edit-btn {
  background-color: #ffc107;
  color: #212529;
}

.edit-btn:hover {
  background-color: #e0a800;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
}

.delete-btn:hover {
  background-color: #c82333;
}

.article-content {
  padding: 30px;
  line-height: 1.8;
  font-size: 1.1rem;
  color: #333;
  word-wrap: break-word;
}

.article-content :deep(strong) {
  font-weight: bold;
  color: #2c5aa0;
}

.article-content :deep(em) {
  font-style: italic;
  color: #666;
}

/* 评论区域样式 */
.comments-section {
  padding: 30px;
  border-top: 1px solid #eee;
  background-color: #fafafa;
}

.comments-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}

.comment-form textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
  margin-bottom: 10px;
}

.submit-comment-btn {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.submit-comment-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.submit-comment-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.login-prompt {
  text-align: center;
  padding: 20px;
  color: #666;
}

.login-prompt a {
  color: #007bff;
  text-decoration: none;
}

.login-prompt a:hover {
  text-decoration: underline;
}

.comments-list {
  margin-top: 30px;
}

.comment-item {
  padding: 15px;
  border-bottom: 1px solid #eee;
  background: white;
  border-radius: 4px;
  margin-bottom: 15px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 10px;
}

.comment-author {
  font-weight: bold;
  color: #333;
}

.comment-date {
  color: #888;
  font-size: 0.85rem;
}

.comment-actions {
  display: flex;
  gap: 10px;
}

.delete-comment-btn {
  color: #dc3545;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 2px 6px;
  border-radius: 3px;
}

.delete-comment-btn:hover:not(:disabled) {
  background-color: #f8d7da;
}

.delete-comment-btn:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.comment-content {
  color: #444;
  line-height: 1.6;
}

.no-comments {
  text-align: center;
  padding: 30px;
  color: #888;
}

.article-footer {
  padding: 20px 30px;
  border-top: 1px solid #eee;
  background-color: #f8f9fa;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background-color: #6c757d;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background-color: #545b62;
}

.error-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.error-state h2 {
  color: #dc3545;
  margin-bottom: 15px;
}

.error-state p {
  color: #666;
  margin-bottom: 30px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .article-detail-container {
    padding: 10px;
  }
  
  .article-header {
    padding: 20px 20px 15px;
  }
  
  .article-title {
    font-size: 1.5rem;
  }
  
  .article-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .meta-left {
    flex-direction: column;
    gap: 8px;
  }
  
  .article-content {
    padding: 20px;
    font-size: 1rem;
  }
  
  .comments-section {
    padding: 20px;
  }
  
  .article-footer {
    padding: 15px 20px;
  }
  
  .article-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 480px) {
  .article-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .edit-btn, .delete-btn {
    justify-content: center;
  }
  
  .comment-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>