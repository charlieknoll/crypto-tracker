<template>
  <div>
    <div style="min-width: 250px; display: inline-block;" class="q-mr-sm">
      <q-select
        filled
        v-model="$store.selectedAccounts"
        multiple
        :options="$store.accounts"
        use-chips
        stack-label
        label="Accounts"
      />
    </div>
    <div style="min-width: 250px; display: inline-block;" class="q-mr-sm">
      <q-select
        filled
        v-model="$store.selectedAssets"
        multiple
        :options="$store.assets"
        use-chips
        stack-label
        label="Assets"
      />
    </div>
  </div>
</template>

<script>
import { store } from "../boot/store";
export default {
  name: "FilterAccountAsset",
  data() {
    return {
      $store: store
    };
  }
};
</script>

<style></style>
