import { createRouter, createWebHistory } from "vue-router";
import DesktopView from "../views/DesktopView.vue";

const routes = [
  { path: "/", redirect: "/app/agent" },
  { path: "/app/:id", component: DesktopView },
  { path: "/:pathMatch(.*)*", redirect: "/" }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export {
  router
};
