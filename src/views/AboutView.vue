<template>
  <div class="hello-page">
    <h1>Hello, {{ name }}!</h1> <!-- 顯示傳遞過來的檔案名稱 -->
    <p>Welcome to the temporary page.</p>
  </div>
</template>

<script>
export default {
  props: ['name'], // 接收路由參數 name
};
</script>

<style scoped>
.hello-page {
  text-align: center;
  margin-top: 50px;
  color: white;
}

h1 {
  font-size: 30px;
}

p {
  font-size: 20px;
}
</style>
