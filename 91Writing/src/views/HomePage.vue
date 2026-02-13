<template>
  <div class="home-page">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <el-card class="welcome-card" shadow="never">
        <div class="welcome-content">
          <div class="welcome-text">
            <h1>欢迎回来！</h1>
            <p>开始您的创作之旅，让AI助力您的小说创作</p>
          </div>
          <div class="welcome-actions">
            <el-button type="primary" size="large" @click="createNovel">
              <el-icon><Plus /></el-icon>
              创建新小说
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 统计概览 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-item">
              <div class="stat-icon novels">
                <el-icon><Document /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ stats.totalNovels }}</div>
                <div class="stat-label">总小说数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-item">
              <div class="stat-icon words">
                <el-icon><EditPen /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ formatNumber(stats.totalWords) }}</div>
                <div class="stat-label">总字数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-item">
              <div class="stat-icon chapters">
                <el-icon><Notebook /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ stats.totalChapters }}</div>
                <div class="stat-label">总章节数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-item">
              <div class="stat-icon tokens">
                <el-icon><CreditCard /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ formatNumber(stats.totalTokens) }}</div>
                <div class="stat-label">已用Token</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主要内容区域 -->
    <el-row :gutter="20" class="main-content">
      <!-- 左侧：写作目标 -->
      <el-col :span="12">
        <el-card class="goals-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>📝 今日写作目标</span>
              <el-button type="text" @click="showGoalsDialog = true">
                管理目标
              </el-button>
            </div>
          </template>
          
          <div class="goals-content">
            <!-- 动态显示目标 -->
            <div 
              v-for="goal in displayedGoals" 
              :key="goal.id"
              class="goal-item"
            >
              <div class="goal-info">
                <span class="goal-label">{{ goal.title }}</span>
                <span class="goal-value">{{ goal.targetValue }}{{ goal.unit }}</span>
              </div>
              <div class="goal-progress">
                <el-progress 
                  :percentage="getGoalProgress(goal)" 
                  :color="getProgressColor(getGoalProgress(goal))"
                  :stroke-width="8"
                  :show-text="false"
                />
                <span class="progress-text">{{ goal.currentValue }}{{ goal.unit }} / {{ goal.targetValue }}{{ goal.unit }}</span>
              </div>
            </div>
            
            <!-- 如果没有目标时显示默认内容 -->
            <div v-if="displayedGoals.length === 0" class="no-goals">
              <el-empty description="暂无活跃目标" size="small">
                <el-button type="primary" size="small" @click="showGoalsDialog = true">
                  创建目标
                </el-button>
              </el-empty>
            </div>
            
            <!-- 查看全部目标按钮 -->
            <div v-if="totalActiveGoals > maxDisplayGoals" class="view-all-goals">
              <el-button type="text" size="small" @click="showGoalsDialog = true">
                查看全部 {{ totalActiveGoals }} 个目标 →
              </el-button>
            </div>
            
            <div class="streak-info" v-if="displayedGoals.length > 0">
              <el-icon class="streak-icon"><Trophy /></el-icon>
              <span>连续写作 {{ calculateStreak() }} 天</span>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 右侧：快速操作 -->
      <el-col :span="12">
        <el-card class="quick-actions-card" shadow="hover">
          <template #header>
            <span>🚀 快速操作</span>
          </template>
          
          <div class="quick-actions">
            <div class="action-grid">
              <div class="action-item" @click="openPrompts">
                <div class="action-icon">
                  <el-icon><ChatLineSquare /></el-icon>
                </div>
                <span>提示词库</span>
              </div>
              
              <div class="action-item" @click="openChapters">
                <div class="action-icon">
                  <el-icon><Notebook /></el-icon>
                </div>
                <span>章节管理</span>
              </div>
              
              <div class="action-item" @click="openBilling">
                <div class="action-icon">
                  <el-icon><CreditCard /></el-icon>
                </div>
                <span>Token计费</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近小说 -->
    <div class="recent-novels-section">
      <el-card class="recent-novels-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>📚 最近编辑的小说</span>
            <el-button type="text" @click="viewAllNovels">
              查看全部
            </el-button>
          </div>
        </template>
        
        <div class="novels-list">
          <div 
            v-for="novel in recentNovels" 
            :key="novel.id"
            class="novel-item"
            @click="openNovel(novel)"
          >
            <div class="novel-cover">
              <img v-if="novel.cover" :src="novel.cover" :alt="novel.title" />
              <div v-else class="default-cover">
                <el-icon><Document /></el-icon>
              </div>
            </div>
            <div class="novel-info">
              <h4 class="novel-title">{{ novel.title }}</h4>
              <p class="novel-desc">{{ novel.description }}</p>
              <div class="novel-meta">
                <span class="word-count">{{ formatNumber(novel.wordCount) }} 字</span>
                <span class="update-time">{{ formatTime(novel.updatedAt) }}</span>
              </div>
            </div>
            <div class="novel-actions">
              <el-button type="text" size="small">
                继续写作
              </el-button>
            </div>
          </div>
          
          <div v-if="recentNovels.length === 0" class="empty-novels">
            <el-empty description="暂无小说，开始创作您的第一部作品吧！">
              <el-button type="primary" @click="createNovel">创建小说</el-button>
            </el-empty>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 写作目标管理对话框 -->
    <el-dialog v-model="showGoalsDialog" title="写作目标管理" width="800px">
      <WritingGoals @close="showGoalsDialog = false" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNovelStore } from '@/stores/novel'
