<template>
  <div class="app-container">
    <header class="header">
      <div class="logo-box">
        <img src="/v5_logo.jpg" class="logo-img" />
      </div>

      <!-- 選單 -->
      <nav class="nav-menu">
        <ul>
          <li
            :class="{ active: $route.name === 'Home' }"
            @click="goToPage('Home')">
            DICOM List
          </li>
          <li
            :class="{ active: $route.name === 'CAD' }"
            @click="goToPage('CAD')">
            CAD Config
          </li>
          <li
            :class="{ active: $route.name === 'History' }"
            @click="goToPage('History')">
            History
          </li>
          <li
            :class="{ active: $route.name === 'System' }"
            @click="goToPage('System')">
            System
          </li>
        </ul>
      </nav>

      <div class="avatar-box">
        <img src="/user.png" alt="User Avatar" class="avatar-img" />
      </div>
    </header>

    <main class="main-content">
      <router-view></router-view>
    </main>
  </div>
</template>

<script>
export default {
  name: 'App',
  methods: {
    goToPage(name) {
      this.$router.push({ name });
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
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  padding: 0 20px;
  height: 68px;
}

.logo-box {
  display: flex;
  align-items: center;
}

.logo-img {
  height: 40px;
  width: auto;
  object-fit: contain;
}

.nav-menu {
  flex-grow: 1;
  display: flex;
  align-items: stretch;
  justify-content: center;
}

.nav-menu ul {
  display: flex;
  align-items: stretch;
  gap: 48px; /* 選單間距 */
  padding: 0;
  margin: 0;
  list-style: none;
}

.nav-menu li {
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-weight: bold;
  color: black;
  cursor: pointer;
  position: relative;
  transition: background 0.2s, color 0.2s;
}

/* hover 效果 */
.nav-menu li:hover {
  background-color: #f0f0f0;
}

/* 被選中選單 */
.nav-menu li.active {
  background-color: #0892D0;
  color: white;
}

.nav-menu li.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  height: 0%;
  width: 100%;
  background-color: #0892D0;
  z-index: -1;
  border-bottom: 4px solid #0892D0;
  border-radius: 0;
}

/* 避免遮住文字 */
.nav-menu li.active {
  z-index: 1;
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
