<template>
  <q-page class="" id="pageOffchainTransfers" ref="page">
    <table-transactions
      :title="'Offchain Transfers - ' + $store.taxYear"
      :data="filtered"
      :columns="columns"
    >
      <template v-slot:top-right>
        <filter-account-asset></filter-account-asset>
        <q-btn class="q-ml-lg" color="negative" label="Clear" @click="clear" />
      </template>
    </table-transactions>
  </q-page>
</template>

<script>
import { store } from "../boot/store";
import { actions } from "../boot/actions";
import { columns } from "../services/offchain-transfers-provider";
import TableTransactions from "src/components/TableTransactions.vue";
import FilterAccountAsset from "src/components/FilterAccountAsset.vue";
import {
  filterByAccounts,
  filterByAssets,
  filterByYear,
} from "../services/filter-service";

export default {
  name: "PageOffchainTransfers",
  components: { TableTransactions, FilterAccountAsset },
  data() {
    return {
      offchainTransfers: Object.freeze([]),
      columns,
      page: 1,
      $store: store,
      $actions: actions,
    };
  },
  computed: {
    filtered() {
      let txs = filterByYear(this.offchainTransfers, this.$store.taxYear);
      txs = filterByAccounts(txs, this.$store.selectedAccounts, true);
      txs = filterByAssets(txs, this.$store.selectedAssets);

      return txs;
    },
  },
  methods: {
    clear() {
      this.$q
        .dialog({
          title: "Confirm",
          message: "Clear ALL offchain transfers?",
          cancel: true,
          persistent: true,
        })
        .onOk(() => {
          this.$actions.setData("offchainTransfers", []);
          this.offchainTransfers = [];
          this.$store.updated = true;
        });
    },
    async load() {
      const offchainTransfers =
        (await this.$actions.getData("offchainTransfers")) ?? [];
      this.offchainTransfers = Object.freeze(offchainTransfers);
    },
  },
  async created() {
    await this.load();
    store.onload = this.load;
  },
  unmounted() {
    store.onload = null;
  },
  mounted() {
    window.__vue_mounted = "PageOffchainTransfers";
  },
};
</script>
