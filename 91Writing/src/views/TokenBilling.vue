<template>
  <div class="token-billing">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1>📊 Token使用统计</h1>
        <p>查看API Token使用情况和统计数据</p>
      </div>
      <div class="header-actions">
        <el-button @click="exportBilling">
          <el-icon><Download /></el-icon>
          导出统计
        </el-button>
      </div>
    </div>

    <!-- Token使用概览 -->
    <div class="account-overview">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="overview-card usage">
            <div class="overview-item">
              <div class="overview-icon">
                <el-icon><DataAnalysis /></el-icon>
              </div>
              <div class="overview-content">
                <div class="overview-value">{{ formatNumber(todayTokens) }}</div>
                <div class="overview-label">今日Token</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="overview-card input">
            <div class="overview-item">
              <div class="overview-icon">
                <el-icon><Upload /></el-icon>
              </div>
              <div class="overview-content">
                <div class="overview-value">{{ formatNumber(totalInputTokens) }}</div>
                <div class="overview-label">输入Token</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="overview-card output">
            <div class="overview-item">
              <div class="overview-icon">
                <el-icon><Download /></el-icon>
              </div>
              <div class="overview-content">
                <div class="overview-value">{{ formatNumber(totalOutputTokens) }}</div>
                <div class="overview-label">输出Token</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="overview-card total">
            <div class="overview-item">
              <div class="overview-icon">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="overview-content">
                <div class="overview-value">{{ formatNumber(totalTokens) }}</div>
                <div class="overview-label">总Token数</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 使用统计图表 -->
    <div class="statistics-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>📊 使用趋势</h3>
            <div class="time-filter">
              <el-radio-group v-model="statisticsTimeRange" size="small">
                <el-radio-button label="7d">最近7天</el-radio-button>
                <el-radio-button label="30d">最近30天</el-radio-button>
                <el-radio-button label="90d">最近90天</el-radio-button>
              </el-radio-group>
            </div>
          </div>
        </template>
        
        <div class="statistics-content">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="chart-container">
                <h4>Token使用趋势</h4>
                <div class="chart-placeholder">
                  <p>Token使用趋势图（可集成 ECharts）</p>
                </div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="chart-container">
                <h4>输入/输出Token分布</h4>
                <div class="chart-placeholder">
                  <p>输入/输出Token分布图（可集成 ECharts）</p>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>
    </div>

    <!-- 筛选和搜索 -->
    <div class="filter-section">
      <el-card shadow="never">
        <div class="filter-content">
          <div class="filter-left">
            <el-select v-model="typeFilter" placeholder="类型筛选" style="width: 120px;">
              <el-option label="全部" value="all" />
              <el-option label="文本生成" value="generation" />
              <el-option label="文本润色" value="polish" />
              <el-option label="大纲生成" value="outline" />
              <el-option label="对话聊天" value="chat" />
            </el-select>
            
            <el-select v-model="modelFilter" placeholder="模型筛选" style="width: 140px;">
              <el-option label="全部模型" value="all" />
              <el-option label="GPT-4" value="gpt-4" />
              <el-option label="GPT-3.5" value="gpt-3.5" />
              <el-option label="Claude" value="claude" />
              <el-option label="文心一言" value="wenxin" />
            </el-select>
            
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 240px;"
            />
          </div>
          
          <div class="filter-right">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索请求内容..."
              clearable
              style="width: 250px;"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 使用记录列表 -->
    <div class="billing-records">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>📋 使用记录</h3>
            <div class="record-stats">
              <span>共 {{ filteredRecords.length }} 条记录</span>
              <span>总Token: {{ formatNumber(totalFilteredTokens) }}</span>
            </div>
          </div>
        </template>
        
        <el-table 
          :data="paginatedRecords" 
          stripe
          style="width: 100%"
          @row-click="viewRecordDetails"
        >
          <el-table-column prop="timestamp" label="时间" width="160">
            <template #default="{ row }">
              {{ formatDateTime(row.timestamp) }}
            </template>
          </el-table-column>
          
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getTypeColor(row.type)" size="small">
                {{ getTypeText(row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="model" label="模型" width="120">
            <template #default="{ row }">
              <span class="model-name">{{ row.model }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="content" label="请求内容" min-width="300">
            <template #default="{ row }">
              <div class="content-preview" :title="row.content">
                {{ row.content.substring(0, 100) }}{{ row.content.length > 100 ? '...' : '' }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="inputTokens" label="输入Token" width="100" align="right">
            <template #default="{ row }">
              {{ formatNumber(row.inputTokens) }}
            </template>
          </el-table-column>
          
          <el-table-column prop="outputTokens" label="输出Token" width="100" align="right">
            <template #default="{ row }">
              {{ formatNumber(row.outputTokens) }}
            </template>
          </el-table-column>
          
          <el-table-column prop="totalTokens" label="总Token" width="100" align="right">
            <template #default="{ row }">
              {{ formatNumber(row.totalTokens) }}
            </template>
          </el-table-column>
          
          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="getStatusColor(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button 
                type="text" 
                size="small" 
                @click.stop="viewRecordDetails(row)"
              >
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="filteredRecords.length"
            layout="total, sizes, prev, pager, next, jumper"
          />
        </div>
      </el-card>
    </div>

    <!-- 记录详情对话框 -->
    <el-dialog 
      v-model="showDetailsDialog" 
      title="使用记录详情" 
      width="700px"
    >
      <div v-if="selectedRecord" class="record-details">
        <div class="details-grid">
          <div class="detail-item">
            <label>请求时间：</label>
            <span>{{ formatDateTime(selectedRecord.timestamp) }}</span>
          </div>
          <div class="detail-item">
            <label>请求类型：</label>
            <el-tag :type="getTypeColor(selectedRecord.type)">
              {{ getTypeText(selectedRecord.type) }}
            </el-tag>
          </div>
          <div class="detail-item">
            <label>使用模型：</label>
            <span>{{ selectedRecord.model }}</span>
          </div>
          <div class="detail-item">
            <label>请求状态：</label>
            <el-tag :type="getStatusColor(selectedRecord.status)">
              {{ getStatusText(selectedRecord.status) }}
            </el-tag>
          </div>
          <div class="detail-item">
            <label>输入Token：</label>
            <span>{{ formatNumber(selectedRecord.inputTokens) }}</span>
          </div>
          <div class="detail-item">
            <label>输出Token：</label>
            <span>{{ formatNumber(selectedRecord.outputTokens) }}</span>
          </div>
          <div class="detail-item">
            <label>总Token：</label>
            <span>{{ formatNumber(selectedRecord.totalTokens) }}</span>
          </div>
        </div>
        
        <div class="content-section">
          <div class="content-header">
            <h4>请求内容</h4>
            <el-button size="small" @click="copyContent(selectedRecord.content)">
              <el-icon><DocumentCopy /></el-icon>
              复制
            </el-button>
          </div>
          <div class="content-box">
            {{ selectedRecord.content }}
          </div>
        </div>
        
        <div class="response-section" v-if="selectedRecord.response">
          <div class="content-header">
            <h4>响应内容</h4>
            <el-button size="small" @click="copyContent(selectedRecord.response)">
              <el-icon><DocumentCopy /></el-icon>
              复制
            </el-button>
          </div>
          <div class="content-box">
            {{ selectedRecord.response }}
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Download, Upload, DataAnalysis, 
  TrendCharts, Search, DocumentCopy 
} from '@element-plus/icons-vue'
import billingService from '../services/billing.js'

// 响应式数据
const statisticsTimeRange = ref('7d')
const typeFilter = ref('all')
const modelFilter = ref('all')
const dateRange = ref([])
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const showDetailsDialog = ref(false)
const selectedRecord = ref(null)

// Token统计数据
const todayStats = computed(() => {
  return billingService.getTodayStats()
})

const todayTokens = computed(() => {
  return todayStats.value.tokenCount
})

const usageStats = computed(() => {
  return billingService.getUsageStats()
})

const totalInputTokens = computed(() => {
  return usageStats.value.totalInputTokens
})

const totalOutputTokens = computed(() => {
  return usageStats.value.totalOutputTokens
})

const totalTokens = computed(() => {
  return totalInputTokens.value + totalOutputTokens.value
})

// 使用记录数据
const billingRecords = ref([])

// 加载计费记录
const loadBillingRecords = () => {
  try {
    billingRecords.value = billingService.getBillingRecords()
    
    // 如果没有数据，可选择是否添加示例数据
    if (billingRecords.value.length === 0) {
      console.log('暂无使用记录')
    }
  } catch (error) {
    console.error('加载使用记录失败:', error)
    billingRecords.value = []
  }
}

// 计算属性
const filteredRecords = computed(() => {
  let result = billingRecords.value
  
  // 类型筛选
  if (typeFilter.value !== 'all') {
    result = result.filter(record => record.type === typeFilter.value)
  }
  
  // 模型筛选
  if (modelFilter.value !== 'all') {
    result = result.filter(record => record.model.toLowerCase().includes(modelFilter.value))
  }
  
  // 日期筛选
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value
    result = result.filter(record => {
      const recordDate = new Date(record.timestamp)
      return recordDate >= start && recordDate <= end
    })
  }
  
  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(record => 
      record.content.toLowerCase().includes(keyword) ||
      (record.response && record.response.toLowerCase().includes(keyword))
    )
  }
  
  return result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
})

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredRecords.value.slice(start, end)
})

