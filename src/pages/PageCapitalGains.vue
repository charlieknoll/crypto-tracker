<template>
  <q-page class="" id="pageCapitalGains">
    <table-transactions
      title="Capital Gains"
      :data="filtered"
      :columns="columns"
    >
      <template v-slot:top-right>
        <filter-account-asset></filter-account-asset>
      </template>
    </table-transactions>
  </q-page>
</template>

<script>
import { store } from "../boot/store";
import { actions } from "../boot/actions";
import { getCapitalGains, columns } from "../services/capital-gains-provider";
import TableTransactions from "src/components/TableTransactions.vue";
import FilterAccountAsset from "src/components/FilterAccountAsset.vue";
import Vue from "Vue";

import {
  filterByAccounts,
  filterByAssets,
  filterByYear
} from "../services/filter-service";
export default {
  name: "PageCapitalGains",
  data() {
    return {
      capitalGains: Object.freeze([]),
      columns,
      $store: store,
      $actions: actions
    };
  },
  components: {
    FilterAccountAsset,
    TableTransactions
  },
  computed: {
    filtered() {
      let txs = this.capitalGains;
      txs = filterByAssets(txs, this.$store.selectedAssets);
      txs = filterByAccounts(txs, this.$store.selectedAccounts);
      txs = filterByYear(txs, this.$store.taxYear);
      return Object.freeze(txs);
    }
  },
  methods: {
    async load() {
      const capitalGains = await getCapitalGains();
      Vue.set(this, "capitalGains", Object.freeze(capitalGains));
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
    window.__vue_mounted = "PageCapitalGains";
  }
};
</script>
