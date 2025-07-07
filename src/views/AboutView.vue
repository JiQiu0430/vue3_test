<template>
  <div class="file-page">
    <h1>File Page</h1>
    <p>Viewing file: {{ name }}</p>
  </div>
</template>

<script>
export default {
  props: ['name'],  // 接收路由傳遞的 name 參數
}
</script>

<style scoped>
.file-page {
  text-align: center;
  color: white;
}
h1 {
  font-size: 30px;
}
</style>