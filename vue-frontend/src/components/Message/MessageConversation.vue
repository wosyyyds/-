<template>
  <div class="message-conversation-container">
    <div class="conversation-header">
      <button @click="goBack" class="back-btn">← 返回</button>
      <h2>与 {{ otherUser?.name }} 的对话</h2>
    </div>
    
    <Message v-if="message.text" :type="message.type" :text="message.text" />
    
    <div v-if="loading" class="loading">
      <Loading />
    </div>
    
    <div v-else class="conversation-content">
      <!-- 消息列表 -->
      <div class="messages-container" ref="messagesContainer">
        <div 
          v-for="msg in messages" 
          :key="msg.id" 
          class="message-bubble"
          :class="{ sent: msg.sender_id == authStore.user.id, received: msg.receiver_id == authStore.user.id }"
        >
          <div class="message-info">
            <span class="sender-name">{{ msg.sender_id == authStore.user.id ? '我' : msg.sender_name }}</span>
            <span class="message-time">{{ formatTime(msg.created_at) }}</span>
            <span v-if="!msg.is_read && msg.receiver_id == authStore.user.id" class="unread-indicator">未读</span>
          </div>
          <div class="message-text">{{ msg.content }}</div>
        </div>
      </div>
      
      <!-- 回复表单 -->
      <form @submit.prevent="sendMessage" class="reply-form">
        <textarea
          v-model="replyContent"
          placeholder="输入回复内容..."
          rows="3"
          required
        ></textarea>
        <div class="form-actions">
          <button 
            type="submit" 
            :disabled="sending || !replyContent.trim()"
            class="send-btn"
          >
            {{ sending ? '发送中...' : '发送' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { messageAPI } from '../../services/api'
import Message from '../Common/Message.vue'
import Loading from '../Common/Loading.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const sending = ref(false)
const message = reactive({ text: '', type: '' })

const messages = ref([])
const otherUser = ref(null)
const replyContent = ref('')

const messagesContainer = ref(null)

onMounted(() => {
  loadConversation()
})

const loadConversation = async () => {
  try {
    loading.value = true
    const response = await messageAPI.getConversation(route.params.userId)
    messages.value = response.data.data.messages
    otherUser.value = response.data.data.otherUser
    
    // 滚动到最新消息
    await nextTick()
    scrollToBottom()
  } catch (error) {
    message.text = error.response?.data?.message || '获取对话失败'
    message.type = 'error'
  } finally {
    loading.value = false
  }
}

const sendMessage = async () => {
  if (!replyContent.value.trim()) return
  
  try {
    sending.value = true
    const messageData = {
      receiver_id: route.params.userId,
      content: replyContent.value
    }
    
    await messageAPI.send(messageData)
    
    // 重新加载对话
    await loadConversation()
    replyContent.value = ''
  } catch (error) {
    message.text = error.response?.data?.message || '发送消息失败'
    message.type = 'error'
  } finally {
    sending.value = false
  }
}

const goBack = () => {
  router.push('/messages')
}

const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}
</script>

<style scoped>
.message-conversation-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.conversation-header {
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

.conversation-content {
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

.message-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 0.8rem;
}

.message-bubble.sent .message-info {
  color: rgba(255, 255, 255, 0.8);
}

.message-bubble.received .message-info {
  color: #666;
}

.unread-indicator {
  background-color: #dc3545;
  color: white;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 0.7rem;
}

.message-text {
  line-height: 1.5;
}

.reply-form {
  padding: 20px;
  border-top: 1px solid #eee;
  background: #f8f9fa;
}

.reply-form textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: none;
  font-family: inherit;
  margin-bottom: 10px;
}

.reply-form textarea:focus {
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

@media (max-width: 768px) {
  .message-conversation-container {
    padding: 10px;
    height: calc(100vh - 80px);
  }
  
  .message-bubble {
    max-width: 85%;
  }
  
  .conversation-header h2 {
    font-size: 1.2rem;
  }
}
</style>