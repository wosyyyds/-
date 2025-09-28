<template>
  <div class="group-chat-container">
    <div class="chat-header">
      <button @click="goBack" class="back-btn">← 返回</button>
      <div class="group-info" v-if="group">
        <h2>{{ group.name }}</h2>
        <p>{{ group.member_count }} 人</p>
      </div>
      <button @click="showGroupInfo = true" class="info-btn">ℹ️</button>
    </div>
    
    <Message v-if="message.text" :type="message.type" :text="message.text" />
    
    <div v-if="loading" class="loading">
      <Loading />
    </div>
    
    <div v-else class="chat-content">
      <!-- 消息列表 -->
      <div class="messages-container" ref="messagesContainer">
        <div 
          v-for="msg in messages" 
          :key="msg.id" 
          class="message-bubble"
          :class="{ sent: msg.sender_id == authStore.user.id, received: msg.sender_id != authStore.user.id }"
        >
          <div class="message-header" v-if="msg.sender_id != authStore.user.id">
            <span class="sender-name">{{ getSenderName(msg.sender_id) }}</span>
          </div>
          <div class="message-content">{{ msg.content }}</div>
          <div class="message-time">{{ formatTime(msg.created_at) }}</div>
        </div>
      </div>
      
      <!-- 消息输入 -->
      <form @submit.prevent="sendMessage" class="message-form">
        <textarea
          v-model="newMessage"
          placeholder="输入消息..."
          rows="3"
          required
          class="message-input"
        ></textarea>
        <div class="form-actions">
          <button 
            type="submit" 
            :disabled="sending || !newMessage.trim()"
            class="send-btn"
          >
            {{ sending ? '发送中...' : '发送' }}
          </button>
        </div>
      </form>
    </div>
    
    <!-- 群组信息模态框 -->
    <div v-if="showGroupInfo" class="modal-overlay" @click="showGroupInfo = false">
      <div class="modal-content" @click.stop>
        <h3>群组信息</h3>
        <div v-if="group" class="group-details">
          <div class="group-basic-info">
            <div class="group-avatar-large">
              {{ getInitials(group.name) }}
            </div>
            <h4>{{ group.name }}</h4>
            <p v-if="group.description">{{ group.description }}</p>
            <p class="created-info">
              由 {{ group.creator_name }} 创建于 {{ formatDate(group.created_at) }}
            </p>
          </div>
          
          <div class="members-section">
            <div class="members-header">
              <h4>成员 ({{ members.length }})</h4>
              <button 
                v-if="isGroupAdmin()" 
                @click="showAddMemberModal = true" 
                class="add-member-btn-header"
              >
                + 添加成员
              </button>
            </div>
            <div class="members-list">
              <div 
                v-for="member in members" 
                :key="member.id" 
                class="member-item"
              >
                <div class="member-info">
                  <div class="member-avatar">
                    {{ getInitials(member.name) }}
                  </div>
                  <div class="member-details">
                    <span class="member-name">{{ member.name }}</span>
                    <span class="member-role">
                      {{ member.role === 'owner' ? '创建者' : member.role === 'admin' ? '管理员' : '成员' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-actions">
            <button @click="showGroupInfo = false" class="close-btn">
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 添加成员模态框 -->
    <div v-if="showAddMemberModal" class="modal-overlay" @click="showAddMemberModal = false">
      <div class="modal-content" @click.stop>
        <h3>添加成员</h3>
        <div class="add-member-form">
          <div class="form-group">
            <label>选择成员:</label>
            <select v-model="selectedMember" class="member-select">
              <option value="">请选择成员</option>
              <option 
                v-for="user in availableUsers" 
                :key="user.id" 
                :value="user.id"
              >
                {{ user.name }} ({{ user.email }})
              </option>
            </select>
          </div>
          
          <div class="selected-members-preview" v-if="selectedMember">
            <h4>将要添加的成员:</h4>
            <div class="preview-member">
              <div class="member-avatar">
                {{ getInitials(getSelectedUser().name) }}
              </div>
              <div class="member-details">
                <span class="member-name">{{ getSelectedUser().name }}</span>
                <span class="member-email">{{ getSelectedUser().email }}</span>
              </div>
            </div>
          </div>
          
          <div class="modal-actions">
            <button @click="showAddMemberModal = false" class="cancel-btn">
              取消
            </button>
            <button 
              @click="addMember" 
              :disabled="!selectedMember || addingMember"
              class="submit-btn"
            >
              {{ addingMember ? '添加中...' : '添加成员' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { groupAPI, userAPI } from '../../services/api'
import Message from '../Common/Message.vue'
import Loading from '../Common/Loading.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const sending = ref(false)
const showGroupInfo = ref(false)
const showAddMemberModal = ref(false)
const addingMember = ref(false)
const message = reactive({ text: '', type: '' })

const group = ref(null)
const members = ref([])
const messages = ref([])
const newMessage = ref('')
const selectedMember = ref('')

const availableUsers = ref([])

const messagesContainer = ref(null)
const pollingInterval = ref(null)

onMounted(() => {
  loadGroupDetails()
  loadAvailableUsers()
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})

const loadGroupDetails = async () => {
  try {
    loading.value = true
    const groupId = route.params.groupId
    
    // 获取群组详情
    const groupResponse = await groupAPI.getGroupDetails(groupId)
    group.value = groupResponse.data.data.group
    members.value = groupResponse.data.data.members
    
    // 获取消息
    const messagesResponse = await groupAPI.getMessages(groupId)
    messages.value = messagesResponse.data.data
    
    // 滚动到最新消息
    await nextTick()
    scrollToBottom()
  } catch (error) {
    message.text = error.response?.data?.message || '获取群组信息失败'
    message.type = 'error'
  } finally {
    loading.value = false
  }
}

const loadAvailableUsers = async () => {
  try {
    const response = await userAPI.getUsersForMessaging()
    // 过滤掉当前用户自己和已经是群组成员的用户
    availableUsers.value = response.data.users.filter(user => 
      user.id !== authStore.user.id && 
      !members.value.some(member => member.id == user.id)
    )
  } catch (error) {
    console.error('获取用户列表失败:', error)
  }
}

const startPolling = () => {
  // 每5秒轮询一次新消息
  pollingInterval.value = setInterval(async () => {
    try {
      const groupId = route.params.groupId
      const messagesResponse = await groupAPI.getMessages(groupId)
      messages.value = messagesResponse.data.data
      await nextTick()
      scrollToBottom()
    } catch (error) {
      console.error('轮询消息失败:', error)
    }
  }, 5000)
}

const stopPolling = () => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
    pollingInterval.value = null
  }
}

const sendMessage = async () => {
  if (!newMessage.value.trim()) return
  
  try {
    sending.value = true
    const groupId = route.params.groupId
    await groupAPI.sendMessage(groupId, { content: newMessage.value.trim() })
    
    // 清空输入框
    newMessage.value = ''
    
    // 重新加载消息
    const messagesResponse = await groupAPI.getMessages(groupId)
    messages.value = messagesResponse.data.data
    
    // 滚动到最新消息
    await nextTick()
    scrollToBottom()
  } catch (error) {
    message.text = error.response?.data?.message || '发送消息失败'
    message.type = 'error'
  } finally {
    sending.value = false
  }
}

const addMember = async () => {
  if (!selectedMember.value) return
  
  try {
    addingMember.value = true
    const groupId = route.params.groupId
    await groupAPI.addMember(groupId, selectedMember.value)
    
    message.text = '成员添加成功'
    message.type = 'success'
    
    // 重新加载群组详情
    await loadGroupDetails()
    // 重新加载可用用户列表
    await loadAvailableUsers()
    
    // 关闭模态框
    showAddMemberModal.value = false
    selectedMember.value = ''
  } catch (error) {
    message.text = error.response?.data?.message || '添加成员失败'
    message.type = 'error'
  } finally {
    addingMember.value = false
  }
}

const goBack = () => {
  router.push('/groups')
}

const getSenderName = (senderId) => {
  const member = members.value.find(m => m.id == senderId)
  return member ? member.name : '未知用户'
}

const getInitials = (name) => {
  return name.charAt(0).toUpperCase()
}

const getSelectedUser = () => {
  return availableUsers.value.find(user => user.id == selectedMember.value) || {}
}

const isGroupAdmin = () => {
  if (!group.value || !members.value) return false
  
  const currentUser = members.value.find(member => member.id == authStore.user.id)
  return currentUser && (currentUser.role === 'admin' || currentUser.role === 'owner')
}

const formatTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}
</script>

<style scoped>
.group-chat-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.back-btn {
  padding: 8px 16px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.back-btn:hover {
  background-color: #545b62;
}

.group-info h2 {
  margin: 0 0 5px 0;
  font-size: 1.5rem;
}

.group-info p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.info-btn {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 5px 10px;
}

.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  position: relative;
}

.message-bubble.sent {
  align-self: flex-end;
  background-color: #007bff;
  color: white;
  border-bottom-right-radius: 4px;
}

.message-bubble.received {
  align-self: flex-start;
  background-color: #f1f3f4;
  color: #333;
  border-bottom-left-radius: 4px;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 0.8rem;
}

.message-bubble.sent .message-header {
  color: rgba(255, 255, 255, 0.8);
}

.message-bubble.received .message-header {
  color: #007bff;
  font-weight: bold;
}

.message-content {
  line-height: 1.5;
  margin-bottom: 5px;
}

.message-time {
  font-size: 0.7rem;
  text-align: right;
}

.message-bubble.sent .message-time {
  color: rgba(255, 255, 255, 0.7);
}

.message-bubble.received .message-time {
  color: #888;
}

.message-form {
  padding: 20px;
  border-top: 1px solid #eee;
  background: #f8f9fa;
}

.message-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: none;
  font-family: inherit;
  margin-bottom: 10px;
}

