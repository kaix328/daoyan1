<template>
  <div class="corpus-manager">
    <div class="corpus-header">
      <h3>语料库管理</h3>
      <div class="header-actions">
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :show-file-list="false"
          accept=".txt,.md,.json"
          @change="handleFileUpload"
        >
          <el-button type="primary" size="small">
            <el-icon><Upload /></el-icon>
            导入文件
          </el-button>
        </el-upload>
        <el-button size="small" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          添加文本
        </el-button>
        <el-button size="small" @click="exportCorpus" :disabled="corpus.length === 0">
          <el-icon><Download /></el-icon>
          导出语料
        </el-button>
        <el-button size="small" type="danger" @click="clearCorpus" :disabled="corpus.length === 0">
          <el-icon><Delete /></el-icon>
          清空
        </el-button>
      </div>
    </div>
    <!-- 添加语料区域 -->
    <div class="add-corpus-section">
      <h3 class="section-title">添加语料</h3>
      <div class="add-methods">
        <el-tabs v-model="activeTab" class="corpus-tabs">
          <el-tab-pane label="文本输入" name="text">
            <div class="text-input-area">
              <el-input
                v-model="newCorpusText"
                type="textarea"
                :rows="6"
                placeholder="请输入您的文本语料，可以是小说片段、写作风格样本等..."
                maxlength="5000"
                show-word-limit
              />
              <div class="input-actions">
                <el-button 
                  type="primary" 
                  @click="addTextCorpus"
                  :disabled="!newCorpusText.trim()"
                >
                  <el-icon class="mr-2"><Plus /></el-icon>
                  添加语料
                </el-button>
                <el-button @click="clearInput">
                  <el-icon class="mr-2"><Delete /></el-icon>
                  清空
                </el-button>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="文件上传" name="file">
            <div class="file-upload-area">
              <el-upload
                class="upload-demo"
                drag
                :auto-upload="false"
                :on-change="handleFileChange"
                :show-file-list="false"
                accept=".txt,.md"
              >
                <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                <div class="el-upload__text">
                  将文件拖到此处，或<em>点击上传</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip">
                    支持 .txt 和 .md 格式文件，文件大小不超过 10MB
                  </div>
                </template>
              </el-upload>
              
              <div v-if="uploadedFile" class="uploaded-file">
                <div class="file-info">
                  <el-icon class="file-icon"><Document /></el-icon>
                  <span class="file-name">{{ uploadedFile.name }}</span>
                  <span class="file-size">({{ formatFileSize(uploadedFile.size) }})</span>
                </div>
                <div class="file-actions">
                  <el-button type="primary" @click="processUploadedFile">
                    <el-icon class="mr-2"><Check /></el-icon>
                    处理文件
                  </el-button>
                  <el-button @click="removeUploadedFile">
                    <el-icon class="mr-2"><Close /></el-icon>
                    移除
                  </el-button>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 语料库列表 -->
    <div class="corpus-list-section">
      <div class="list-header">
        <h3 class="section-title">语料库 ({{ corpus.length }})</h3>
        <div class="list-actions">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索语料..."
            style="width: 200px"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button 
            type="danger" 
            :disabled="corpus.length === 0"
            @click="clearAllCorpus"
          >
            <el-icon class="mr-2"><Delete /></el-icon>
            清空全部
          </el-button>
        </div>
      </div>

      <div v-if="filteredCorpus.length === 0" class="empty-corpus">
        <el-icon class="empty-icon"><Collection /></el-icon>
        <p v-if="corpus.length === 0">暂无语料数据</p>
        <p v-else>没有找到匹配的语料</p>
        <p class="empty-tip">添加语料可以帮助AI更好地学习您的写作风格</p>
      </div>

      <div v-else class="corpus-list">
        <div 
          v-for="item in paginatedCorpus" 
          :key="item.id" 
          class="corpus-item"
        >
          <div class="corpus-header">
            <div class="corpus-meta">
              <span class="corpus-id">#{{ item.id }}</span>
              <span class="corpus-date">{{ formatDate(item.createdAt) }}</span>
              <span class="corpus-length">{{ item.content.length }} 字</span>
            </div>
            <div class="corpus-actions">
              <el-button 
                type="text" 
                size="small" 
                @click="editCorpus(item)"
              >
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button 
                type="text" 
                size="small" 
                @click="copyCorpus(item.content)"
              >
                <el-icon><CopyDocument /></el-icon>
              </el-button>
              <el-button 
                type="text" 
                size="small" 
                @click="deleteCorpus(item.id)"
                class="delete-btn"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          <div class="corpus-content">
            <div class="content-preview">
              {{ getContentPreview(item.content) }}
            </div>
            <div v-if="item.content.length > 200" class="expand-btn">
              <el-button 
                type="text" 
                size="small" 
                @click="showFullContent(item)"
              >
                查看全文
              </el-button>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="filteredCorpus.length"
            layout="prev, pager, next"
            small
          />
        </div>
      </div>
    </div>

    <!-- 编辑语料对话框 -->
    <el-dialog 
      v-model="showEditDialog" 
      title="编辑语料" 
      width="600px"
      :before-close="cancelEdit"
    >
      <el-input
        v-model="editingCorpus.content"
        type="textarea"
        :rows="10"
        placeholder="请输入语料内容..."
        maxlength="5000"
        show-word-limit
      />
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelEdit">取消</el-button>
          <el-button type="primary" @click="saveEdit">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 查看全文对话框 -->
    <el-dialog 
      v-model="showContentDialog" 
      title="语料全文" 
      width="700px"
    >
      <div class="full-content">
        {{ viewingContent }}
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, UploadFilled, Document, Check, Close, Edit, Download, Upload } from '@element-plus/icons-vue'
import { useNovelStore } from '../stores/novel.js'

