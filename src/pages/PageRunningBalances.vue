<template>
  <q-page class="" id="pageRunningBalances">
    <q-table
      title="Running Balances"
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
        <q-input
          style="width: 250px"
          filled
          debounce="500"
          v-model="accountFilter"
          label="Accounts"
          stack-label
          dense
          clearable
          class="q-mr-lg"
        />
        <q-input
          style="width: 100px"
          filled
          debounce="500"
          v-model="symbolFilter"
          label="Symbol (e.g. BTC, ETH, CRV...)"
          stack-label
          dense
          clearable
        />
        <q-toggle
          class="q-mr-lg"
          v-model="onlyShowEnding"
          label="Ending"
        ></q-toggle>
        <q-toggle
          class="q-mr-lg"
          v-model="onlyShowEndingAccount"
          label="Ending Account"
        ></q-toggle>
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
import { commaStringToArray } from "../utils/arrayUtil";
export default {
  name: "PageTokenTransactions",
  data() {
    return {
      symbolFilter: "",
      accountFilter: "",
      onlyShowEnding: false,
      onlyShowEndingAccount: false,
      runningBalances: Object.freeze([]),
      columns: columns,
      page: 1,
      $store: store,
      $actions: actions
    };
  },
  computed: {
    filtered() {
      let txs =
        this.$store.taxYear == "All"
          ? this.runningBalances
          : this.runningBalances.filter(
              tx => parseInt(tx.date.substring(0, 4)) == this.$store.taxYear
            );
      if (this.symbolFilter) {
        txs = txs.filter(tx => tx.asset == this.symbolFilter.toUpperCase());
      }
      if (this.accountFilter) {
        const accounts = commaStringToArray(this.accountFilter);
        txs = txs.filter(tx => {
          return accounts.findIndex(a => a == tx.account) > -1;
        });
      }
      if (this.onlyShowEndingAccount) {
        txs = txs.filter(tx => tx.endingAccount);
      }
      if (this.onlyShowEnding) {
        txs = txs.filter(tx => tx.ending);
      }
      return Object.freeze(txs);
    },
    pagination: {
      get() {
        if (this.$q.screen.height == 0) return { rowsPerPage: 0 };
        const pixels = this.$q.screen.sm
          ? this.$q.screen.height
          : this.$q.screen.height - 50;
        const rowPixels = pixels - 42 - 28 - 33; //table title, row header, row-footer
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
    const runningBalances = await getRunningBalances();
    Vue.set(this, "runningBalances", Object.freeze(runningBalances));
  },
  mounted() {
    window.__vue_mounted = "PageTokenTransactions";
  }
};
</script>
