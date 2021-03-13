<template>
  <q-page class="" id="pageTokenTransactions">
    <table-transactions
      :title="'Token Transactions - ' + $store.taxYear"
      :data="filtered"
      :columns="columns"
      @row-click="click"
    >
      <template v-slot:top-right>
        <filter-account-asset></filter-account-asset>
        <q-toggle
          class="q-mr-lg"
          v-model="onlyShowTracked"
          label="Only Tracked"
        ></q-toggle>
      </template>
    </table-transactions>
  </q-page>
</template>

<script>
import { store } from "../boot/store";
import { actions } from "../boot/actions";
import { getTokenTransactions, columns } from "../services/token-tx-provider";
import Vue from "Vue";
import TableTransactions from "src/components/TableTransactions.vue";
import FilterAccountAsset from "src/components/FilterAccountAsset.vue";
import {
  filterByAccounts,
  filterByAssets,
  filterByYear
} from "../services/filter-service";

export default {
  components: { TableTransactions, FilterAccountAsset },
  name: "PageTokenTransactions",
  data() {
    return {
      onlyShowTracked: true,
      tokenTransactions: Object.freeze([]),
      columns: columns,
      $store: store,
      $actions: actions
    };
  },
  computed: {
    filtered() {
      let txs = filterByYear(this.tokenTransactions, this.$store.taxYear);
      txs = filterByAccounts(txs, this.$store.selectedAccounts, true);
      txs = filterByAssets(txs, this.$store.selectedAssets);
      if (this.onlyShowTracked) {
        txs = txs.filter(tx => tx.tracked);
      }
      return Object.freeze(txs);
    }
  },
  methods: {
    click() {
      //TODO add method editor popup
      console.log("test");
    },
    async load() {
      const tokenTxs = await getTokenTransactions();
      Vue.set(this, "tokenTransactions", Object.freeze(tokenTxs));
    }
  },
  async created() {
    await this.load();
    store.onload = this.load();
  },
  destroyed() {
    store.onload = null;
  },
  mounted() {
    window.__vue_mounted = "PageTokenTransactions";
  }
};
</script>
