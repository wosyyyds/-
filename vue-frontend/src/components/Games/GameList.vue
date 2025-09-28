<template>
  <div class="games-container">
    <div class="header">
      <h1>🎮 游戏中心</h1>
      <p>在这里可以玩各种HTML游戏</p>
    </div>
    
    <div class="games-grid">
      <div class="game-card" v-for="game in games" :key="game.id" @click="playGame(game)">
        <div class="game-icon">{{ game.icon }}</div>
        <h3>{{ game.name }}</h3>
        <p>{{ game.description }}</p>
        <div class="game-tags">
          <span class="tag">{{ game.category }}</span>
          <span class="tag">{{ game.difficulty }}</span>
        </div>
      </div>
    </div>
    
    <div class="instructions">
      <h2>使用说明</h2>
      <ul>
        <li>点击游戏卡片进入游戏</li>
        <li>使用键盘方向键或WASD控制游戏</li>
        <li>享受游戏乐趣！</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 游戏列表数据
const games = ref([
  {
    id: 'snake',
    name: '贪吃蛇',
    icon: '🐍',
    description: '经典的贪吃蛇游戏，控制蛇吃食物并避免撞墙',
    category: '休闲',
    difficulty: '简单',
    path: '/html_files/游戏.html'
  },
  {
    id: 'breakout',
    name: '打砖块',
    icon: '🧱',
    description: '控制挡板反弹球击碎砖块',
    category: '动作',
    difficulty: '中等',
    path: '/html_files/打砖块.html'
  },
  {
    id: '2048',
    name: '2048',
    icon: '🔢',
    description: '滑动方块合并数字，目标是合成2048',
    category: '益智',
    difficulty: '困难',
    path: '/html_files/2048.html'
  },
  {
    id: 'tetris',
    name: '俄罗斯方块',
    icon: '🔳',
    description: '经典俄罗斯方块游戏，消除完整行获得分数',
    category: '益智',
    difficulty: '中等',
    path: '/html_files/俄罗斯方块.html'
  },
  {
    id: 'snake-enhanced',
    name: '贪食蛇增强版',
    icon: '🐍',
    description: '增强版贪食蛇游戏，包含多种特殊食物和道具',
    category: '休闲',
    difficulty: '困难',
    path: '/html_files/贪食蛇增强版.html'
  },
  {
    id: 'minesweeper',
    name: '扫雷',
    icon: '💣',
    description: '经典扫雷游戏，根据数字提示避开地雷',
    category: '益智',
    difficulty: '中等',
    path: '/html_files/扫雷.html'
  },
  {
    id: 'othello',
    name: '黑白棋',
    icon: '⚫⚪',
    description: '经典的黑白棋游戏，策略性极强',
    category: '策略',
    difficulty: '困难',
    path: '/html_files/黑白棋.html'
  },
  {
    id: 'catch-ball',
    name: '接球游戏',
    icon: '⚽',
    description: '控制挡板接住下落的各种球类获得分数',
    category: '动作',
    difficulty: '中等',
    path: '/html_files/接球游戏.html'
  },
  {
    id: 'Space',
    name: '太空射击',
    icon: '🚀',
    description: '控制飞船射击外星人，同时躲避敌人的攻击',
    category: '射击',
    difficulty: '中等',
    path: '/html_files/太空射击.html'
  },
  {
    id: 'push-the-box',
    name: '推箱子',
    icon: '📦',
    description: '将所有箱子推到目标位置',
    category: '休闲',
    difficulty: '中等',
    path: '/html_files/推箱子.html'
  },
  {
    id: 'push-the-box1',
    name: '华容道',
    icon: '📦',
    description: '将所有箱子推到目标位置',
    category: '休闲',
    difficulty: '中等',
    path: '/html_files/华容道.html'
  }
])

const playGame = (game) => {
  // 使用完整的URL打开游戏页面
  const fullPath = `${window.location.origin}${game.path}`
  window.open(fullPath, '_blank')
}
</script>

<style scoped>
.games-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.header h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 10px;
}

.header p {
  font-size: 1.2rem;
  color: #666;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
}

.game-card {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.game-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.game-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.game-card h3 {
  font-size: 1.5rem;
  margin-bottom: 10px;
  color: #333;
}

.game-card p {
  color: #666;
  margin-bottom: 20px;
  line-height: 1.5;
}

.game-tags {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.tag {
  background: #f0f0f0;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  color: #666;
}

.instructions {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 15px;
}

.instructions h2 {
  margin-bottom: 20px;
  color: #333;
}

.instructions ul {
  list-style-type: none;
  padding-left: 0;
}

.instructions li {
  margin-bottom: 15px;
  padding-left: 30px;
  position: relative;
  color: #555;
}

.instructions li:before {
  content: "🎮";
  position: absolute;
  left: 0;
  top: 0;
}

@media (max-width: 768px) {
  .games-grid {
    grid-template-columns: 1fr;
  }
  
  .games-container {
    padding: 15px;
  }
}
</style>