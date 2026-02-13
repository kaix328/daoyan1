<template>
  <div class="article-stats">
    <div v-if="!hasContent" class="no-content">
      <el-icon class="empty-icon"><Document /></el-icon>
      <p>暂无文章内容</p>
      <p class="empty-tip">请先在编辑区输入内容</p>
    </div>
    
    <div v-else class="stats-content">
      <!-- 基础统计 -->
      <div class="stats-section">
        <h3 class="section-title">基础统计</h3>
        <el-row :gutter="16">
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-number">{{ articleStats.wordCount }}</div>
              <div class="stat-label">总字数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-number">{{ articleStats.readingTime }}</div>
              <div class="stat-label">阅读时长(分钟)</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-number">{{ paragraphCount }}</div>
              <div class="stat-label">段落数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-number">{{ sentenceCount }}</div>
              <div class="stat-label">句子数</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 情感分析 -->
      <div class="stats-section">
        <h3 class="section-title">情感分析</h3>
        <div class="sentiment-analysis">
          <div class="sentiment-item">
            <span class="sentiment-label">整体情感倾向：</span>
            <el-tag 
              :type="getSentimentType(articleStats.sentiment)"
              size="large"
            >
              {{ articleStats.sentiment }}
            </el-tag>
          </div>
          <div class="sentiment-chart">
            <div class="chart-item">
              <div class="chart-label">积极情感</div>
              <el-progress 
                :percentage="sentimentData.positive" 
                color="#67c23a"
                :show-text="false"
              />
              <span class="chart-value">{{ sentimentData.positive }}%</span>
            </div>
            <div class="chart-item">
              <div class="chart-label">中性情感</div>
              <el-progress 
                :percentage="sentimentData.neutral" 
                color="#909399"
                :show-text="false"
              />
              <span class="chart-value">{{ sentimentData.neutral }}%</span>
            </div>
            <div class="chart-item">
              <div class="chart-label">消极情感</div>
              <el-progress 
                :percentage="sentimentData.negative" 
                color="#f56c6c"
                :show-text="false"
              />
              <span class="chart-value">{{ sentimentData.negative }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 文章标签 -->
      <div class="stats-section">
        <h3 class="section-title">文章标签</h3>
        <div class="tags-container">
          <el-tag 
            v-for="tag in articleStats.tags" 
            :key="tag"
            class="tag-item"
            type="info"
          >
            {{ tag }}
          </el-tag>
          <el-tag v-if="articleStats.tags.length === 0" type="info">
            暂无标签
          </el-tag>
        </div>
      </div>

      <!-- 文章分类和评分 -->
      <div class="stats-section">
        <h3 class="section-title">分类与评分</h3>
        <el-row :gutter="16">
          <el-col :span="12">
            <div class="category-item">
              <span class="category-label">文章分类：</span>
              <el-tag type="primary" size="large">
                {{ articleStats.category }}
              </el-tag>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="score-item">
              <span class="score-label">文章评分：</span>
              <div class="score-display">
                <el-rate 
                  v-model="ratingStars" 
                  disabled 
                  show-score 
                  text-color="#ff9900"
                />
                <span class="score-number">({{ articleStats.score }}/100)</span>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- AI深度分析 -->
      <div v-if="articleStats.aiAnalysis" class="stats-section">
        <h3 class="section-title">AI深度分析</h3>
        <div class="ai-analysis">
          <div class="analysis-summary">
            <h4>整体评价</h4>
            <p>{{ articleStats.aiAnalysis.summary }}</p>
          </div>
          
          <el-row :gutter="16" style="margin-top: 16px;">
            <el-col :span="8">
              <div class="analysis-section">
                <h5>优点</h5>
                <ul>
                  <li v-for="strength in articleStats.aiAnalysis.evaluation?.strengths || []" :key="strength">
                    {{ strength }}
                  </li>
                </ul>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="analysis-section">
                <h5>待改进</h5>
                <ul>
                  <li v-for="weakness in articleStats.aiAnalysis.evaluation?.weaknesses || []" :key="weakness">
                    {{ weakness }}
                  </li>
                </ul>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="analysis-section">
                <h5>建议</h5>
                <ul>
                  <li v-for="suggestion in articleStats.aiAnalysis.evaluation?.suggestions || []" :key="suggestion">
                    {{ suggestion }}
                  </li>
                </ul>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 字数建议 -->
      <div class="stats-section">
        <h3 class="section-title">{{ articleStats.aiAnalysis ? '基础建议' : '写作建议' }}</h3>
        <div class="suggestions">
          <div class="suggestion-item">
            <el-icon class="suggestion-icon"><TrendCharts /></el-icon>
            <div class="suggestion-content">
              <div class="suggestion-title">字数建议</div>
              <div class="suggestion-text">{{ getWordCountSuggestion() }}</div>
            </div>
          </div>
          <div class="suggestion-item">
            <el-icon class="suggestion-icon"><Reading /></el-icon>
            <div class="suggestion-content">
              <div class="suggestion-title">阅读建议</div>
              <div class="suggestion-text">{{ getReadingSuggestion() }}</div>
            </div>
          </div>
          <div class="suggestion-item">
            <el-icon class="suggestion-icon"><Edit /></el-icon>
            <div class="suggestion-content">
              <div class="suggestion-title">改进建议</div>
              <div class="suggestion-text">{{ getImprovementSuggestion() }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 导出按钮 -->
      <div class="export-section">
        <el-button type="primary" @click="exportStats">
          <el-icon class="mr-2"><Download /></el-icon>
          导出统计报告
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useNovelStore } from '@/stores/novel'
import { ElMessage } from 'element-plus'

const novelStore = useNovelStore()

// 计算属性
const hasContent = computed(() => {
  return novelStore.currentNovel.trim().length > 0
})

const articleStats = computed(() => novelStore.articleStats)

const paragraphCount = computed(() => {
  if (!novelStore.currentNovel) return 0
  return novelStore.currentNovel.split('\n\n').filter(p => p.trim()).length
})

const sentenceCount = computed(() => {
  if (!novelStore.currentNovel) return 0
  return (novelStore.currentNovel.match(/[。！？.!?]/g) || []).length
})

const ratingStars = computed(() => {
  return Math.round(articleStats.value.score / 20)
})

const sentimentData = computed(() => {
  const content = novelStore.currentNovel
  if (!content) return { positive: 0, neutral: 100, negative: 0 }
  
  // 简单的情感分析算法
  const positiveWords = ['快乐', '幸福', '美好', '成功', '胜利', '爱', '喜欢', '开心', '满意', '温暖']
  const negativeWords = ['悲伤', '痛苦', '失败', '死亡', '恐惧', '愤怒', '绝望', '孤独', '冷漠', '失望']
  
  let positiveCount = 0
  let negativeCount = 0
  
  positiveWords.forEach(word => {
    positiveCount += (content.match(new RegExp(word, 'g')) || []).length
  })
  
  negativeWords.forEach(word => {
    negativeCount += (content.match(new RegExp(word, 'g')) || []).length
  })
  
  const total = positiveCount + negativeCount
  if (total === 0) {
    return { positive: 20, neutral: 60, negative: 20 }
  }
  
  const positive = Math.round((positiveCount / total) * 100)
  const negative = Math.round((negativeCount / total) * 100)
  const neutral = 100 - positive - negative
  
  return { positive, neutral, negative }
})

// 方法
const getSentimentType = (sentiment) => {
  switch (sentiment) {
    case '积极': return 'success'
    case '消极': return 'danger'
    default: return 'info'
  }
}

const getWordCountSuggestion = () => {
  const wordCount = articleStats.value.wordCount
  if (wordCount < 500) {
    return '文章较短，建议增加更多细节描述和情节发展'
  } else if (wordCount < 1000) {
    return '字数适中，可以考虑丰富人物对话和环境描写'
  } else if (wordCount < 3000) {
    return '内容丰富，建议检查段落结构和逻辑连贯性'
  } else {
    return '文章较长，建议分章节或考虑精简部分内容'
  }
}

const getReadingSuggestion = () => {
  const readingTime = articleStats.value.readingTime
  if (readingTime < 3) {
    return '阅读时间较短，适合快速阅读和分享'
  } else if (readingTime < 10) {
    return '阅读时间适中，适合休闲阅读'
  } else {
    return '阅读时间较长，建议分段阅读或添加章节标题'
  }
}

const getImprovementSuggestion = () => {
  const score = articleStats.value.score
  const sentiment = articleStats.value.sentiment
  
  if (score < 60) {
    return '建议增加更多描述性语言和情节转折'
  } else if (score < 80) {
    if (sentiment === '中性') {
      return '可以增加更多情感色彩，让文章更有感染力'
    }
    return '整体不错，可以优化段落结构和语言表达'
  } else {
    return '文章质量很好，继续保持这种写作风格'
  }
}

const exportStats = () => {
  const stats = {
    基础统计: {
      总字数: articleStats.value.wordCount,
      阅读时长: `${articleStats.value.readingTime}分钟`,
      段落数: paragraphCount.value,
      句子数: sentenceCount.value
    },
    情感分析: {
      整体倾向: articleStats.value.sentiment,
      积极情感: `${sentimentData.value.positive}%`,
      中性情感: `${sentimentData.value.neutral}%`,
      消极情感: `${sentimentData.value.negative}%`
    },
    分类信息: {
      文章分类: articleStats.value.category,
      文章标签: articleStats.value.tags.join(', ') || '无',
      文章评分: `${articleStats.value.score}/100`
    },
    写作建议: {
      字数建议: getWordCountSuggestion(),
      阅读建议: getReadingSuggestion(),
      改进建议: getImprovementSuggestion()
    }
  }
  
  const content = JSON.stringify(stats, null, 2)
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `文章统计报告_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('统计报告导出成功')
}
</script>

<style scoped>
.article-stats {
  max-height: 70vh;
  overflow-y: auto;
}

.no-content {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-tip {
  font-size: 12px;
  margin-top: 8px;
}

.stats-content {
  padding: 0;
}

.stats-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.stats-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.stat-card {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.sentiment-analysis {
  space-y: 16px;
}

.sentiment-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.sentiment-label {
  margin-right: 12px;
  font-weight: 500;
}

.sentiment-chart {
  space-y: 12px;
}

.chart-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.chart-label {
  width: 80px;
  font-size: 14px;
  color: #606266;
}

.chart-value {
  margin-left: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  margin: 0;
}

.category-item,
.score-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.category-label,
.score-label {
  margin-right: 12px;
  font-weight: 500;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-number {
  font-size: 14px;
  color: #909399;
}

.suggestions {
  space-y: 16px;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.suggestion-icon {
  margin-right: 12px;
  margin-top: 2px;
  color: #409eff;
}

.suggestion-content {
  flex: 1;
}

.suggestion-title {
  font-weight: 500;
  margin-bottom: 4px;
  color: #303133;
}

.suggestion-text {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

.export-section {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.ai-analysis {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.analysis-summary h4 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 16px;
}

.analysis-summary p {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}

.analysis-section {
  background: white;
  padding: 12px;
  border-radius: 6px;
  height: 100%;
}

.analysis-section h5 {
  margin: 0 0 8px 0;
  color: #409eff;
  font-size: 14px;
  font-weight: 600;
}

.analysis-section ul {
  margin: 0;
  padding-left: 16px;
  color: #606266;
}

.analysis-section li {
  margin-bottom: 4px;
  line-height: 1.4;
}

.mr-2 {
  margin-right: 8px;
}

:deep(.el-progress-bar__outer) {
  background-color: #f0f0f0;
}

:deep(.el-rate) {
  display: flex;
  align-items: center;
}
</style>