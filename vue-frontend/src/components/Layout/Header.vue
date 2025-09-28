<template>
  <header class="header">
    <div class="header-left">
      <h1>📝 博客系统</h1>
    </div>
    
    <nav class="nav-center">
      <div v-if="authStore.isAuthenticated" class="nav-links">
        <router-link to="/articles" class="nav-link"
          :class="{ active: $route.path.startsWith('/articles') }">
          📰 文章
        </router-link>
        <div class="dropdown" 
          @mouseenter="handleDropdownEnter" 
          @mouseleave="handleDropdownLeave">
          <button class="dropdown-btn">
            📊 更多 ▼
          </button>
          <div v-show="showDropdown" class="dropdown-menu">
            <router-link to="/articles/search" class="dropdown-item">
              🔍 文章搜索
            </router-link>
            <router-link to="/categories" class="dropdown-item">
              📁 分类管理
            </router-link>
            <router-link to="/users" class="dropdown-item">
              👥 用户管理
            </router-link>
            <router-link to="/users/search" class="dropdown-item">
              🔍 用户搜索
            </router-link>
            <router-link v-if="authStore.user?.role === 'admin' || authStore.user?.role === 'super_admin'" 
              to="/admin/users" class="dropdown-item">
              🔐 权限管理
            </router-link>
            <router-link to="/messages" class="dropdown-item">
              📩 私信
            </router-link>
            <router-link to="/groups" class="dropdown-item">
              👥 群聊
            </router-link>
            <router-link to="/games" class="dropdown-item">
              🎮 游戏
            </router-link>
          </div>
        </div>
      </div>
    </nav>
    
    <div class="header-right">
      <div v-if="authStore.isAuthenticated" class="user-section">
        <div class="user-dropdown" 
          @mouseenter="handleUserMenuEnter" 
          @mouseleave="handleUserMenuLeave">
          <button class="user-btn">
            👤 {{ authStore.user?.name }} ▼
          </button>
          <div v-show="showUserMenu" class="user-menu">
            <router-link to="/profile" class="user-menu-item">
              📝 个人资料
            </router-link>
            <router-link to="/articles/create" class="user-menu-item">
              ✏️ 写文章
            </router-link>
            <router-link to="/messages" class="user-menu-item">
              📩 私信
            </router-link>
            <router-link to="/groups" class="user-menu-item">
              👥 群聊
            </router-link>
            <router-link to="/games" class="user-menu-item">
              🎮 游戏
            </router-link>
            <hr class="menu-divider">
            <button @click="handleLogout" class="user-menu-item logout-item">
              🚪 退出
            </button>
          </div>
        </div>
      </div>
      <div v-else class="guest-nav">
        <router-link to="/login" class="auth-link">登录</router-link>
        <router-link to="/register" class="auth-link register">注册</router-link>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const showDropdown = ref(false)
const showUserMenu = ref(false)

// 用于防抖的定时器
let dropdownTimer = null
let userMenuTimer = null

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

// 下拉菜单处理函数
const handleDropdownEnter = () => {
  if (dropdownTimer) {
    clearTimeout(dropdownTimer)
    dropdownTimer = null
  }
  showDropdown.value = true
}

const handleDropdownLeave = () => {
  dropdownTimer = setTimeout(() => {
    showDropdown.value = false
  }, 200) // 200ms 延迟
}

// 用户菜单处理函数
const handleUserMenuEnter = () => {
  if (userMenuTimer) {
    clearTimeout(userMenuTimer)
    userMenuTimer = null
  }
  showUserMenu.value = true
}

const handleUserMenuLeave = () => {
  userMenuTimer = setTimeout(() => {
    showUserMenu.value = false
  }, 200) // 200ms 延迟
}
</script>

<style scoped>
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
  height: 60px;
}

.header-left h1 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: bold;
}

.nav-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.nav-link:hover, .nav-link.active {
  background-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

/* 下拉菜单样式 */
.dropdown {
  position: relative;
}

.dropdown-btn {
  background: none;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.dropdown-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 8px 0;
  min-width: 180px;
  margin-top: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.dropdown-item {
  display: block;
  color: #333;
  text-decoration: none;
  padding: 10px 16px;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}

/* 用户菜单样式 */
.header-right {
  display: flex;
  align-items: center;
}

.user-dropdown {
  position: relative;
}

.user-btn {
  background: none;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.user-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.user-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 8px 0;
  min-width: 160px;
  margin-top: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.user-menu-item {
  display: block;
  color: #333;
  text-decoration: none;
  padding: 10px 16px;
  transition: background-color 0.2s;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.user-menu-item:hover {
  background-color: #f8f9fa;
}

.logout-item {
  color: #dc3545 !important;
}

.menu-divider {
  border: none;
  border-top: 1px solid #dee2e6;
  margin: 8px 0;
}

.guest-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.auth-link {
  color: white;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.auth-link:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.auth-link.register {
  background-color: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.auth-link.register:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header {
    padding: 0 1rem;
  }
  
  .header-left h1 {
    font-size: 1.2rem;
  }
  
  .nav-links {
    gap: 1rem;
  }
  
  .nav-link, .dropdown-btn, .user-btn {
    padding: 6px 12px;
    font-size: 0.9rem;
  }
  
  .dropdown-menu, .user-menu {
    min-width: 150px;
  }
}
</style>