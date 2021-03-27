<template>
  <q-page class="" id="pageTaxExport">
    <table-transactions title="Tax Export" :data="filtered" :columns="columns">
      <template v-slot:top-right>
        <div style="min-width: 250px; display: inline-block;" class="q-mr-sm">
          <q-select
            filled
            v-model="$store.selectedAssets"
            multiple
            :options="$store.assets"
            use-chips
            stack-label
            label="Assets"
          />
        </div>
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
import { getCapitalGains } from "../services/capital-gains-provider";
import { columns } from "../services/tax-export-provider";
import TableTransactions from "src/components/TableTransactions.vue";
import Vue from "Vue";

import { filterByAssets, filterByYear } from "../services/filter-service";
export default {
  name: "PageTaxExport",
  data() {
    return {
      groups: ["Detailed", "Asset Totals", "Long/Short Totals"],
      gainsGrouping: "Detailed",
      capitalGains: Object.freeze([]),
      columns,
      $store: store,
      $actions: actions
    };
  },
  components: {
    TableTransactions
  },
  computed: {
    filtered() {
      let txs = this.capitalGains;
      txs = filterByAssets(txs, this.$store.selectedAssets);
      txs = filterByYear(txs, this.$store.taxYear);
      if (this.gainsGrouping == "Detailed") return Object.freeze(txs);
      //group by year
      let totals = [];

      for (const tx of txs) {
        let total = totals.find(
          t => t.asset == tx.asset && t.longShort == tx.longShort
        );
        if (!total) {
          total = {
            asset: tx.asset,
            longShort: tx.longShort,
            amount: 0.0,
            proceeds: 0.0,
            costBasis: 0.0,
            gainOrLoss: 0.0,
            washSaleAdj: 0.0
          };
          totals.push(total);
        }
        total.amount += tx.amount;
        total.costBasis += tx.costBasis;
        total.gainOrLoss += tx.gainOrLoss;
        total.proceeds += tx.proceeds;
        total.washSaleAdj += tx.washSaleAdj;
      }
      if (this.gainsGrouping == "Long/Short Totals") {
        let _totals = [];

        for (const t of totals) {
          let total = _totals.find(ts => ts.longShort == t.longShort);
          if (!total) {
            total = {
              asset: `Cryptocurrencies (${t.longShort})`,
              longShort: t.longShort,
              proceeds: 0.0,
              costBasis: 0.0,
              gainOrLoss: 0.0,
              washSaleAdj: 0.0
            };
            _totals.push(total);
          }
          total.costBasis += t.costBasis;
          total.gainOrLoss += t.gainOrLoss;
          total.proceeds += t.proceeds;
          total.washSaleAdj += t.washSaleAdj;
        }
        totals = _totals;
      }
      return totals;
    }
  },
  methods: {
    async load() {
      const { splitTxs } = await getCapitalGains(true);
      const capitalGains = splitTxs;
      Vue.set(this, "capitalGains", Object.freeze(splitTxs));
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
    window.__vue_mounted = "PageTaxExport";
  }
};
</script>