const novelStore = useNovelStore()

// 响应式数据
const activeTab = ref('text')
const newCorpusText = ref('')
const uploadedFile = ref(null)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(5)
const showEditDialog = ref(false)
const showContentDialog = ref(false)
const editingCorpus = ref({ id: null, content: '' })
const viewingContent = ref('')

// 计算属性
const corpus = computed(() => novelStore.corpus)

const filteredCorpus = computed(() => {
  if (!searchKeyword.value.trim()) {
    return corpus.value
  }
  return corpus.value.filter(item => 
    item.content.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

const totalPages = computed(() => {
  return Math.ceil(filteredCorpus.value.length / pageSize.value)
})

const paginatedCorpus = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredCorpus.value.slice(start, end)
})

// 方法
const addTextCorpus = () => {
  if (!newCorpusText.value.trim()) {
    ElMessage.warning('请输入语料内容')
    return
  }
  
  novelStore.addCorpus(newCorpusText.value.trim())
  newCorpusText.value = ''
  ElMessage.success('语料添加成功')
}

const clearInput = () => {
  newCorpusText.value = ''
}

const handleFileChange = (file) => {
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过 10MB')
    return
  }
  
  const allowedTypes = ['text/plain', 'text/markdown']
  if (!allowedTypes.includes(file.raw.type) && 
      !file.name.endsWith('.txt') && 
      !file.name.endsWith('.md')) {
    ElMessage.error('只支持 .txt 和 .md 格式文件')
    return
  }
  
  uploadedFile.value = file
}

const removeUploadedFile = () => {
  uploadedFile.value = null
}

const processUploadedFile = () => {
  if (!uploadedFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target.result
    if (content.trim()) {
      novelStore.addCorpus(content.trim())
      ElMessage.success('文件处理成功，语料已添加')
      uploadedFile.value = null
    } else {
      ElMessage.error('文件内容为空')
    }
  }
  reader.onerror = () => {
    ElMessage.error('文件读取失败')
  }
  reader.readAsText(uploadedFile.value.raw, 'UTF-8')
}

