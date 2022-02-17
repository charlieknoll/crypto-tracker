<template>
  <q-page class="" id="pageOpeningPositions">
    <table-transactions
      :title="'Opening Positions'"
      :rows="filtered"
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
import { columns } from "../services/opening-positions-provider";

import TableTransactions from "src/components/TableTransactions.vue";
import FilterAccountAsset from "src/components/FilterAccountAsset.vue";

import { filterByAccounts, filterByAssets } from "../services/filter-service";
export default {
  components: { TableTransactions, FilterAccountAsset },
  name: "PageOpeningPositions",
  data() {
    return {
      openingPositions: Object.freeze([]),
      columns,
      page: 1,
    };
  },
  computed: {
    filtered() {
      let txs = this.openingPositions;
      txs = filterByAssets(txs, this.$store.selectedAssets);
      txs = filterByAccounts(txs, this.$store.selectedAccounts);
      return Object.freeze(txs);
    },
  },
  methods: {
    clear() {
      this.$q
        .dialog({
          title: "Confirm",
          message: "Clear opening positions?",
          cancel: true,
          persistent: true,
        })
        .onOk(() => {
          this.$actions.setData("openingPositions", []);
          this.openingPositions = [];
          this.$store.updated = true;
        });
    },
    async load() {
      const openingPositions =
        (await this.$actions.getData("openingPositions")) ?? [];
      this.openingPositions = Object.freeze(openingPositions);
    },
  },
  async created() {
    await this.load();
    this.$store.onload = this.load;
  },
  unmounted() {
    this.$store.onload = null;
  },

  mounted() {
    window.__vue_mounted = "PageOpeningPositions";
  },
};
</script>
