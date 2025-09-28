<template>
  <div class="message-list-container">
    <h2>私信</h2>
    
    <Message v-if="message.text" :type="message.type" :text="message.text" />
    
    <!-- 标签页导航 -->
    <div class="message-tabs">
      <button 
        @click="activeTab = 'received'"
        :class="{ active: activeTab === 'received' }"
        class="tab-btn"
      >
        📥 收件箱
        <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
      </button>
      <button 
        @click="activeTab = 'sent'"
        :class="{ active: activeTab === 'sent' }"
        class="tab-btn"
      >
        📤 发件箱
      </button>
      <button 
        @click="activeTab = 'compose'"
        :class="{ active: activeTab === 'compose' }"
        class="tab-btn"
      >
        ✍️ 写私信
      </button>
    </div>
    
    <!-- 收件箱 -->
    <div v-if="activeTab === 'received'" class="tab-content">
      <div v-if="loading" class="loading">
        <Loading />
      </div>
      <div v-else>
        <div v-if="receivedMessages.length > 0" class="messages-list">
          <div 
            v-for="msg in receivedMessages" 
            :key="msg.id" 
            class="message-item"
            :class="{ unread: !msg.is_read }"
            @click="openConversation(msg.sender_id)"
          >
            <div class="message-header">
              <span class="sender">{{ msg.sender_name }}</span>
              <span class="date">{{ formatDate(msg.created_at) }}</span>
            </div>
            <div class="message-content">
              {{ truncateContent(msg.content, 50) }}
            </div>
          </div>
        </div>
        <div v-else class="no-messages">
          <div class="no-messages-icon">📭</div>
          <h3>暂无收到的私信</h3>
          <p>当有人给你发送私信时，会显示在这里</p>
        </div>
      </div>
    </div>
    
    <!-- 发件箱 -->
    <div v-else-if="activeTab === 'sent'" class="tab-content">
      <div v-if="loading" class="loading">
        <Loading />
      </div>
      <div v-else>
        <div v-if="sentMessages.length > 0" class="messages-list">
          <div 
            v-for="msg in sentMessages" 
            :key="msg.id" 
            class="message-item"
            @click="openConversation(msg.receiver_id)"
          >
            <div class="message-header">
              <span class="receiver">{{ msg.receiver_name }}</span>
              <span class="date">{{ formatDate(msg.created_at) }}</span>
            </div>
            <div class="message-content">
              {{ truncateContent(msg.content, 50) }}
            </div>
          </div>
        </div>
        <div v-else class="no-messages">
          <div class="no-messages-icon">📭</div>
          <h3>暂无发送的私信</h3>
          <p>点击"写私信"按钮给其他用户发送私信</p>
        </div>
      </div>
    </div>
    
    <!-- 写私信 -->
    <div v-else-if="activeTab === 'compose'" class="tab-content">
      <form @submit.prevent="sendMessage" class="message-form">
        <div class="form-group">
          <label>接收者:</label>
          <select v-model="newMessage.receiver_id" required>
            <option value="">请选择接收者</option>
            <option 
              v-for="user in users" 
              :key="user.id" 
              :value="user.id"
            >
              {{ user.name }} ({{ user.email }})
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label>内容:</label>
          <textarea
            v-model="newMessage.content"
            placeholder="输入私信内容..."
            rows="6"
            required
          ></textarea>
        </div>
        
        <div class="form-actions">
          <button 
            type="submit" 
            :disabled="sending"
            class="send-btn"
          >
            {{ sending ? '发送中...' : '发送私信' }}
          </button>
          <button 
            type="button" 
            @click="resetForm"
            class="cancel-btn"
          >
            重置
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { messageAPI, userAPI } from '../../services/api'
import Message from '../Common/Message.vue'
import Loading from '../Common/Loading.vue'

const authStore = useAuthStore()
const router = useRouter()

const activeTab = ref('received')
const loading = ref(true)
const sending = ref(false)
const message = reactive({ text: '', type: '' })

const receivedMessages = ref([])
const sentMessages = ref([])
const users = ref([])
const newMessage = reactive({
  receiver_id: '',
  content: ''
})

const unreadCount = ref(0)