import { 
  Plus, Edit, Document, EditPen, Notebook, CreditCard, 
  ChatLineSquare, Trophy 
} from '@element-plus/icons-vue'
import WritingGoals from '@/components/WritingGoals.vue'
import billingService from '@/services/billing.js'

const router = useRouter()
const novelStore = useNovelStore()

// 响应式数据
const showGoalsDialog = ref(false)
const stats = computed(() => {
  // 使用计费服务获取真实的token使用统计
  const usageStats = billingService.getUsageStats()
  const totalTokens = usageStats.totalInputTokens + usageStats.totalOutputTokens
  
  return {
    totalNovels: recentNovelsData.value.length,
    totalWords: recentNovelsData.value.reduce((sum, novel) => sum + (novel.wordCount || novel.word_count || 0), 0),
    totalChapters: recentNovelsData.value.reduce((sum, novel) => sum + (novel.chapters || 0), 0),
    totalTokens
  }
})

// 添加响应式的目标数据状态
const goalsRefreshTrigger = ref(0)
const maxDisplayGoals = ref(3) // 首页最多显示的目标数量

// 获取所有活跃目标
const activeGoals = computed(() => {
  // 触发重新计算（通过依赖goalsRefreshTrigger）
  goalsRefreshTrigger.value
  
  // 从本地存储获取真实的写作目标数据
  const goalsData = JSON.parse(localStorage.getItem('writingGoals') || '[]')
  const active = goalsData.filter(goal => goal.status === 'active')
  
  // 按优先级排序（priority字段，数字越小优先级越高），如果没有priority则按创建时间排序
  return active.sort((a, b) => {
    if (a.priority !== undefined && b.priority !== undefined) {
      return a.priority - b.priority
    }
    if (a.priority !== undefined) return -1
    if (b.priority !== undefined) return 1
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
  })
})

// 首页显示的目标（限制数量）
const displayedGoals = computed(() => {
  return activeGoals.value.slice(0, maxDisplayGoals.value)
})

// 总的活跃目标数量
const totalActiveGoals = computed(() => {
  return activeGoals.value.length
})

// 兼容旧的currentGoal计算属性（保持向后兼容）
const currentGoal = computed(() => {
  const daily = activeGoals.value.find(goal => goal.type === 'daily')
  const weekly = activeGoals.value.find(goal => goal.type === 'weekly')
  
  return {
    dailyTarget: daily?.targetValue || 2000,
    dailyWritten: daily?.currentValue || 0,
    weeklyTarget: weekly?.targetValue || 14000,
    weeklyWritten: weekly?.currentValue || 0,
    streak: 0
  }
})

// 小说数据（从API加载）
const recentNovelsData = ref([])

const loadRecentNovels = async () => {
  try {
    const response = await fetch('/api/novels')
    if (response.ok) {
      const data = await response.json()
      recentNovelsData.value = data
    }
  } catch (e) {
    console.error('加载小说列表失败:', e)
  }
}

const recentNovels = computed(() => {
  return recentNovelsData.value
    .sort((a, b) => new Date(b.updated_at || b.updatedAt || 0) - new Date(a.updated_at || a.updatedAt || 0))
    .slice(0, 3)
    .map(novel => ({
      id: novel.id,
      title: novel.title,
      description: novel.description,
      wordCount: novel.wordCount || novel.word_count || 0,
      updatedAt: new Date(novel.updated_at || novel.updatedAt || Date.now()),
      cover: novel.cover || novel.cover_image
    }))
})

// 计算属性
const dailyProgress = computed(() => {
  return Math.min(100, Math.round((currentGoal.value.dailyWritten / currentGoal.value.dailyTarget) * 100))
})

const weeklyProgress = computed(() => {
  return Math.min(100, Math.round((currentGoal.value.weeklyWritten / currentGoal.value.weeklyTarget) * 100))
})

// 新增辅助函数
const getGoalProgress = (goal) => {
  if (!goal.targetValue || goal.targetValue === 0) return 0
  return Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
}