.message-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.send-btn {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.send-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.send-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
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

.group-basic-info {
  text-align: center;
  margin-bottom: 30px;
}

.group-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
  margin: 0 auto 15px;
}

.group-basic-info h4 {
  margin: 0 0 10px 0;
  font-size: 1.5rem;
}

.group-basic-info p {
  color: #666;
  margin: 0 0 10px 0;
}

.created-info {
  color: #888;
  font-size: 0.9rem;
}

.members-section {
  margin-bottom: 30px;
}

.members-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0 15px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.add-member-btn-header {
  padding: 6px 12px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.add-member-btn-header:hover {
  background-color: #218838;
}

.members-list {
  display: grid;
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.member-item {
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #6c757d;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.member-details {
  flex: 1;
}

.member-name {
  display: block;
  font-weight: bold;
  margin-bottom: 3px;
}

.member-role {
  font-size: 0.8rem;
  color: #666;
}

.modal-actions {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.close-btn,
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

.close-btn,
.cancel-btn {
  background-color: #6c757d;
  color: white;
}

.close-btn:hover,
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

/* 添加成员模态框样式 */
.add-member-form {
  text-align: left;
}

.add-member-form .form-group {
  margin-bottom: 20px;
}

.add-member-form label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #555;
}

.member-select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
}

.member-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.selected-members-preview {
  margin-bottom: 20px;
}

.selected-members-preview h4 {
  margin: 0 0 15px 0;
}

.preview-member {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.preview-member .member-email {
  font-size: 0.9rem;
  color: #666;
}

@media (max-width: 768px) {
  .group-chat-container {
    padding: 10px;
    height: calc(100vh - 80px);
  }
  
  .message-bubble {
    max-width: 85%;
  }
  
  .chat-header h2 {
    font-size: 1.2rem;
  }
  
  .modal-content {
    padding: 20px;
    width: 95%;
  }
}
</style>