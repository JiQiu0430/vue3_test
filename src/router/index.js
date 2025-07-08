import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue'; // 選單和內容區域
import AboutView from '../views/AboutView.vue'; // 檔案頁

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView, // 顯示選單和內容區域
  },
  {
    path: '/file/:id',
    name: 'FilePage',
    component: AboutView, // 顯示檔案內容
    props: true, // 使路由參數作為 props 傳遞
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
