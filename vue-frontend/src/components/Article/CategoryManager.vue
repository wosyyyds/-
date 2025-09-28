<template>
  <div class="category-manager-container">
    <div class="manager-header">
      <h2>分类管理</h2>
      <button @click="showCreateForm = true" class="create-btn">
        ➕ 新建分类
      </button>
    </div>

    <Message v-if="message.text" :type="message.type" :text="message.text" />

    <!-- 创建/编辑分类表单 -->
    <div v-if="showCreateForm || editingCategory" class="category-form">
      <h3>{{ editingCategory ? '编辑分类' : '新建分类' }}</h3>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>分类名称:</label>
          <input
            type="text"
            v-model="formData.name"
            placeholder="输入分类名称..."
            required
            maxlength="50"
          />
        </div>
        
        <div class="form-group">
          <label>分类描述:</label>
          <textarea
            v-model="formData.description"
            placeholder="输入分类描述（可选）..."
            rows="3"
            maxlength="200"
          ></textarea>
        </div>
        
        <div class="form-actions">
          <button type="submit" :disabled="loading" class="submit-btn">
            {{ loading ? '保存中...' : (editingCategory ? '更新分类' : '创建分类') }}
          </button>
          <button type="button" @click="cancelForm" class="cancel-btn">
            取消
          </button>
        </div>
      </form>
    </div>

    <div v-if="categoriesLoading" class="loading">
      <Loading />
    </div>

    <div v-else>
      <div v-if="categories.length > 0" class="categories-list">
        <div v-for="category in categories" :key="category.id" class="category-item">
          <div class="category-info">
            <h4 class="category-name">{{ category.name }}</h4>
            <p class="category-description">{{ category.description || '暂无描述' }}</p>
            <div class="category-meta">
              <span class="article-count">
                {{ category.article_count || 0 }} 篇文章
              </span>
              <span class="created-date">
                创建于: {{ formatDate(category.created_at) }}
              </span>
            </div>
          </div>
          
          <div class="category-actions">
            <button @click="startEdit(category)" class="edit-btn">
              编辑
            </button>
            <button @click="handleDelete(category.id)" class="delete-btn">
              删除
            </button>
            <router-link 
              :to="`/articles?category=${category.id}`" 
              class="view-articles-btn"
            >
              查看文章
            </router-link>
          </div>
        </div>
      </div>

      <div v-else class="no-categories">
        <div class="no-categories-icon">📁</div>
        <h3>暂无分类</h3>
        <p>创建第一个分类来组织您的文章</p>
        <button @click="showCreateForm = true" class="create-first-btn">
          创建分类
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { categoryAPI } from '../../services/api'
import Message from '../Common/Message.vue'
import Loading from '../Common/Loading.vue'

const categories = ref([])
const categoriesLoading = ref(true)
const loading = ref(false)
const message = reactive({ text: '', type: '' })

const showCreateForm = ref(false)
const editingCategory = ref(null)
const formData = reactive({
  name: '',
  description: ''
})

onMounted(() => {
  fetchCategories()
})

const fetchCategories = async () => {
  try {
    categoriesLoading.value = true
    const response = await categoryAPI.getAll()
    categories.value = response.data.categories

    console.log('获取分类成功:', response.data)
  } catch (error) {
    message.text = error.response?.data?.message || '获取分类列表失败'
    message.type = 'error'
  } finally {
    categoriesLoading.value = false
  }
}

const handleSubmit = async () => {
  loading.value = true
  message.text = ''

  try {
    if (editingCategory.value) {
      await categoryAPI.update(editingCategory.value.id, formData)
      message.text = '分类更新成功'
    } else {
      await categoryAPI.create(formData)
      message.text = '分类创建成功'
    }
    
    message.type = 'success'
    cancelForm()
    await fetchCategories()
  } catch (error) {
    message.text = error.response?.data?.message || (editingCategory.value ? '更新分类失败' : '创建分类失败')
    message.type = 'error'
  } finally {
    loading.value = false
  }
}

const startEdit = (category) => {
  editingCategory.value = category
  formData.name = category.name
  formData.description = category.description || ''
  showCreateForm.value = false
}

const cancelForm = () => {
  showCreateForm.value = false
  editingCategory.value = null
  formData.name = ''
  formData.description = ''
}

const handleDelete = async (categoryId) => {
  const category = categories.value.find(c => c.id === categoryId)
  
  if (!confirm(`确定要删除分类 "${category.name}" 吗？\n注意：删除分类不会删除其下的文章，但会将这些文章的分类设为未分类。`)) {
    return
  }

  try {
    await categoryAPI.delete(categoryId)
    message.text = '分类删除成功'
    message.type = 'success'
    await fetchCategories()
  } catch (error) {
    message.text = error.response?.data?.message || '删除分类失败'
    message.type = 'error'
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}
</script>

<style scoped>
.category-manager-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.create-btn, .create-first-btn {
  padding: 10px 20px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.create-btn:hover, .create-first-btn:hover {
  background-color: #218838;
}

.category-form {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 15px;
}

.submit-btn {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.submit-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.cancel-btn {
  padding: 10px 20px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.categories-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.category-item {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.category-item:hover {
  transform: translateY(-2px);
}

.category-info {
  margin-bottom: 15px;
}

.category-name {
  color: #333;
  margin: 0 0 8px 0;
  font-size: 1.2rem;
}

.category-description {
  color: #666;
  margin: 0 0 10px 0;
  line-height: 1.4;
}

.category-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #888;
}

.category-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.edit-btn, .delete-btn, .view-articles-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: none;
  text-align: center;
}

.edit-btn {
  background-color: #ffc107;
  color: #212529;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
}

.view-articles-btn {
  background-color: #17a2b8;
  color: white;
}

.no-categories {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.no-categories-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.no-categories h3 {
  color: #333;
  margin-bottom: 10px;
}

.no-categories p {
  color: #666;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .manager-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .categories-list {
    grid-template-columns: 1fr;
  }
  
  .category-meta {
    flex-direction: column;
    gap: 5px;
  }
  
  .category-actions {
    justify-content: center;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>