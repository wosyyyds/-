<template>
  <div class="group-list-container">
    <h2>群聊</h2>
    
    <Message v-if="message.text" :type="message.type" :text="message.text" />
    
    <!-- 操作栏 -->
    <div class="actions-bar">
      <button @click="showCreateModal = true" class="create-btn">➕ 创建群组</button>
      <div class="search-box">
        <input 
          v-model="searchKeyword" 
          @input="handleSearch"
          placeholder="搜索群组..." 
          class="search-input"
        />
      </div>
    </div>
    
    <!-- 群组列表 -->
    <div v-if="loading" class="loading">
      <Loading />
    </div>
    <div v-else class="groups-container">
      <div 
        v-for="group in displayedGroups" 
        :key="group.id" 
        class="group-item"
        @click="openGroupChat(group.id)"
      >
        <div class="group-avatar">
          {{ getInitials(group.name) }}
        </div>
        <div class="group-info">
          <h3 class="group-name">{{ group.name }}</h3>
          <p class="group-meta">
            {{ group.member_count }} 人 · {{ group.user_role === 'owner' ? '创建者' : group.user_role === 'admin' ? '管理员' : '成员' }}
          </p>
        </div>
        <div class="group-last-active">
          {{ formatTime(group.updated_at) }}
        </div>
      </div>
      
      <div v-if="displayedGroups.length === 0" class="no-groups">
        <div class="no-groups-icon">👥</div>
        <h3>{{ searchKeyword ? '未找到相关群组' : '暂无群组' }}</h3>
        <p>{{ searchKeyword ? '请尝试其他关键词' : '点击"创建群组"按钮创建一个新的群聊' }}</p>
      </div>
    </div>
    
    <!-- 创建群组模态框 -->
    <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
      <div class="modal-content" @click.stop>
        <h3>创建群组</h3>
        <form @submit.prevent="createGroup">
          <div class="form-group">
            <label>群组名称:</label>
            <input 
              v-model="newGroup.name" 
              type="text" 
              required 
              placeholder="请输入群组名称"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label>群组描述:</label>
            <textarea 
              v-model="newGroup.description" 
              placeholder="请输入群组描述（可选）"
              rows="3"
              class="form-textarea"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>添加成员:</label>
            <div class="member-selection">
              <select v-model="selectedMember" class="member-select">
                <option value="">选择成员</option>
                <option 
                  v-for="user in availableUsers" 
                  :key="user.id" 
                  :value="user.id"
                >
                  {{ user.name }} ({{ user.email }})
                </option>
              </select>
              <button 
                type="button" 
                @click="addMemberToNewGroup" 
                :disabled="!selectedMember"
                class="add-member-btn"
              >
                添加
              </button>
            </div>
            
            <div class="selected-members">
              <div 
                v-for="member in newGroup.members" 
                :key="member.id" 
                class="selected-member"
              >
                <span>{{ member.name }}</span>
                <button 
                  type="button" 
                  @click="removeMemberFromNewGroup(member.id)"
                  class="remove-member-btn"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="showCreateModal = false" class="cancel-btn">
              取消
            </button>
            <button type="submit" :disabled="creating" class="submit-btn">
              {{ creating ? '创建中...' : '创建群组' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { groupAPI, userAPI } from '../../services/api'
import Message from '../Common/Message.vue'
import Loading from '../Common/Loading.vue'

const authStore = useAuthStore()
const router = useRouter()

const loading = ref(true)
const creating = ref(false)
const showCreateModal = ref(false)
const message = reactive({ text: '', type: '' })

const groups = ref([])
const displayedGroups = ref([])
const searchKeyword = ref('')

const newGroup = reactive({
  name: '',
  description: '',
  members: []
})

const selectedMember = ref('')
const availableUsers = ref([])

onMounted(() => {
  loadUserGroups()
  loadAvailableUsers()
})

const loadUserGroups = async () => {
  try {
    loading.value = true
    const response = await groupAPI.getUserGroups()
    groups.value = response.data.data
    displayedGroups.value = groups.value
  } catch (error) {
    message.text = error.response?.data?.message || '获取群组列表失败'
    message.type = 'error'
  } finally {
    loading.value = false
  }
}

const loadAvailableUsers = async () => {
  try {
    const response = await userAPI.getUsersForMessaging()
    // 过滤掉当前用户自己
    availableUsers.value = response.data.users.filter(user => user.id !== authStore.user.id)
  } catch (error) {
    console.error('获取用户列表失败:', error)
  }
}

const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    displayedGroups.value = groups.value
    return
  }
  
  // 简单的前端搜索
  displayedGroups.value = groups.value.filter(group => 
    group.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
}

const openGroupChat = (groupId) => {
  router.push(`/groups/${groupId}`)
}

const createGroup = async () => {
  if (!newGroup.name.trim()) {
    message.text = '请输入群组名称'
    message.type = 'error'
    return
  }
  
  try {
    creating.value = true
    const groupData = {
      name: newGroup.name.trim(),
      description: newGroup.description.trim(),
      memberIds: newGroup.members.map(member => member.id)
    }
    
    await groupAPI.create(groupData)
    
    message.text = '群组创建成功'
    message.type = 'success'
    
    // 重置表单
    resetCreateForm()
    showCreateModal.value = false
    
    // 重新加载群组列表
    await loadUserGroups()
  } catch (error) {
    message.text = error.response?.data?.message || '创建群组失败'
    message.type = 'error'
  } finally {
    creating.value = false
  }
}

const addMemberToNewGroup = () => {
  if (!selectedMember.value) return
  
  const user = availableUsers.value.find(u => u.id == selectedMember.value)
  if (user && !newGroup.members.some(m => m.id == user.id)) {
    newGroup.members.push(user)
  }
  
  selectedMember.value = ''
}

const removeMemberFromNewGroup = (userId) => {
  const index = newGroup.members.findIndex(m => m.id == userId)
  if (index !== -1) {
    newGroup.members.splice(index, 1)
  }
}

const resetCreateForm = () => {
  newGroup.name = ''
  newGroup.description = ''
  newGroup.members = []
  selectedMember.value = ''
}

const getInitials = (name) => {
  return name.charAt(0).toUpperCase()
}

const formatTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  
  // 如果是今天
  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  // 如果是昨天
  if (diff < 48 * 60 * 60 * 1000) {
    return '昨天'
  }
  
  // 其他情况显示日期
  return date.toLocaleDateString()
}
</script>

