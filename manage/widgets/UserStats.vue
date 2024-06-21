<script setup lang="ts">
import { ref, onMounted } from 'vue';
const props = defineProps({
  request: Function,
  apiUrl: String,
  data: Object
})
const plugin = 'system/plugins/karin-plugin-MysTool'
const request = props.request

const MysTools = ref([])
const plugins = ref({loading: true})
const Plugin = ref(true)
const User = ref(true)
const apiData: any = ref({
  ck_sk: {
    ck: { type: 'cookie', color: 'secondary', text: 'text-primary' },
    sk: { type: 'stoken', color: 'teal', text: 'text-warning' }
  },
  loading: true
})

const setUser = () => {
  User.value = !User.value
  if (User.value) {
    fetchUserStats()
  }
}

const setPlugin = () => {
  Plugin.value = !Plugin.value
  if (Plugin.value) {
    checkUpdate()
  }
}

const upPlugin = () => {
  plugins.value = {}
  request.post(`${props.apiUrl}/${plugin}/checkUpdate`, { force: true })
    .then((response) => {
      if (response.data.status === 'success') {
        plugins.value = response.data.data
      } else {
        plugins.value = {}
      }
    })
    .catch((error) => {
      plugins.value = {}
    })
}

const checkUpdate = () => {
  request.post(`${props.apiUrl}/${plugin}/checkUpdate`, { force: false })
    .then((response) => {
      if (response.data.status === 'success') {
        plugins.value = response.data.data
      } else {
        plugins.value = {}
      }
    })
    .catch((error) => {
      plugins.value = {}
    })
}

const pull = () => {
  request.post(`${props.apiUrl}/${plugin}/update`, { force: false })
    .then((response) => {
      if (response.data.status === 'success') {
        checkUpdate()
        props.snackbar.open('更新成功')
      } else {
        props.snackbar.open('更新失败', 'error')
      }
    })
    .catch((error) => {
      props.snackbar.open('接口错误', 'error')
    })
}

const pullForce = () => {
  request.post(`${props.apiUrl}/${plugin}/update`, { force: true })
    .then((response) => {
      if (response.data.status === 'success') {
        checkUpdate()
        props.snackbar.open('更新成功')
      } else {
        props.snackbar.open('更新失败', 'error')
      }
    })
    .catch((error) => {
      props.snackbar.open('接口错误', 'error')
    })
}

const refreshUserStats = () => {
  apiData.value.loading = true
  fetchUserStats()
}

const fetchUserStats = () => {
  request.get(`${props.apiUrl}/${plugin}/UserStats`)
    .then((response) => {
      if (response.data.status === 'success') {
        apiData.value = response.data.data
        apiData.value.loading = false
      } else {
        apiData.value = {}
      }
    })
    .catch((error) => {
      apiData.value = {}
    })
}

const getMysTools = () => {
  request.get(`${props.apiUrl}/${plugin}/MysTools`)
    .then((response) => {
      if (response.data.status === 'success') {
        MysTools.value = response.data.data
      } else {
        MysTools.value = []
      }
    })
    .catch((error) => {
      MysTools.value = []
    })
}

onMounted(() => {
  getMysTools()
  fetchUserStats()
  checkUpdate()
})
</script>

