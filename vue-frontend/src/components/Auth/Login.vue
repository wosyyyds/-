<template>
  <div class="login-container">
    <h2>用户登录</h2>
    <Message v-if="message.text" :type="message.type" :text="message.text" />
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>邮箱:</label>
        <input
          type="email"
          v-model="formData.email"
          required
        />
      </div>
      <div class="form-group">
        <label>密码:</label>
        <input
          type="password"
          v-model="formData.password"
          required
        />
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </form>
    <p class="register-link">
      还没有账号？ <router-link to="/register">立即注册</router-link>
    </p>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { userAPI } from '../../services/api'
import Message from '../Common/Message.vue'

const router = useRouter()
const authStore = useAuthStore()

const formData = reactive({
  email: '',
  password: ''
})

const message = reactive({ text: '', type: '' })
const loading = ref(false)

const handleSubmit = async () => {
  loading.value = true
  message.text = ''
  
  try {
    const response = await userAPI.login(formData)
    const { user, token } = response.data
    
    authStore.login(user, token)
    message.text = '登录成功！'
    message.type = 'success'
    
    // 跳转到首页
    setTimeout(() => {
      router.push('/')
    }, 1000)
  } catch (error) {
    message.text = error.response?.data?.message || '登录失败'
    message.type = 'error'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

button {
  width: 100%;
  padding: 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.register-link {
  margin-top: 15px;
  text-align: center;
}
</style>