onMounted(() => {
  loadReceivedMessages()
  loadUsers()
  loadUnreadCount()
})

// 监听标签页变化
watch(activeTab, (newTab) => {
  message.text = ''
  if (newTab === 'received' && receivedMessages.value.length === 0) {
    loadReceivedMessages()
  } else if (newTab === 'sent' && sentMessages.value.length === 0) {
    loadSentMessages()
  }
})

const loadReceivedMessages = async () => {
  try {
    loading.value = true
    const response = await messageAPI.getReceived()
    receivedMessages.value = response.data.data
  } catch (error) {
    message.text = error.response?.data?.message || '获取收到的私信失败'
    message.type = 'error'
  } finally {
    loading.value = false
  }
}

const loadSentMessages = async () => {
  try {
    loading.value = true
    const response = await messageAPI.getSent()
    sentMessages.value = response.data.data
  } catch (error) {
    message.text = error.response?.data?.message || '获取发送的私信失败'
    message.type = 'error'
  } finally {
    loading.value = false
  }
}

const loadUsers = async () => {
  try {
    const response = await userAPI.getUsersForMessaging()
    // 过滤掉当前用户自己
    users.value = response.data.users.filter(user => user.id !== authStore.user.id)
  } catch (error) {
    message.text = error.response?.data?.message || '获取用户列表失败'
    message.type = 'error'
  }
}

const loadUnreadCount = async () => {
  try {
    const response = await messageAPI.getUnreadCount()
    unreadCount.value = response.data.data.count
  } catch (error) {
    console.error('获取未读消息数量失败:', error)
  }
}

const sendMessage = async () => {
  if (!newMessage.receiver_id || !newMessage.content.trim()) {
    message.text = '请填写接收者和内容'
    message.type = 'error'
    return
  }
  
  try {
    sending.value = true
    await messageAPI.send(newMessage)
    message.text = '私信发送成功'
    message.type = 'success'
    resetForm()
    
    // 切换到收件箱并刷新
    activeTab.value = 'received'
    await loadReceivedMessages()
    // 重新加载未读消息数量
    await loadUnreadCount()
  } catch (error) {
    message.text = error.response?.data?.message || '发送私信失败'
    message.type = 'error'
  } finally {
    sending.value = false
  }
}

const resetForm = () => {
  newMessage.receiver_id = ''
  newMessage.content = ''
}

const openConversation = (userId) => {
  router.push(`/messages/conversation/${userId}`)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString()
}

const truncateContent = (content, length) => {
  if (!content) return ''
  return content.length > length ? content.substring(0, length) + '...' : content
}
</script>

<style scoped>
.message-list-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.message-tabs {
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
  position: relative;
}

.tab-btn:hover {
  color: #007bff;
}

.tab-btn.active {
  color: #007bff;
  border-bottom-color: #007bff;
  font-weight: bold;
}

.unread-badge {
  background-color: #dc3545;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 12px;
  position: absolute;
  top: 5px;
  right: 5px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-content {
  min-height: 400px;
}

.messages-list {
  display: grid;
  gap: 15px;
}

.message-item {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
  border-left: 4px solid #e9ecef;
}

.message-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.message-item.unread {
  border-left-color: #007bff;
  background-color: #f8f9fa;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.sender, .receiver {
  font-weight: bold;
  color: #333;
}

.date {
  color: #888;
  font-size: 0.9rem;
}

.message-content {
  color: #666;
  line-height: 1.5;
}

.no-messages {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.no-messages-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.no-messages h3 {
  color: #333;
  margin-bottom: 10px;
}

.no-messages p {
  color: #666;
  margin-bottom: 20px;
}

.message-form {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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

.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-group textarea {
  resize: vertical;
  min-height: 120px;
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
}

.send-btn, .cancel-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
}

.send-btn {
  background-color: #28a745;
  color: white;
}

.send-btn:hover:not(:disabled) {
  background-color: #218838;
  transform: translateY(-1px);
}

.send-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  transform: none;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background-color: #545b62;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .message-tabs {
    justify-content: center;
  }
  
  .tab-btn {
    padding: 10px 15px;
    font-size: 14px;
  }
  
  .message-form {
    padding: 20px;
  }
}
</style>