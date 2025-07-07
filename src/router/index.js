import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue'; // 主頁面，顯示選單和內容區域
import AboutView from '../views/AboutView.vue'; // 檔案詳情頁

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView, // 這是主頁，顯示選單和內容區域
  },
  {
    path: '/file/:name',  // 檔案頁面，顯示檔案詳細內容
    name: 'FilePage',  // 更改路由名稱為 FilePage
    component: AboutView,
    props: true, // 使路由參數作為 props 傳遞
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
