<template>
  <div class="app-container">
    <!-- 白色部分 -->
    <header class="header">
      <div class="logo-box">
        <img src="/v5_logo.jpg" class="logo-img" />
      </div>

      <!-- 橫向選單 -->
      <nav class="nav-menu">
        <ul>
          <li @click="goToHomePage">DICOM List</li>
          <li>CAD Config</li>
          <li>History</li>
          <li>System</li>
        </ul>
      </nav>

      <div class="avatar-box">
        <img src="/user.png" alt="User Avatar" class="avatar-img" />
      </div>
    </header>

    <!-- 黑色部分 -->
    <main class="main-content">
      <router-view></router-view> <!-- 顯示對應的頁面 -->
    </main>
  </div>
</template>

<script>
export default {
  name: 'App',
  methods: {
    // 跳轉到 DICOM List
    goToHomePage() {
      this.$router.push({ name: 'Home' });
    },
  },
};
</script>

<style scoped>
.app-container {
  background: black;
  color: white;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: white;
  color: black;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-box {
  display: flex;
  align-items: center;
}

.logo-img {
  height: 48px;
  width: auto;
  object-fit: contain;
}

.nav-menu {
  background-color: white;
  padding: 10px;
  list-style: none;
  display: flex;
  justify-content: space-around;
  flex-grow: 1;
}

.nav-menu ul {
  padding: 0;
  margin: 0;
  display: flex;
  list-style-type: none;
}

.nav-menu li {
  cursor: pointer;
  margin-right: 20px; /* 選單項目的間距 */
  font-weight: bold;
  color: black;
}

.nav-menu li:hover {
  color: #1e90ff; /* 鼠標點選的顏色 */
}

.avatar-box {
  display: flex;
  align-items: center;
}

.avatar-img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.main-content {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}
</style>
