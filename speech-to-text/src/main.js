import Vue from 'vue'
import App from './App.vue'
import UIkit from 'uikit'
import Icons from 'uikit/dist/js/uikit-icons'
import 'uikit/dist/css/uikit.css'
import 'uikit/dist/css/uikit.min.css'
import jQuery from 'jquery'

Vue.config.productionTip = false

UIkit.use(Icons)

global.jquery = jQuery
global.$ = jQuery
window.$ = window.jQuery = require('jquery')

new Vue({
  render: h => h(App),
}).$mount('#app')
