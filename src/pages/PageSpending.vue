<template>
  <q-page class="" id="pageSpending">
    <table-transactions
      :title="'Spending - ' + $store.taxYear"
      :data="filtered"
      :columns="columns"
      @row-click="click"
    >
      <template v-slot:top-right>
        <filter-account-asset></filter-account-asset>
        <q-btn-dropdown stretch flat :label="spendingGrouping">
          <q-list>
            <q-item
              v-for="n in groups"
              :key="`x.${n}`"
              clickable
              v-close-popup
              tabindex="0"
              @click="spendingGrouping = n"
            >
              <q-item-label>{{ n }}</q-item-label>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </template>
    </table-transactions>
  </q-page>
</template>

<script>
import { store } from "../boot/store";
import { actions } from "../boot/actions";
import { getSpending, columns } from "../services/spending-provider";
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
  name: "PageIncome",
  data() {
    return {
      groups: ["Detailed", "Asset Totals", "Totals"],
      spendingGrouping: "Totals",
      spending: Object.freeze([]),
      columns: columns,
      $store: store,
      $actions: actions
    };
  },
  computed: {
    filtered() {
      let txs = filterByYear(this.spending, this.$store.taxYear);
      txs = filterByAccounts(txs, this.$store.selectedAccounts, true);
      txs = filterByAssets(txs, this.$store.selectedAssets);
      if (this.spendingGrouping == "Detailed") return Object.freeze(txs);
      //group by year
      const totals = [];
      if (this.spendingGrouping == "Asset Totals") {
        for (const tx of txs) {
          let total = totals.find(
            t => t.asset == tx.asset && t.action == tx.action
          );
          if (!total) {
            total = {
              asset: tx.asset,
              action: tx.action,
              amount: 0.0,
              fee: 0.0,
              gross: 0.0,
              net: 0.0
            };
            totals.push(total);
          }
          total.amount += tx.amount;
          total.fee += tx.fee;
          total.gross += tx.gross;
          total.net += tx.net;
        }
      } else {
        for (const tx of txs) {
          let total = totals.find(t => t.action == tx.action);
          if (!total) {
            total = {
              action: tx.action,
              amount: 0.0,
              fee: 0.0,
              gross: 0.0,
              net: 0.0
            };
            totals.push(total);
          }
          total.amount += tx.amount;
          total.fee += tx.fee;
          total.gross += tx.gross;
          total.net += tx.net;
        }
      }

      return totals;
    }
  },
  methods: {
    click() {
      //TODO add method editor popup
    },
    async load() {
      const spending = await getSpending();
      Vue.set(this, "spending", Object.freeze(spending));
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
    window.__vue_mounted = "PageSpending";
  }
};
</script>
