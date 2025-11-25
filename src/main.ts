import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueSafeHTML from 'vue-safe-html'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(VueSafeHTML, {
  allowedTags: [
    'div',
    'p',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'br',
    'strong',
    'em',
    'a',
    'span',
    'img',
    'i',
  ],
  allowedAttributes: ['class', 'style', 'href', 'target'],
})
app.use(router)

app.mount('#app')