<template>
  <v-card elevation="0">
    <v-card variant="outlined">
      <v-card-text>
        <div class="d-flex">
          <div class="w-50">
            <div class="d-flex align-center">
              <v-btn @click="setUser" variant="flat" text class="text-h4 text-link">
                用户统计
                <v-icon>{{ User ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
              </v-btn>
              <v-btn @click="refreshUserStats" icon rounded="sm" color="darkteal" variant="flat" size="21" v-bind="props">
                <v-icon icon="mdi-refresh" stroke-width="1.5" size="18" />
              </v-btn>
              <h4 class="d-flex align-center text-h4 ml-auto">
                <v-icon icon="mdi-database-refresh" stroke-width="1.5" size="28"  v-if="apiData.loading"/>
                <v-icon icon="mdi-database-check" stroke-width="1.5" size="28"  v-if="!apiData.loading"/>
                <h4 class="text-success" v-if="!apiData.loading">{{ apiData.dialect }}</h4>
                <v-icon icon="mdi mdi-loading mdi-spin text-info ml-auto mr-auto" stroke-width="1.5" size="20" v-if="apiData.loading" />
              </h4>
            </div>
            <v-expand v-model="User">
              <v-expand-transition>
                <div v-if="User" class="d-flex flex-wrap flex-column">
                  <v-card v-for="value in apiData.ck_sk" elevation="0"
                    :class="['bg-' + value.color, 'overflow-hidden', 'bubble-shape', 'bubble-' + value.color + '-shape', 'mb-1']">
                    <v-card-text style="position: relative;">
                      <div class="d-inline-flex align-center justify-space-between w-100">
                        <h2 class="text-h1 font-weight-medium">
                          <v-icon icon="mdi mdi-loading mdi-spin" stroke-width="1.5" size="20" v-if="apiData.loading" />
                          {{ value.mys }}/{{ value.hoyolab }}
                          <v-icon icon="mdi mdi-loading mdi-spin" stroke-width="1.5" size="20" v-if="apiData.loading" />
                        </h2>
                        <h2 :class="['text-h1', 'font-weight-medium', value.text, 'ml-auto', 'z-1']">
                          {{ value.all }}
                          <v-icon icon="mdi mdi-loading mdi-spin" stroke-width="1.5" size="20" v-if="apiData.loading" />
                        </h2>
                      </div>
                      <div class="d-inline-flex align-center justify-space-between w-100">
                        <span class="text-subtitle-1 text-medium-emphasis text-white">米游社/Hoyolab</span>
                        <span :class="['text-subtitle-1', 'text-medium-emphasis', value.text, 'ml-auto', 'z-1']">
                          {{ value.type }}总计
                        </span>
                      </div>
                    </v-card-text>
                  </v-card>
                </div>
              </v-expand-transition>
            </v-expand>
          </div>

          <div class="w-50">
            <div class="d-flex align-start">
              <v-menu :close-on-content-click="false" class="">
                <template v-slot:activator="{ props }">
                  <v-btn color="#D3D3D3" variant="flat" v-bind="props"
                    class="text-link text-h4 text-info ml-auto z-1">MysTool</v-btn>
                </template>
                <v-sheet rounded="md" width="200" class="elevation-10 ml-auto">
                  <v-list density="compact">
                    <v-list-item @click="pull">
                      <template v-slot:prepend>
                        <v-icon icon="mdi-source-pull" stroke-width="1.5" size="20" />
                      </template>
                      <v-list-item-title class="ml-2">全部更新</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="pullForce">
                      <template v-slot:prepend>
                        <v-icon icon="mdi-source-merge" stroke-width="1.5" size="20" />
                      </template>
                      <v-list-item-title class="ml-2">强制更新</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-sheet>
              </v-menu>
            </div>
            <div class="d-flex align-center">
              <v-btn @click="setPlugin" variant="flat" text class="text-h4 text-link">
                更新记录<h4 class="text-h6">(只显示已启用的组件)</h4>
                <v-icon>{{ Plugin ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
              </v-btn>
              <v-btn @click="upPlugin" icon rounded="sm" color="darkteal" variant="flat" size="21" v-bind="props">
                <v-icon icon="mdi-refresh" stroke-width="1.5" size="18" />
              </v-btn>
            </div>
            <v-expand v-model="Plugin">
              <v-expand-transition>
                <div v-if="Plugin">
                  <v-list>
                    <v-list-item v-for="name in MysTools" color="secondary" rounded="sm">
                      <div class="d-flex align-center justify-space-between w-100">
                        <h4 :class="['text-h5', 'text-' + (plugins[name] ? (plugins[name].err ? 'error' : (plugins[name].up ? 'warning' : 'success')) : 'info')]">
                          {{ name }}
                          <v-icon icon="mdi-check-circle-outline" stroke-width="1.5" size="20" v-if="plugins[name] && !plugins[name]?.err && !plugins[name]?.up" />
                          <v-icon icon="mdi-alert-outline" stroke-width="1.5" size="20" v-if="plugins[name]?.err" />
                          <v-icon icon="mdi-source-pull" stroke-width="1.5" size="20" v-if="plugins[name]?.up" />
                        </h4>
                        <h4 class="text-h5 ml-auto" v-if="plugins[name]?.time">
                          <li class="text-primary">最后更新：</li>{{ plugins[name].time }}
                        </h4>
                        <v-icon icon="mdi mdi-loading mdi-spin text-info ml-auto mr-auto" stroke-width="1.5" size="20" v-if="!plugins[name]" />
                      </div>
                    </v-list-item>
                  </v-list>
                </div>
              </v-expand-transition>
            </v-expand>
          </div>
        </div>

      </v-card-text>
    </v-card>
  </v-card>
</template>