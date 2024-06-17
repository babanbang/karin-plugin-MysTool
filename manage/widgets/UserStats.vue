<script setup lang="ts">
import { ref } from 'vue';
const props = defineProps({
  request: Function,
  apiUrl: String,
  data: Object
});

const request = props.request;
const apiData: any = ref({});

request.get(`${props.apiUrl}/system/plugins/karin-plugin-MysTool/UserStats`)
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
</script>

<template>
  <v-card elevation="0">
    <v-card variant="outlined">
      <v-card-text>
        <div class="d-flex align-center">
          <h4 class="text-h4 text-info ml-auto">MysTool</h4>
        </div>
        <h4 class="text-h4">用户统计</h4>

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

        <h4 class="text-h4">已启用组件</h4>
        <h4 class="text-h6 text-success">{{ apiData.plugins }}</h4>
      </v-card-text>
    </v-card>
  </v-card>
</template>