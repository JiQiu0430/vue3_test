<template>
  <div class="app-container">
    <header class="header">
      <div class="logo-box">
        <img src="/v5_logo.jpg" class="logo-img" />
      </div>

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
};
</script>

<style scoped>
.app-container {
  background: black;
  color: white;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  padding: 10px 16px;
  flex: 1;
  overflow-y: hidden;
  font-size: 13px;
}
</style>
