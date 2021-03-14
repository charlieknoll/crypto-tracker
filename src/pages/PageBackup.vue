<template>
  <q-page class="constrain q-pa-md" id="pageBackup">
    <div class="q-table__title">Backup</div>
    <q-form class="q-gutter-md q-pa-lg">
      <q-btn
        label="Download Addresses"
        @click="downloadAddresses"
        :color="$store.addressesNeedsBackup ? 'negative' : 'grey'"
      ></q-btn>
      <q-btn
        label="Download Price History"
        @click="downloadPriceHistory"
        :color="$store.pricesNeedsBackup ? 'negative' : 'grey'"
      ></q-btn>
      <q-btn
        label="Download Settings"
        @click="downloadSettings"
        :color="$store.settingsNeedsBackup ? 'negative' : 'grey'"
      ></q-btn>
    </q-form>
  </q-page>
</template>

<script>
import { store } from "../boot/store";
import { actions } from "../boot/actions";
import { convertToCsv } from "src/utils/arrayUtil";
import { exportFile } from "quasar";

export default {
  name: "PageImport",
  data() {
    return {
      files: null,
      currentBlock: 0,
      messages: [],
      $store: store,
      $actions: actions
    };
  },
  methods: {
    downloadAddresses() {
      const simpleAddress = this.$store.addresses.map(a => {
        return { address: a.address, name: a.name, type: a.type };
      });
      const names = ["address", "name", "type"];
      const content = convertToCsv(simpleAddress, names);
      const status = exportFile("addresses.csv", content, "text/csv");
      if (status !== true) {
        this.$q.notify({
          message: "Browser denied file download...",
          color: "negative",
          icon: "warning"
        });
      } else {
        this.$actions.setObservableData("addressesNeedsBackup", false);
      }
    },
    downloadPriceHistory() {
      const prices = actions.getData("prices") ?? [];
      const pNames = ["tradeDate", "symbol", "price"];
      const pContent = convertToCsv(prices, pNames);
      const pStatus = exportFile("prices.csv", pContent, "text/csv");
      if (pStatus !== true) {
        this.$q.notify({
          message: "Browser denied file download...",
          color: "negative",
          icon: "warning"
        });
      } else {
        this.$actions.setObservableData("pricesNeedsBackup", false);
      }
    },

    downloadSettings() {
      const settings = {
        apikey: store.apikey,
        startYear: store.startYear,
        baseCurrencies: store.baseCurrencies,
        trackedTokens: store.trackedTokens,
        trackSpentTokens: store.trackSpentTokens,
        cbpApikey: store.cbpApikey,
        cbpSecret: store.cbpSecret,
        cbpPassphrase: store.cbpPassphrase
      };
      const pContent = JSON.stringify(settings);
      const pStatus = exportFile("settings.json", pContent, "text/csv");
      if (pStatus !== true) {
        this.$q.notify({
          message: "Browser denied file download...",
          color: "negative",
          icon: "warning"
        });
      } else {
        this.$actions.setObservableData("settingsNeedsBackup", false);
      }
    }
  },
  async mounted() {
    window.__vue_mounted = "PageBackup";
  }
};
</script>
