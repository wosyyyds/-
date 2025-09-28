<template>
  <div class="article-form-container">
    <h2>{{ isEdit ? '编辑文章' : '写文章' }}</h2>
    
    <Message v-if="message.text" :type="message.type" :text="message.text" />
    
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>标题:</label>
        <input
          type="text"
          v-model="formData.title"
          placeholder="输入文章标题..."
          required
          maxlength="200"
        />
        <span class="char-count">{{ formData.title.length }}/200</span>
      </div>
      
      <div class="form-group">
        <label>分类:</label>
        <select v-model="formData.category_id" class="category-select">
          <option value="">选择分类（可选）</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
      </div>
      
      <div class="form-group">
        <label>内容:</label>
        <textarea
          v-model="formData.content"
          placeholder="输入文章内容..."
          required
          rows="10"
        ></textarea>
      </div>
      
      <div class="form-actions">
        <button type="submit" :disabled="loading" class="submit-btn">
          {{ loading ? (isEdit ? '更新中...' : '发布中...') : (isEdit ? '更新文章' : '发布文章') }}
        </button>
        <router-link to="/articles" class="cancel-btn">
          取消
        </router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { articleAPI, categoryAPI } from '../../services/api'
import Message from '../Common/Message.vue'

const route = useRoute()
const router = useRouter()
const isEdit = ref(route.name === 'ArticleEdit')

const formData = reactive({
  title: '',
  content: '',
  category_id: ''
})

const message = reactive({ text: '', type: '' })
const loading = ref(false)
const categories = ref([])

// 如果是编辑模式，获取文章数据
onMounted(async () => {
  // 获取分类列表
  try {
    const response = await categoryAPI.getAll()
    categories.value = response.data.categories
  } catch (error) {
    console.error('获取分类失败:', error)
  }
  
  if (isEdit.value) {
    try {
      const response = await articleAPI.getById(route.params.id)
      const article = response.data.article
      formData.title = article.title
      formData.content = article.content
      formData.category_id = article.category_id || ''
    } catch (error) {
      message.text = error.response?.data?.message || '获取文章失败'
      message.type = 'error'
    }
  }
})

const handleSubmit = async () => {
  loading.value = true
  message.text = ''

  try {
    if (isEdit.value) {
      await articleAPI.update(route.params.id, formData)
      message.text = '文章更新成功'
      message.type = 'success'
    } else {
      const response = await articleAPI.create(formData)
      message.text = '文章发布成功'
      message.type = 'success'
      
      // 跳转到新创建的文章
      setTimeout(() => {
        router.push(`/articles/${response.data.article.id}`)
      }, 1000)
    }
  } catch (error) {
    message.text = error.response?.data?.message || (isEdit.value ? '更新文章失败' : '发布文章失败')
    message.type = 'error'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.article-form-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input, textarea, select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  font-family: inherit;
}

.category-select {
  background-color: white;
  cursor: pointer;
}

textarea {
  resize: vertical;
  min-height: 200px;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 0.9rem;
  color: #666;
  margin-top: 5px;
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
}

.submit-btn, .cancel-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  text-decoration: none;
  text-align: center;
}

.submit-btn {
  background-color: #007bff;
  color: white;
}

.submit-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
}

@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
  }
  
  .submit-btn, .cancel-btn {
    width: 100%;
  }
}
</style>