const formatFileSize = (size) => {
  if (size < 1024) {
    return size + ' B'
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(1) + ' KB'
  } else {
    return (size / (1024 * 1024)).toFixed(1) + ' MB'
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getContentPreview = (content) => {
  return content.length > 200 ? content.substring(0, 200) + '...' : content
}

const editCorpus = (item) => {
  editingCorpus.value = { id: item.id, content: item.content }
  showEditDialog.value = true
}

const cancelEdit = () => {
  showEditDialog.value = false
  editingCorpus.value = { id: null, content: '' }
}

const saveEdit = () => {
  if (!editingCorpus.value.content.trim()) {
    ElMessage.warning('语料内容不能为空')
    return
  }
  
  const index = corpus.value.findIndex(item => item.id === editingCorpus.value.id)
  if (index > -1) {
    corpus.value[index].content = editingCorpus.value.content.trim()
    ElMessage.success('语料更新成功')
    showEditDialog.value = false
    editingCorpus.value = { id: null, content: '' }
  }
}

const copyCorpus = async (content) => {
  try {
    await navigator.clipboard.writeText(content)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const deleteCorpus = async (id) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条语料吗？',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    novelStore.removeCorpus(id)
    ElMessage.success('删除成功')
    
    // 如果当前页没有数据了，回到上一页
    if (paginatedCorpus.value.length === 0 && currentPage.value > 1) {
      currentPage.value--
    }
  } catch {
    // 用户取消删除
  }
}

// 新增功能方法
const handleFileUpload = async (file) => {
  try {
    if (file.name.endsWith('.json')) {
      // 导入语料库文件
      await novelStore.importCorpus(file.raw)
      ElMessage.success('语料库导入成功')
    } else {
      // 导入文本文件
      await novelStore.addCorpusFromFile(file.raw)
      ElMessage.success('文件导入成功')
    }
  } catch (error) {
    ElMessage.error('文件导入失败：' + error.message)
  }
}

const exportCorpus = () => {
  novelStore.exportCorpus()
  ElMessage.success('语料库导出成功')
}

const clearCorpus = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有语料吗？此操作不可恢复。',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 清空语料库
    novelStore.corpus.forEach(item => novelStore.removeCorpus(item.id))
    ElMessage.success('语料库已清空')
  } catch {
    // 用户取消
  }
}

const clearAllCorpus = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有语料吗？此操作不可恢复。',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    corpus.value.splice(0)
    currentPage.value = 1
    ElMessage.success('已清空所有语料')
  } catch {
    // 用户取消清空
  }
}

const showFullContent = (item) => {
  viewingContent.value = item.content
  showContentDialog.value = true
}
</script>

<style scoped>
.corpus-manager {
  max-height: 70vh;
  overflow-y: auto;
}

.add-corpus-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.corpus-tabs {
  margin-top: 16px;
}

.text-input-area {
  padding: 16px 0;
}

.input-actions {
  margin-top: 12px;
  display: flex;
  gap: 12px;
}

.file-upload-area {
  padding: 16px 0;
}

.uploaded-file {
  margin-top: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.file-info {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.file-icon {
  margin-right: 8px;
  color: #409eff;
}

.file-name {
  font-weight: 500;
  margin-right: 8px;
}

.file-size {
  color: #909399;
  font-size: 12px;
}

.file-actions {
  display: flex;
  gap: 8px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.list-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.empty-corpus {
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

.corpus-list {
  space-y: 12px;
}

.corpus-item {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  margin-bottom: 12px;
}

.corpus-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.corpus-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

.corpus-id {
  font-weight: 500;
  color: #409eff;
}

.corpus-actions {
  display: flex;
  gap: 4px;
}

.delete-btn {
  color: #f56c6c;
}

.delete-btn:hover {
  color: #f56c6c;
}

.corpus-content {
  line-height: 1.6;
  color: #303133;
}

.content-preview {
  white-space: pre-wrap;
  word-break: break-word;
}

.expand-btn {
  margin-top: 8px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.full-content {
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 400px;
  overflow-y: auto;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: 120px;
}

:deep(.el-tabs__content) {
  padding: 0;
}
</style>