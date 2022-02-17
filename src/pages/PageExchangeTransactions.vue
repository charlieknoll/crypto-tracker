<template>
  <q-page class="" id="pageExchangeTransactions">
    <table-transactions
      :title="'Exchange Transactions - ' + $store.taxYear"
      :data="filtered"
      :columns="columns"
    >
      <template v-slot:top-right>
        <filter-account-asset></filter-account-asset>
        <q-toggle v-model="groupByDay" label="Group By Day"></q-toggle>
        <q-btn class="q-ml-lg" color="negative" label="Clear" @click="clear" />
      </template>
    </table-transactions>
  </q-page>
</template>

<script>
import { store } from "../boot/store";
import { actions } from "../boot/actions";
import { columns, getExchangeTrades } from "../services/exchange-tx-provider";

import TableTransactions from "src/components/TableTransactions.vue";
import FilterAccountAsset from "src/components/FilterAccountAsset.vue";
import {
  filterByAccounts,
  filterByAssets,
  filterByYear,
} from "../services/filter-service";

export default {
  name: "PageExchangeTransactions",
  components: { TableTransactions, FilterAccountAsset },
  data() {
    return {
      exchangeTrades: Object.freeze([]),
      columns,
      groupByDay: false,
      page: 1,
      $store: store,
      $actions: actions,
    };
  },
  computed: {
    filtered() {
      let txs = filterByYear(this.exchangeTrades, this.$store.taxYear);
      txs = filterByAccounts(txs, this.$store.selectedAccounts, false);
      txs = filterByAssets(txs, this.$store.selectedAssets);

      if (!this.groupByDay) return txs;
      const grouped = [];
      for (const et of txs) {
        //find an entry for date/asset
        let dateAsset = grouped.find(
          (g) => g.asset == et.asset && g.date == et.date
        );
        if (!dateAsset) {
          dateAsset = {
            asset: et.asset,
            date: et.date,
            amount: 0.0,
            fee: 0.0,
            gross: 0.0,
            account: "",
            action: 0,
            txId: "g-",
          };
          grouped.push(dateAsset);
        }
        //add values to date asset
        dateAsset.amount += et.action == "BUY" ? et.amount : -et.amount;
        dateAsset.fee += et.fee;
        dateAsset.gross += et.action == "BUY" ? et.gross : -et.gross;
        dateAsset.runningBalance = et.runningBalance;
        dateAsset.price = dateAsset.gross / dateAsset.amount;
        dateAsset.action += 1;
        dateAsset.txId = "g-" + et.txId.substring(0, 14);
        if (!dateAsset.account.includes(et.account))
          dateAsset.account += et.account + ",";
      }
      return grouped;
    },
  },
  methods: {
    clear() {
      this.$q
        .dialog({
          title: "Confirm",
          message: "Clear ALL exchange trades?",
          cancel: true,
          persistent: true,
        })
        .onOk(() => {
          this.$actions.setData("exchangeTrades", []);
          this.exchangeTrades = [];
          this.$store.updated = true;
        });
    },
    async load() {
      const exchangeTrades = await getExchangeTrades();
      this.exchangeTrades = Object.freeze(exchangeTrades);
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
    window.__vue_mounted = this.name;
  },
};
</script>
<style lang="sass">
.my-sticky-header-table
  /* height or max-height is important */
  /* height: 310px */

  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th
    /* bg color is important for th; just specify one */
    background-color: lightgrey

  thead tr th
    position: sticky
    z-index: 1
  thead tr:first-child th
    top: 0

  /* this is when the loading indicator appears */
  &.q-table--loading thead tr:last-child th
    /* height of all previous header rows */
    top: 48px
</style>
