import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../components/User/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../components/Auth/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../components/Auth/Register.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../components/User/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('../components/User/UserList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/users/search',
    name: 'UserSearch',
    component: () => import('../components/User/UserSearch.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/users',
    name: 'UserManagement',
    component: () => import('../components/Admin/UserManagement.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/articles',
    name: 'Articles',
    component: () => import('../components/Article/ArticleList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/articles/create',
    name: 'ArticleCreate',
    component: () => import('../components/Article/ArticleForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/articles/edit/:id',
    name: 'ArticleEdit',
    component: () => import('../components/Article/ArticleForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/articles/:id',
    name: 'ArticleDetail',
    component: () => import('../components/Article/ArticleDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/articles/search',
    name: 'ArticleSearch',
    component: () => import('../components/Article/ArticleSearch.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/categories',
    name: 'CategoryManager',
    component: () => import('../components/Article/CategoryManager.vue'),
    meta: { requiresAuth: true }
  },
  // 私信路由
  {
    path: '/messages',
    name: 'MessageList',
    component: () => import('../components/Message/MessageList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/messages/conversation/:userId',
    name: 'MessageConversation',
    component: () => import('../components/Message/MessageConversation.vue'),
    meta: { requiresAuth: true }
  },
  // 群组路由
  {
    path: '/groups',
    name: 'GroupList',
    component: () => import('../components/Group/GroupList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/groups/:groupId',
    name: 'GroupChat',
    component: () => import('../components/Group/GroupChat.vue'),
    meta: { requiresAuth: true }
  },
  // 游戏路由
  {
    path: '/games',
    name: 'GameList',
    component: () => import('../components/Games/GameList.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router