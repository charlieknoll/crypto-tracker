<template>
  <q-page class="" id="pageIncome">
    <table-transactions
      :title="'Income - ' + $store.taxYear"
      :data="filtered"
      :columns="columns"
      @row-click="click"
    >
      <template v-slot:top-right>
        <filter-account-asset></filter-account-asset>
        <q-btn-dropdown stretch flat :label="incomeGrouping">
          <q-list>
            <q-item
              v-for="n in groups"
              :key="`x.${n}`"
              clickable
              v-close-popup
              tabindex="0"
              @click="incomeGrouping = n"
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
import { getIncome, columns } from "../services/income-provider";
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
      incomeGrouping: "Totals",
      income: Object.freeze([]),
      columns: columns,
      $store: store,
      $actions: actions
    };
  },
  computed: {
    filtered() {
      let txs = filterByYear(this.income, this.$store.taxYear);
      txs = filterByAccounts(txs, this.$store.selectedAccounts, true);
      txs = filterByAssets(txs, this.$store.selectedAssets);
      if (this.incomeGrouping == "Detailed") return Object.freeze(txs);
      //group by year
      const totals = [];

      for (const tx of txs) {
        let total = totals.find(t => t.asset == tx.asset);
        if (!total) {
          total = {
            asset: tx.asset,
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
      if (this.incomeGrouping == "Totals") {
        const total = {
          fee: 0.0,
          gross: 0.0,
          net: 0.0
        };
        for (const t of totals) {
          total.fee += t.fee;
          total.gross += t.gross;
          total.net += t.net;
        }
        totals.length = 0;
        totals.push(total);
      }

      return totals;
    }
  },
  methods: {
    click() {
      //TODO add method editor popup
    },
    async load() {
      const income = await getIncome();
      Vue.set(this, "income", Object.freeze(income));
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
    window.__vue_mounted = "PageIncome";
  }
};
</script>
