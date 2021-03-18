<template>
  <q-page class="constrain q-pa-md" id="pageSettings">
    <div class="q-table__title">Settings</div>
    <q-form class="q-gutter-md q-pa-lg">
      <q-input
        filled
        v-model="settings.startYear"
        label="Start Year"
        hint="Not including opening positions"
      />
      <q-input
        filled
        v-model="settings.apikey"
        label="Etherscan API KEY"
        hint="Go to etherscan.io and create a key"
        lazy-rules
        :rules="[val => (val && val.length == 34) || 'Invalid API KEY']"
      />
      <q-input
        filled
        v-model="settings.baseCurrencies"
        label="Base Currencies"
        hint="Comma delimited list (e.g. USDT, TUSD, USDC, DAI)"
      />
      <q-input
        filled
        v-model="settings.trackedTokens"
        label="Additional Tracked Tokens (Non Spent)"
        hint="Comma delimited list (e.g. OMG, KICK, etc)"
      />
      <q-checkbox
        left-label
        v-model="settings.trackSpentTokens"
        label="Track Spent Tokens"
      />
      <q-input filled v-model="settings.cbpApikey" label="Coinbase API Key" />
      <q-input filled v-model="settings.cbpSecret" label="Coinbase Secret" />
      <q-input
        filled
        v-model="settings.cbpPassphrase"
        label="Coinbase Passphrase"
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
      settings: store.settings
    };
  },
  methods: {
    load() {
      this.settings = this.$store.settings;
    }
  },
  watch: {
    settings: {
      handler: function(val) {
        actions.setObservableData("settings", val);
        actions.setObservableData("settingsNeedsBackup", true);
      },
      deep: true
    }
  },
  async created() {
    await this.load();
    store.onload = this.load;
  },
  destroyed() {
    store.onload = null;
  },
  mounted() {
    window.__vue_mounted = "PageSettings";
  }
};
</script>
