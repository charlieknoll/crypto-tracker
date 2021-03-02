<template>
  <q-page class="" id="pageExchangeTransactions">
    <q-table
      title="Exchange Transactions"
      :data="filtered"
      :columns="columns"
      row-key="txId"
      dense
      :pagination.sync="pagination"
      :rows-per-page-options="[0]"
      class="my-sticky-header-table"
      :style="{ height: tableHeight }"
    >
      <template v-slot:top-right>
        <q-input
          style="width: 400px"
          filled
          debounce="500"
          v-model="accountFilter"
          label="Filter by
        Account Name or Type"
          stack-label
          dense
          clearable
        />
        <q-toggle v-model="groupByDay" label="Group By Day"></q-toggle>
        <q-btn class="q-ml-lg" color="negative" label="Clear" @click="clear" />
      </template>
    </q-table>
  </q-page>
</template>

<script>
import { store } from "../boot/store";
import { actions } from "../boot/actions";
import { columns, getExchangeTrades } from "../services/exchange-tx-provider";
import { processFiles } from "../services/file-handler";
import Vue from "Vue";

export default {
  name: "PageExchangeTransactions",
  data() {
    return {
      accountFilter: "",
      exchangeTrades: Object.freeze([]),
      columns,
      groupByDay: false,
      pagination: {
        rowsPerPage: 0
      },
      $store: store,
      $actions: actions
    };
  },
  computed: {
    filtered() {
      let txs =
        this.$store.taxYear == "All"
          ? this.exchangeTrades
          : this.exchangeTrades.filter(
              ct => parseInt(ct.date.substring(0, 4)) == this.$store.taxYear
            );

      if (!this.groupByDay) return txs;
      const grouped = [];
      for (const et of txs) {
        //find an entry for date/asset
        let dateAsset = grouped.find(
          g => g.asset == et.asset && g.date == et.date
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
            txId: "g-"
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
    tableHeight() {
      if (this.$q.screen.height == 0) return;
      const height = this.$q.screen.height;
      return (this.$q.screen.sm ? height : height - 50) + "px";
    }
  },
  methods: {
    clear() {
      this.$actions.setData("exchangeTrades", []);
      this.exchangeTrades = [];
    },
    async load() {
      const exchangeTrades = await getExchangeTrades();
      Vue.set(this, "exchangeTrades", Object.freeze(exchangeTrades));
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
    window.__vue_mounted = this.name;
  }
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
