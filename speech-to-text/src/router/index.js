/* eslint-disable */
import Vue from "vue";
import VueRouter from "vue-router";
const HelloWorld = () => import(/* webpackChunkName: "HelloWorld" */ "../components/HelloWorld.vue");
// const Auth = () => import(/* webpackChunkName: "Auth" */ "../components/Auth.vue");

Vue.use(VueRouter);

const routes = [
    // {
    //     path: "/",
    //     name: "Auth",
    //     component: Auth,
    // },
    {
        path: "/",
        name: "HelloWorld",
        component: HelloWorld,
    },
];

const router = new VueRouter({
    routes,
});

export default router;
