<template>
  <q-page class="" id="pageRunningBalances">
    <table-transactions
      :title="'Running Balances - ' + $store.taxYear"
      :data="filtered"
      :columns="columns"
      @rowClick="click"
    >
      <template v-slot:top-right>
        <filter-account-asset></filter-account-asset>
        <q-btn-dropdown stretch flat :label="balanceGrouping">
          <q-list>
            <q-item
              v-for="n in groups"
              :key="`x.${n}`"
              clickable
              v-close-popup
              tabindex="0"
              @click="balanceGrouping = n"
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
import {
  getRunningBalances,
  columns
} from "../services/running-balances-provider";
import {
  filterByAccounts,
  filterByAssets,
  filterByYear
} from "../services/filter-service";
import Vue from "Vue";
import { commaStringToLowerCaseArray } from "../utils/arrayUtil";
import FilterAccountAsset from "src/components/FilterAccountAsset.vue";
import TableTransactions from "src/components/TableTransactions.vue";
export default {
  name: "PageTokenTransactions",
  data() {
    return {
      groups: ["Detailed", "Account", "Asset"],
      balanceGrouping: "Detailed",
      runningBalances: Object.freeze([]),
      columns: columns,
      page: 1,
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
      let txs = this.runningBalances;
      txs = filterByAssets(txs, this.$store.selectedAssets);
      txs = filterByAccounts(txs, this.$store.selectedAccounts);

      if (this.balanceGrouping == "Account") {
        let taxYear = this.$store.taxYear;
        if (taxYear == "All") {
          taxYear = this.$store.taxYears[this.$store.taxYears.length - 2];
        }
        txs = txs.filter(tx => {
          return tx.accountEndingYears.findIndex(ey => ey == taxYear) > -1;
        });
      }
      if (this.balanceGrouping == "Asset") {
        let taxYear = this.$store.taxYear;
        if (taxYear == "All") {
          taxYear = this.$store.taxYears[this.$store.taxYears.length - 2];
        }
        txs = txs.filter(tx => {
          return tx.assetEndingYears.findIndex(ey => ey == taxYear) > -1;
        });
      }
      if (this.balanceGrouping == "Detailed") {
        txs = filterByYear(txs, this.$store.taxYear);
      }

      return Object.freeze(txs);
    },
    pagination: {
      get() {
        if (this.$q.screen.height == 0) return { rowsPerPage: 0 };
        const pixels = this.$q.screen.sm
          ? this.$q.screen.height
          : this.$q.screen.height - 50;
        const rowPixels = pixels - 78 - 28 - 33; //table title, row header, row-footer
        const rows = Math.floor(rowPixels / 28);
        return { rowsPerPage: rows, page: this.page };
      },
      set(val) {
        this.page = val.page;
      }
    },
    tableHeight() {
      if (this.$q.screen.height == 0) return;
      return (
        (this.$q.screen.sm
          ? this.$q.screen.height
          : this.$q.screen.height - 50) + "px"
      );
    }
  },
  methods: {
    click(evt, row, index) {
      if (evt.ctrlKey) {
        if (row.hash) {
          window.open("https://etherscan.io/tx/" + row.hash);
        }
      }
    }
  },
  async created() {
    const {
      runningBalances,
      accountNames,
      assets
    } = await getRunningBalances();
    Vue.set(this, "runningBalances", Object.freeze(runningBalances));
    // Vue.set(this, "accounts", Object.freeze(accountNames));
    // Vue.set(this, "assets", Object.freeze(assets));
    this.$store.assets = assets;
    this.$store.accounts = accountNames;
  },
  mounted() {
    window.__vue_mounted = "PageTokenTransactions";
  }
};
</script>
