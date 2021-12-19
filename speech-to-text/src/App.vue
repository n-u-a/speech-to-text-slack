<template>
  <div>
    <!-- <div id="app">
      <HelloWorld msg="Welcome to Your Vue.js App" />
    </div> -->
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script>
// import HelloWorld from "./components/HelloWorld.vue";
// import Auth from "./components/Auth.vue";

export default {
  name: "App",
  // components: {
  //   HelloWorld,
  //   Auth,
  // },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* text-align: center; */
  color: #2c3e50;
  margin-top: 60px;
}
</style>
