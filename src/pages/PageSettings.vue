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
      <q-input
        filled
        v-model="baseCurrencies"
        label="Base Currencies"
        hint="Comma delimited list (e.g. USDT, TUSD, USDC, DAI)"
      />
      <q-input
        filled
        v-model="trackedTokens"
        label="Additional Tracked Tokens (Non Spent)"
        hint="Comma delimited list (e.g. OMG, KICK, etc)"
      />
      <q-checkbox
        left-label
        v-model="trackSpentTokens"
        label="Track Spent Tokens"
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
      trackedTokens: store.trackedTokens,
      trackSpentTokens: store.trackSpentTokens,
      baseCurrencies: store.baseCurrencies,

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
    },
    baseCurrencies: function(val) {
      if (!val) val = "";
      actions.setObservableData("baseCurrencies", val);
    },
    trackedTokens: function(val) {
      if (!val) val = "";
      actions.setObservableData("trackedTokens", val);
    },
    trackSpentTokens: function(val) {
      actions.setObservableData("trackSpentTokens", val);
    }
  },
  mounted() {
    window.__vue_mounted = "PageSettings";
  }
};
</script>
