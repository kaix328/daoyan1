<template>
  <div class="backup-manager">
    <div class="backup-header">
      <h3>💾 备份管理</h3>
      <div class="header-actions">
        <el-button type="primary" @click="createBackup">
          <el-icon><FolderAdd /></el-icon>
          创建备份
        </el-button>
        <el-button @click="importBackup">
          <el-icon><Upload /></el-icon>
          导入备份
        </el-button>
      </div>
    </div>

    <!-- 备份统计 -->
    <div class="backup-stats">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon><Files /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ backups.length }}</div>
              <div class="stat-label">总备份数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ lastBackupDays }}</div>
              <div class="stat-label">距上次备份</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon><Coin /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ totalBackupSize }}</div>
              <div class="stat-label">总大小</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon><Setting /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ autoBackupEnabled ? '开启' : '关闭' }}</div>
              <div class="stat-label">自动备份</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 自动备份设置 -->
    <el-card class="auto-backup-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>⚙️ 自动备份设置</span>
          <el-switch 
            v-model="autoBackupEnabled" 
            @change="toggleAutoBackup"
            active-text="开启"
            inactive-text="关闭"
          />
        </div>
      </template>
      
      <div v-if="autoBackupEnabled" class="auto-backup-settings">
        <el-row :gutter="16">
          <el-col :span="8">
            <div class="setting-item">
              <label>备份频率</label>
              <el-select v-model="autoBackupFrequency" @change="saveAutoBackupSettings">
                <el-option label="每小时" value="hourly" />
                <el-option label="每天" value="daily" />
                <el-option label="每周" value="weekly" />
              </el-select>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="setting-item">
              <label>保留数量</label>
              <el-input-number 
                v-model="maxBackupCount" 
                :min="1" 
                :max="50"
                @change="saveAutoBackupSettings"
              />
            </div>
          </el-col>
          <el-col :span="8">
            <div class="setting-item">
              <label>下次备份</label>
              <div class="next-backup-time">{{ nextBackupTime }}</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 备份列表 -->
    <div class="backup-list">
      <div class="list-header">
        <h4>📋 备份列表</h4>
        <div class="list-actions">
          <el-input 
            v-model="searchKeyword" 
            placeholder="搜索备份..."
            size="small"
            style="width: 200px;"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button size="small" @click="cleanupOldBackups">
            <el-icon><Delete /></el-icon>
            清理旧备份
          </el-button>
        </div>
      </div>

      <div v-if="filteredBackups.length === 0" class="empty-state">
        <el-empty description="暂无备份文件" />
      </div>
      
      <div v-else class="backups-table">
        <el-table :data="filteredBackups" stripe>
          <el-table-column prop="name" label="备份名称" min-width="200">
            <template #default="{ row }">
              <div class="backup-name">
                <el-icon><Document /></el-icon>
                <span>{{ row.name }}</span>
                <el-tag v-if="row.type === 'auto'" type="info" size="small">自动</el-tag>
                <el-tag v-else type="primary" size="small">手动</el-tag>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="description" label="描述" min-width="150">
            <template #default="{ row }">
              <span>{{ row.description || '无描述' }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="size" label="大小" width="100">
            <template #default="{ row }">
              <span>{{ formatFileSize(row.size) }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">
              <span>{{ formatDateTime(row.createdAt) }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <div class="table-actions">
                <el-button type="text" size="small" @click="restoreBackup(row)">
                  <el-icon><RefreshRight /></el-icon>
                  恢复
                </el-button>
                <el-button type="text" size="small" @click="downloadBackup(row)">
                  <el-icon><Download /></el-icon>
                  下载
                </el-button>
                <el-button type="text" size="small" @click="viewBackupDetails(row)">
                  <el-icon><View /></el-icon>
                  详情
                </el-button>
                <el-button type="text" size="small" @click="deleteBackup(row.id)" class="danger">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 创建备份对话框 -->
    <el-dialog v-model="showCreateBackupDialog" title="创建备份" width="500px">
      <el-form :model="backupForm" :rules="backupRules" ref="backupFormRef" label-width="80px">
        <el-form-item label="备份名称" prop="name">
          <el-input v-model="backupForm.name" placeholder="输入备份名称" />
        </el-form-item>
        
        <el-form-item label="备份描述">
          <el-input 
            v-model="backupForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="描述这次备份的内容或原因"
          />
        </el-form-item>
        
        <el-form-item label="备份内容">
          <el-checkbox-group v-model="backupForm.content">
            <el-checkbox label="novel">小说内容</el-checkbox>
            <el-checkbox label="chapters">章节管理</el-checkbox>
            <el-checkbox label="templates">模板数据</el-checkbox>
            <el-checkbox label="corpus">语料库</el-checkbox>
            <el-checkbox label="characters">角色设定</el-checkbox>
            <el-checkbox label="worldSettings">世界观设定</el-checkbox>
            <el-checkbox label="goals">写作目标</el-checkbox>
            <el-checkbox label="settings">应用设置</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateBackupDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmCreateBackup" :loading="creating">创建</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 备份详情对话框 -->
    <el-dialog v-model="showBackupDetailsDialog" title="备份详情" width="600px">
      <div v-if="selectedBackup" class="backup-details">
        <div class="detail-section">
          <h4>基本信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="备份名称">{{ selectedBackup.name }}</el-descriptions-item>
            <el-descriptions-item label="备份类型">
              <el-tag :type="selectedBackup.type === 'auto' ? 'info' : 'primary'">
                {{ selectedBackup.type === 'auto' ? '自动备份' : '手动备份' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="文件大小">{{ formatFileSize(selectedBackup.size) }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDateTime(selectedBackup.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="描述" :span="2">{{ selectedBackup.description || '无描述' }}</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="detail-section">
          <h4>备份内容</h4>
          <div class="content-list">
            <div v-for="item in selectedBackup.contentList" :key="item.key" class="content-item">
              <el-icon><Document /></el-icon>
              <span>{{ item.name }}</span>
              <span class="content-size">({{ formatFileSize(item.size) }})</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useNovelStore } from '@/stores/novel'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  FolderAdd, Upload, Files, Clock, Coin, Setting, Search, Delete,
  Document, RefreshRight, Download, View
} from '@element-plus/icons-vue'

const novelStore = useNovelStore()

// 响应式数据
const backups = ref([])
const searchKeyword = ref('')
const autoBackupEnabled = ref(false)
const autoBackupFrequency = ref('daily')
const maxBackupCount = ref(10)
const showCreateBackupDialog = ref(false)
const showBackupDetailsDialog = ref(false)
const selectedBackup = ref(null)
const creating = ref(false)
const backupFormRef = ref()

const backupForm = ref({
  name: '',
  description: '',
  content: ['novel', 'chapters', 'templates', 'corpus']
})

const backupRules = {
  name: [
    { required: true, message: '请输入备份名称', trigger: 'blur' }
  ]
}

// 计算属性
const filteredBackups = computed(() => {
  if (!searchKeyword.value) return backups.value
  return backups.value.filter(backup => 
    backup.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    (backup.description && backup.description.toLowerCase().includes(searchKeyword.value.toLowerCase()))
  )
})

const lastBackupDays = computed(() => {
  if (backups.value.length === 0) return '无'
  const lastBackup = backups.value[0]
  const days = Math.floor((Date.now() - new Date(lastBackup.createdAt)) / (1000 * 60 * 60 * 24))
  return days === 0 ? '今天' : `${days}天前`
})

const totalBackupSize = computed(() => {
  const total = backups.value.reduce((sum, backup) => sum + backup.size, 0)
  return formatFileSize(total)
})

const nextBackupTime = computed(() => {
  if (!autoBackupEnabled.value) return '未开启'
  // 这里应该根据频率计算下次备份时间
  return '2小时后'
})

// 方法
const createBackup = () => {
  backupForm.value.name = `备份_${new Date().toLocaleString().replace(/[/:]/g, '-')}`
  showCreateBackupDialog.value = true
}

const confirmCreateBackup = async () => {
  try {
    await backupFormRef.value.validate()
    creating.value = true
    
    // 收集要备份的数据
    const backupData = {}
    const contentList = []
    
    if (backupForm.value.content.includes('novel')) {
      backupData.novel = novelStore.currentNovel
      contentList.push({ key: 'novel', name: '小说内容', size: new Blob([novelStore.currentNovel || '']).size })
    }
    
    if (backupForm.value.content.includes('chapters')) {
      const chapters = JSON.parse(localStorage.getItem('novel_chapters') || '[]')
      backupData.chapters = chapters
      contentList.push({ key: 'chapters', name: '章节管理', size: new Blob([JSON.stringify(chapters)]).size })
    }
    
    if (backupForm.value.content.includes('templates')) {
      backupData.templates = novelStore.templates
      contentList.push({ key: 'templates', name: '模板数据', size: new Blob([JSON.stringify(novelStore.templates)]).size })
    }
    
    if (backupForm.value.content.includes('corpus')) {
      backupData.corpus = novelStore.corpus
      contentList.push({ key: 'corpus', name: '语料库', size: new Blob([JSON.stringify(novelStore.corpus)]).size })
    }
    
    if (backupForm.value.content.includes('characters')) {
      backupData.characters = novelStore.characters
      contentList.push({ key: 'characters', name: '角色设定', size: new Blob([JSON.stringify(novelStore.characters)]).size })
    }
    
    if (backupForm.value.content.includes('worldSettings')) {
      backupData.worldSettings = novelStore.worldSettings
      contentList.push({ key: 'worldSettings', name: '世界观设定', size: new Blob([JSON.stringify(novelStore.worldSettings)]).size })
    }
    
    if (backupForm.value.content.includes('goals')) {
      const goals = JSON.parse(localStorage.getItem('writingGoals') || '[]')
      backupData.goals = goals
      contentList.push({ key: 'goals', name: '写作目标', size: new Blob([JSON.stringify(goals)]).size })
    }
    
    if (backupForm.value.content.includes('settings')) {
      const settings = {
        apiConfig: novelStore.apiConfig,
        autoBackupSettings: { autoBackupEnabled: autoBackupEnabled.value, autoBackupFrequency: autoBackupFrequency.value, maxBackupCount: maxBackupCount.value }
      }
      backupData.settings = settings
      contentList.push({ key: 'settings', name: '应用设置', size: new Blob([JSON.stringify(settings)]).size })
    }
    
    // 创建备份记录
    const backup = {
      id: Date.now(),
      name: backupForm.value.name,
      description: backupForm.value.description,
      type: 'manual',
      size: new Blob([JSON.stringify(backupData)]).size,
      data: backupData,
      contentList: contentList,
      createdAt: new Date()
    }
    
    backups.value.unshift(backup)
    saveBackups()
    
    showCreateBackupDialog.value = false
    resetBackupForm()
    ElMessage.success('备份创建成功')
  } catch (error) {
    console.error('创建备份失败:', error)
    ElMessage.error('创建备份失败')
  } finally {
    creating.value = false
  }
}

const restoreBackup = async (backup) => {
  try {
    await ElMessageBox.confirm(
      `确定要恢复备份 "${backup.name}" 吗？这将覆盖当前的数据。`,
      '确认恢复',
      { type: 'warning' }
    )
    
    const data = backup.data
    
    // 恢复各种数据
    if (data.novel) {
      novelStore.setCurrentNovel(data.novel)
    }
    
    if (data.chapters) {
      localStorage.setItem('novel_chapters', JSON.stringify(data.chapters))
    }
    
    if (data.templates) {
      novelStore.templates = data.templates
    }
    
    if (data.corpus) {
      novelStore.corpus = data.corpus
    }
    
    if (data.characters) {
      novelStore.characters = data.characters
    }
    
    if (data.worldSettings) {
      novelStore.worldSettings = data.worldSettings
    }
    
    if (data.goals) {
      localStorage.setItem('writingGoals', JSON.stringify(data.goals))
    }
    
    if (data.settings) {
      if (data.settings.apiConfig) {
        Object.assign(novelStore.apiConfig, data.settings.apiConfig)
      }
      if (data.settings.autoBackupSettings) {
        autoBackupEnabled.value = data.settings.autoBackupSettings.autoBackupEnabled
        autoBackupFrequency.value = data.settings.autoBackupSettings.autoBackupFrequency
        maxBackupCount.value = data.settings.autoBackupSettings.maxBackupCount
      }
    }
    
    ElMessage.success('备份恢复成功')
  } catch {
    // 用户取消
  }
}

const downloadBackup = (backup) => {
  const data = JSON.stringify(backup.data, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${backup.name}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('备份下载成功')
}

const viewBackupDetails = (backup) => {
  selectedBackup.value = backup
  showBackupDetailsDialog.value = true
}

const deleteBackup = async (backupId) => {
  try {
    await ElMessageBox.confirm('确定要删除这个备份吗？', '确认删除', {
      type: 'warning'
    })
    
    backups.value = backups.value.filter(backup => backup.id !== backupId)
    saveBackups()
    ElMessage.success('备份删除成功')
  } catch {
    // 用户取消
  }
}

const importBackup = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const backupData = JSON.parse(e.target.result)
          
          // 创建导入的备份记录
          const backup = {
            id: Date.now(),
            name: `导入_${file.name.replace('.json', '')}`,
            description: '从文件导入的备份',
            type: 'manual',
            size: file.size,
            data: backupData,
            contentList: Object.keys(backupData).map(key => ({
              key,
              name: getContentName(key),
              size: new Blob([JSON.stringify(backupData[key])]).size
            })),
            createdAt: new Date()
          }
          
          backups.value.unshift(backup)
          saveBackups()
          ElMessage.success('备份导入成功')
        } catch (error) {
          ElMessage.error('导入失败，文件格式错误')
        }
      }
      reader.readAsText(file)
    }
  }
  input.click()
}

const cleanupOldBackups = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要清理超过 ${maxBackupCount.value} 个的旧备份吗？`,
      '确认清理',
      { type: 'warning' }
    )
    
    if (backups.value.length > maxBackupCount.value) {
      const removed = backups.value.length - maxBackupCount.value
      backups.value = backups.value.slice(0, maxBackupCount.value)
      saveBackups()
      ElMessage.success(`已清理 ${removed} 个旧备份`)
    } else {
      ElMessage.info('没有需要清理的备份')
    }
  } catch {
    // 用户取消
  }
}

const toggleAutoBackup = (enabled) => {
  autoBackupEnabled.value = enabled
  saveAutoBackupSettings()
  ElMessage.success(enabled ? '自动备份已开启' : '自动备份已关闭')
}

const saveAutoBackupSettings = () => {
  const settings = {
    autoBackupEnabled: autoBackupEnabled.value,
    autoBackupFrequency: autoBackupFrequency.value,
    maxBackupCount: maxBackupCount.value
  }
  localStorage.setItem('auto_backup_settings', JSON.stringify(settings))
}

const loadAutoBackupSettings = () => {
  try {
    const saved = localStorage.getItem('auto_backup_settings')
    if (saved) {
      const settings = JSON.parse(saved)
      autoBackupEnabled.value = settings.autoBackupEnabled || false
      autoBackupFrequency.value = settings.autoBackupFrequency || 'daily'
      maxBackupCount.value = settings.maxBackupCount || 10
    }
  } catch (error) {
    console.error('加载自动备份设置失败:', error)
  }
}

const resetBackupForm = () => {
  backupForm.value = {
    name: '',
    description: '',
    content: ['novel', 'chapters', 'templates', 'corpus']
  }
}

const saveBackups = () => {
  // 只保存备份元数据，不保存实际数据（太大）
  const backupMeta = backups.value.map(backup => ({
    ...backup,
    data: undefined // 移除数据部分
  }))
  localStorage.setItem('backup_list', JSON.stringify(backupMeta))
}

const loadBackups = () => {
  try {
    const saved = localStorage.getItem('backup_list')
    if (saved) {
      backups.value = JSON.parse(saved)
    }
  } catch (error) {
    console.error('加载备份列表失败:', error)
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDateTime = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString()
}

const getContentName = (key) => {
  const nameMap = {
    novel: '小说内容',
    chapters: '章节管理',
    templates: '模板数据',
    corpus: '语料库',
    characters: '角色设定',
    worldSettings: '世界观设定',
    goals: '写作目标',
    settings: '应用设置'
  }
  return nameMap[key] || key
}

// 生命周期
onMounted(() => {
  loadBackups()
  loadAutoBackupSettings()
})
</script>

<style scoped>
.backup-manager {
  padding: 20px;
}

.backup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.backup-stats {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 20px;
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.auto-backup-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.auto-backup-settings {
  padding-top: 16px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-item label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.next-backup-time {
  font-size: 14px;
  color: #409eff;
  font-weight: 500;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.list-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.backup-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.table-actions .danger {
  color: #f56c6c;
}

.backup-details {
  max-height: 500px;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  margin-bottom: 12px;
  color: #303133;
}

.content-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.content-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.content-size {
  margin-left: auto;
  font-size: 12px;
  color: #909399;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #909399;
}
</style>