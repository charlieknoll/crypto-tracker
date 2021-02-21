<template>
  <q-page class="constrain q-pa-md" id="pageSettings">
    <q-form class="q-gutter-md q-pa-lg">
      <q-input
        filled
        v-model="apikey"
        label="Etherscan API KEY"
        hint="Go to etherscan.io and create a key"
        lazy-rules
        :rules="[val => (val && val.length == 34) || 'Invalid API KEY']"
      />

      <q-checkbox
        left-label
        v-model="autoImport"
        label="Auto Import Transactions"
      />
    </q-form>
  </q-page>
</template>

<script>
import { store } from "../boot/store";
import { actions } from "../boot/actions";
export default {
  name: "PageSettings",
  data() {
    return {
      apikey: store.apikey,
      autoImport: store.autoImport,
      $store: store,
      $actions: actions
    };
  },
  watch: {
    apikey: function(val) {
      actions.setObservableData("apikey", val);
    },
    autoImport: function(val) {
      actions.setObservableData("autoImport", val);
    }
  },
  mounted() {
    window.__vue_mounted = "PageSettings";
  }
};
</script>