const totalFilteredTokens = computed(() => {
  return filteredRecords.value.reduce((sum, record) => sum + record.totalTokens, 0)
})

// 方法
const formatNumber = (num) => {
  return num.toLocaleString()
}

const formatDateTime = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

const getTypeColor = (type) => {
  const colors = {
    generation: 'primary',
    polish: 'success',
    outline: 'warning',
    chat: 'info'
  }
  return colors[type] || 'default'
}

const getTypeText = (type) => {
  const texts = {
    generation: '文本生成',
    polish: '文本润色',
    outline: '大纲生成',
    chat: '对话聊天'
  }
  return texts[type] || '未知'
}

const getStatusColor = (status) => {
  const colors = {
    success: 'success',
    failed: 'danger',
    pending: 'warning'
  }
  return colors[status] || 'default'
}

const getStatusText = (status) => {
  const texts = {
    success: '成功',
    failed: '失败',
    pending: '处理中'
  }
  return texts[status] || '未知'
}

const exportBilling = () => {
  try {
    const data = billingService.exportBillingData('csv')
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `token_usage_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('使用统计导出成功！')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  }
}

const viewRecordDetails = (record) => {
  selectedRecord.value = record
  showDetailsDialog.value = true
}

const copyContent = async (content) => {
  try {
    await navigator.clipboard.writeText(content)
    ElMessage.success('内容已复制到剪贴板')
  } catch (error) {
    // 降级处理：创建临时textarea进行复制
    const textarea = document.createElement('textarea')
    textarea.value = content
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success('内容已复制到剪贴板')
  }
}

// 生命周期
onMounted(() => {
  // 加载使用记录
  loadBillingRecords()
})
</script>

<style scoped>
.token-billing {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-content h1 {
  margin: 0 0 5px 0;
  font-size: 24px;
  color: #303133;
}

.header-content p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.account-overview {
  margin-bottom: 20px;
}

.overview-card {
  height: 100%;
}

.overview-card.usage :deep(.el-card__body) {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.overview-card.input :deep(.el-card__body) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.overview-card.output :deep(.el-card__body) {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.overview-card.total :deep(.el-card__body) {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.overview-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.overview-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.overview-content {
  flex: 1;
}

.overview-value {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 5px;
}

.overview-label {
  font-size: 14px;
  opacity: 0.9;
}

.statistics-section {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.time-filter {
  margin-left: auto;
}

.statistics-content {
  padding: 20px 0;
}

.chart-container {
  text-align: center;
}

.chart-container h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #606266;
}

.chart-placeholder {
  height: 200px;
  background: #f8f9fa;
  border: 2px dashed #e9ecef;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  font-size: 14px;
}

.filter-section {
  margin-bottom: 20px;
}

.filter-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.filter-left {
  display: flex;
  gap: 15px;
  align-items: center;
}

.billing-records {
  margin-bottom: 20px;
}

.record-stats {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #606266;
}

.content-preview {
  color: #606266;
  font-size: 13px;
}

.model-name {
  font-weight: 500;
  color: #409eff;
}

.cost-amount {
  font-weight: 600;
  color: #e6a23c;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.record-details {
  max-height: 500px;
  overflow-y: auto;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-item label {
  font-weight: 600;
  color: #606266;
  min-width: 80px;
}

.content-section,
.response-section {
  margin-bottom: 20px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.content-section h4,
.response-section h4 {
  margin: 0;
  font-size: 14px;
  color: #303133;
}

.content-box {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 15px;
  font-size: 13px;
  line-height: 1.5;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>