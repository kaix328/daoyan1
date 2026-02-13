<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

onMounted(() => {
  // 页面加载完成后检查公告
})
</script>

<style>
#app {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}
</style>