const calculateStreak = () => {
  // 简化的连续天数计算逻辑
  // 可以根据实际需求实现更复杂的逻辑
  return 0
}

const getGoalTypeText = (type) => {
  const typeMap = {
    daily: '每日',
    weekly: '每周', 
    monthly: '每月',
    custom: '自定义'
  }
  return typeMap[type] || '目标'
}

// 方法
const formatNumber = (num) => {
  if (num == null) return '0'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toLocaleString()
}

const formatTime = (date) => {
  const now = new Date()
  const diff = now - date
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  
  if (days > 0) {
    return `${days}天前`
  } else if (hours > 0) {
    return `${hours}小时前`
  } else {
    return '刚刚'
  }
}

const getProgressColor = (percentage) => {
  if (percentage >= 100) return '#67c23a'
  if (percentage >= 80) return '#e6a23c'
  if (percentage >= 60) return '#409eff'
  return '#f56c6c'
}

const createNovel = () => {
  router.push('/novels')
}

const openNovel = (novel) => {
  // 跳转到小说编辑页面
  router.push(`/writer?novelId=${novel.id}`)
}

const viewAllNovels = () => {
  router.push('/novels')
}

const openPrompts = () => {
  router.push('/prompts')
}

const openChapters = () => {
  router.push('/chapters')
}

const openBilling = () => {
  router.push('/billing')
}

// 页面获得焦点时重新计算数据，确保数据同步
const refreshData = () => {
  goalsRefreshTrigger.value++
  console.log('首页刷新目标数据')
}

// 暴露刷新函数给全局，以便其他页面调用
window.refreshHomeData = refreshData

// 生命周期
onMounted(() => {
  // 加载小说数据
  loadRecentNovels()
  
  // 监听页面可见性变化
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      refreshData()
      loadRecentNovels()
    }
  })
})
</script>

<style scoped>
.home-page {
  padding: 0;
}

.welcome-section {
  margin-bottom: 20px;
}

.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.welcome-card :deep(.el-card__body) {
  padding: 40px;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.welcome-text h1 {
  margin: 0 0 10px 0;
  font-size: 32px;
  font-weight: 600;
}

.welcome-text p {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
}

.welcome-actions {
  display: flex;
  gap: 15px;
}

.stats-section {
  margin-bottom: 20px;
}

.stat-card {
  border: none;
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.novels {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.stat-icon.words {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.stat-icon.chapters {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.stat-icon.tokens {
  background: linear-gradient(135deg, #43e97b, #38f9d7);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.main-content {
  margin-bottom: 20px;
}

/* 卡片高度对齐 */
.goals-card, 
.quick-actions-card {
  height: 100%;
  min-height: 380px;
}

.goals-card :deep(.el-card__body),
.quick-actions-card :deep(.el-card__body) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.goals-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  min-height: 300px;
}

.quick-actions {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.goals-content {
  padding: 10px 0;
}

.goal-item {
  margin-bottom: 20px;
  padding: 15px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.goal-item:last-child {
  margin-bottom: 15px;
}

.goal-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.goal-label {
  font-size: 14px;
  color: #606266;
}

.goal-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.goal-progress {
  position: relative;
}

.progress-text {
  display: block;
  text-align: right;
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  line-height: 1;
}

.streak-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-top: auto;
  margin-bottom: 0;
}

.streak-icon {
  color: #f39c12;
  font-size: 18px;
}

.no-goals {
  padding: 20px;
  text-align: center;
}

.view-all-goals {
  text-align: center;
  padding: 10px;
  border-top: 1px solid #f0f0f0;
  margin-top: 15px;
}

.view-all-goals .el-button {
  color: #409eff;
  font-size: 12px;
}

.quick-actions {
  padding: 10px 0;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  height: 100%;
  align-content: start;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 25px 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  min-height: 100px;
  justify-content: center;
}

.action-item:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
  transform: translateY(-2px);
}

.action-icon {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.recent-novels-section {
  margin-bottom: 20px;
}

.novels-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.novel-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.novel-item:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.novel-cover {
  width: 60px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.novel-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-cover {
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 24px;
}

.novel-info {
  flex: 1;
}

.novel-title {
  margin: 0 0 5px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.novel-desc {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.novel-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #909399;
}

.novel-actions {
  flex-shrink: 0;
}

.empty-novels {
  padding: 40px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .welcome-content {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .goals-card, 
  .quick-actions-card {
    min-height: auto;
  }
  
  .action-grid {
    grid-template-columns: 1fr;
  }
  
  .novel-item {
    flex-direction: column;
    text-align: center;
  }
  
  .goals-content {
    min-height: auto;
  }
}
</style>