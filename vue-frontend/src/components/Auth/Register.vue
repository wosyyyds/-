<template>
  <div class="register-container">
    <h2>用户注册</h2>
    <Message v-if="message.text" :type="message.type" :text="message.text" />
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>姓名:</label>
        <input
          type="text"
          v-model="formData.name"
          required
        />
      </div>
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
      <div class="form-group">
        <label>确认密码:</label>
        <input
          type="password"
          v-model="formData.confirmPassword"
          required
        />
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? '注册中...' : '注册' }}
      </button>
    </form>
    <p class="login-link">
      已有账号？ <router-link to="/login">立即登录</router-link>
    </p>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { userAPI } from '../../services/api'
import Message from '../Common/Message.vue'

const router = useRouter()

const formData = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const message = reactive({ text: '', type: '' })
const loading = ref(false)

const handleSubmit = async () => {
  if (formData.password !== formData.confirmPassword) {
    message.text = '密码确认不一致'
    message.type = 'error'
    return
  }
  
  loading.value = true
  message.text = ''
  
  try {
    await userAPI.register({
      name: formData.name,
      email: formData.email,
      password: formData.password
    })
    
    message.text = '注册成功！请登录'
    message.type = 'success'
    
    // 清空表单
    formData.name = ''
    formData.email = ''
    formData.password = ''
    formData.confirmPassword = ''
    
    // 3秒后跳转到登录页
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } catch (error) {
    message.text = error.response?.data?.message || '注册失败'
    message.type = 'error'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
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
  background-color: #28a745;
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

.login-link {
  margin-top: 15px;
  text-align: center;
}
</style>