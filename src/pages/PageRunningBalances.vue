<template>
  <q-page class="" id="pageRunningBalances">
    <q-table
      :title="'Running Balances - ' + $store.taxYear"
      :data="filtered"
      :columns="columns"
      row-key="txId"
      dense
      @row-click="click"
      :pagination.sync="pagination"
      :rows-per-page-options="[0]"
      :style="{ height: tableHeight }"
    >
      <template v-slot:top-right>
        <div style="min-width: 250px;" class="q-mr-sm">
          <q-select
            filled
            v-model="selectedAccounts"
            multiple
            :options="accounts"
            use-chips
            stack-label
            label="Accounts"
          />
        </div>
        <div style="min-width: 250px;" class="q-mr-sm">
          <q-select
            filled
            v-model="selectedAssets"
            multiple
            :options="assets"
            use-chips
            stack-label
            label="Assets"
          />
        </div>
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
        <!-- <q-toggle
          class="q-mr-lg"
          v-model="onlyShowEnding"
          label="Ending"
        ></q-toggle> -->
      </template>
    </q-table>
  </q-page>
</template>

<script>
import { store } from "../boot/store";
import { actions } from "../boot/actions";
import {
  getRunningBalances,
  columns
} from "../services/running-balances-provider";
import Vue from "Vue";
import { commaStringToLowerCaseArray } from "../utils/arrayUtil";
export default {
  name: "PageTokenTransactions",
  data() {
    return {
      groups: ["Detailed", "Account", "Asset"],
      balanceGrouping: "Detailed",
      assets: [],
      selectedAssets: [],
      selectedAccounts: [],
      accounts: [],
      runningBalances: Object.freeze([]),
      columns: columns,
      page: 1,
      $store: store,
      $actions: actions
    };
  },
  computed: {
    filtered() {
      let txs = this.runningBalances;

      if (this.selectedAssets.length > 0) {
        txs = txs.filter(tx => {
          return this.selectedAssets.findIndex(ss => ss == tx.asset) > -1;
        });
      }
      if (this.selectedAccounts.length > 0) {
        txs = txs.filter(tx => {
          return this.selectedAccounts.findIndex(a => a == tx.account) > -1;
        });
      }
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
        txs =
          this.$store.taxYear == "All"
            ? txs
            : txs.filter(
                tx => parseInt(tx.date.substring(0, 4)) == this.$store.taxYear
              );
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
    Vue.set(this, "accounts", Object.freeze(accountNames));
    Vue.set(this, "assets", Object.freeze(assets));
  },
  mounted() {
    window.__vue_mounted = "PageTokenTransactions";
  }
};
</script>
