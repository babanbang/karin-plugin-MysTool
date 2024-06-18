<script setup lang="ts">
import { ref } from 'vue';
const props = defineProps({
  request: Function,
  apiUrl: String,
  data: Object
});

const apiData: any = ref({});
const Plugin = ref(true);
const User = ref(true);

const setUser = () => {
  User.value = !User.value;
  if (User.value) { 
    fetchUserStats();
  };
};

const setPlugin = () => {
  Plugin.value = !Plugin.value;
};

const fetchUserStats = () => {
  props.request.get(`${props.apiUrl}/system/plugins/karin-plugin-MysTool/UserStats`)
    .then((response) => {
      if (response.data.status === 'success') {
        apiData.value = response.data.data;
      } else {
        apiData.value = {};
      }
    })
    .catch((error) => {
      apiData.value = {};
    });
};

fetchUserStats();
</script>

<template>
  <v-card elevation="0">
    <v-card variant="outlined">
      <v-card-text>
        <div class="d-flex align-center">
          <h4 class="d-flex align-center text-h4 mr-auto">
            数据库：<h4 class="text-success">{{ apiData.dialect }}</h4>
          </h4>
          <v-btn @click="fetchUserStats" variant="flat" class="text-link text-h4 text-info ml-auto">MysTool</v-btn>
        </div>

        <div>
          <v-btn @click="setUser" variant="flat" text class="text-h4 text-link">
            用户统计
            <v-icon>{{ User ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
          </v-btn>
          <v-expand v-model="User">
            <v-expand-transition>
              <div v-if="User">
                <v-card elevation="0" class="bg-secondary overflow-hidden bubble-shape bubble-secondary-shape mb-1">
                  <v-card-text style="position: relative;">
                    <div class="d-inline-flex align-center justify-space-between w-100">
                      <h2 class="text-h1 font-weight-medium">
                        {{ apiData.ck_mys }}/{{ apiData.ck_hoyolab }}
                      </h2>
                      <h2 class="text-h1 font-weight-medium text-primary ml-auto" style="z-index: 10;">
                        {{ apiData.ck_mys + apiData.ck_hoyolab }}
                      </h2>
                    </div>
                    <div class="d-inline-flex align-center justify-space-between w-100">
                      <span class="text-subtitle-1 text-medium-emphasis text-white">米游社/Hoyolab</span>
                      <span class="text-subtitle-1 text-medium-emphasis text-primary ml-auto"
                        style="z-index: 10;">cookie总计</span>
                    </div>
                  </v-card-text>
                </v-card>
                <v-card elevation="0" class="bg-teal overflow-hidden bubble-shape bubble-teal-shape">
                  <v-card-text style="position: relative;">
                    <div class="d-inline-flex align-center justify-space-between w-100">
                      <h2 class="text-h1 font-weight-medium">
                        {{ apiData.sk_mys }}/{{ apiData.sk_hoyolab }}
                      </h2>
                      <h2 class="text-h1 font-weight-medium text-warning ml-auto" style="z-index: 10;">
                        {{ apiData.sk_mys + apiData.sk_hoyolab }}
                      </h2>
                    </div>

                    <div class="d-inline-flex align-center justify-space-between w-100">
                      <span class="text-subtitle-1 text-medium-emphasis text-white">米游社/Hoyolab</span>
                      <span class="text-subtitle-1 text-medium-emphasis text-warning ml-auto"
                        style="z-index: 10;">stoken总计</span>
                    </div>
                  </v-card-text>
                </v-card>
              </div>
            </v-expand-transition>
          </v-expand>
        </div>

        <div>
          <v-btn @click="setPlugin" variant="flat" text class="text-h4 text-link">
            已启用组件
            <v-icon>{{ Plugin ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
          </v-btn>
          <v-expand v-model="Plugin">
            <v-expand-transition>
              <div v-if="Plugin">
                <h4 class="text-h5 text-success">{{ apiData.plugins }}</h4>
              </div>
            </v-expand-transition>
          </v-expand>
        </div>

      </v-card-text>
    </v-card>
  </v-card>
</template>