<style scoped>
.group-list-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
}

.create-btn {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.create-btn:hover {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.search-box {
  flex: 1;
  max-width: 300px;
}

.search-input {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.groups-container {
  display: grid;
  gap: 15px;
}

.group-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
}

.group-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.group-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  margin-right: 15px;
}

.group-info {
  flex: 1;
}

.group-name {
  margin: 0 0 5px 0;
  font-size: 18px;
  color: #333;
}

.group-meta {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.group-last-active {
  color: #888;
  font-size: 14px;
}

.no-groups {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.no-groups-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.no-groups h3 {
  color: #333;
  margin-bottom: 10px;
}

.no-groups p {
  color: #666;
  margin-bottom: 20px;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 30px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #555;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.member-selection {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.member-select {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.add-member-btn {
  padding: 10px 15px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.add-member-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.selected-members {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.selected-member {
  display: flex;
  align-items: center;
  background-color: #f1f3f4;
  border-radius: 20px;
  padding: 5px 10px;
}

.remove-member-btn {
  background: none;
  border: none;
  color: #dc3545;
  font-size: 18px;
  cursor: pointer;
  margin-left: 5px;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
}

.cancel-btn,
.submit-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  min-width: 100px;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background-color: #545b62;
}

.submit-btn {
  background-color: #007bff;
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.submit-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .actions-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    max-width: none;
  }
  
  .modal-content {
    padding: 20px;
    width: 95%;
  }
}
</style>