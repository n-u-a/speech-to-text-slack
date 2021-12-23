/* eslint-disable */
import Vue from "vue";
import VueRouter from "vue-router";
const Transcript = () => import(/* webpackChunkName: "Transcript" */ "../components/Transcript.vue");
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
        name: "Transcript",
        component: Transcript,
    },
];

const router = new VueRouter({
    routes,
});

export default router;
