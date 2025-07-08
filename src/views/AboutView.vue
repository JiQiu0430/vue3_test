<template>
  <div class="about-page">
    <h1>Hello, {{ id }}!</h1>
    <p>Welcome to the temporary page.</p>
  </div>
</template>

<script>
export default {
  props: ['id'],
};
</script>

<style scoped>
.about-page {
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
