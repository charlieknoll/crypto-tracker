<template>
  <q-page class="" id="pageCapitalGains">
    <table-transactions
      title="Capital Gains"
      :data="filtered"
      :columns="columns"
    >
      <template v-slot:top-right>
        <filter-account-asset></filter-account-asset>
        <q-btn-dropdown stretch flat :label="gainsGrouping">
          <q-list>
            <q-item
              v-for="n in groups"
              :key="`x.${n}`"
              clickable
              v-close-popup
              tabindex="0"
              @click="gainsGrouping = n"
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
      groups: ["Detailed", "Asset Totals", "Totals"],
      gainsGrouping: "Detailed",
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
      if (this.gainsGrouping == "Detailed") return Object.freeze(txs);
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
            proceeds: 0.0,
            shortTermGain: 0.0,
            longTermGain: 0.0,
            shortLots: 0,
            longLots: 0
          };
          totals.push(total);
        }
        total.amount += tx.amount;
        total.fee += tx.fee;
        total.gross += tx.gross;
        total.proceeds += tx.proceeds;
        total.shortTermGain += tx.shortTermGain;
        total.longTermGain += tx.longTermGain;
        total.shortLots += tx.shortLots;
        total.longLots += tx.longLots;
      }
      if (this.gainsGrouping == "Totals") {
        const total = {
          fee: 0.0,
          gross: 0.0,
          proceeds: 0.0,
          shortTermGain: 0.0,
          longTermGain: 0.0,
          amount: ""
        };
        for (const t of totals) {
          total.fee += t.fee;
          total.gross += t.gross;
          total.proceeds += t.proceeds;
          total.shortTermGain += t.shortTermGain;
          total.longTermGain += t.longTermGain;
        }
        totals.length = 0;
        totals.push(total);
      }
      return totals;
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
