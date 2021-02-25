<template>
  <q-page class="" id="pageTokenTransactions">
    <q-table
      title="Token Transactions"
      :data="filtered"
      :columns="columns"
      row-key="txId"
      dense
      @row-click="click"
      :pagination.sync="pagination"
      :rows-per-page-options="[0]"
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
        <q-toggle
          class="q-mr-lg"
          v-model="onlyShowTracked"
          label="Only Tracked"
        ></q-toggle>
      </template>
    </q-table>
  </q-page>
</template>

<script>
import { store } from "../boot/store";
import { actions } from "../boot/actions";
import { getTokenTransactions, columns } from "../services/token-tx-provider";
import Vue from "Vue";

export default {
  name: "PageTokenTransactions",
  data() {
    return {
      accountFilter: "",
      onlyShowTracked: true,
      tokenTransactions: Object.freeze([]),
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
          ? this.tokenTransactions
          : this.tokenTransactions.filter(
              ct => parseInt(ct.date.substring(0, 4)) == this.$store.taxYear
            );

      if (this.onlyShowTracked) {
        txs = txs.filter(tx => tx.tracked);
      }
      if (this.accountFilter) {
        txs = txs.filter(
          tx =>
            tx.toName
              .toLowerCase()
              .includes(this.accountFilter.toLowerCase()) ||
            tx.fromName.toLowerCase().includes(this.accountFilter.toLowerCase())
        );
      }
      return txs;
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
    }
  },
  methods: {
    click(evt, row, index) {
      if (evt.ctrlKey) {
        window.open("https://etherscan.io/tx/" + row.hash);
      }
    }
  },
  async created() {
    const tokenTxs = await getTokenTransactions();
    Vue.set(this, "tokenTransactions", Object.freeze(tokenTxs));
  },
  mounted() {
    window.__vue_mounted = "PageTokenTransactions";
  }
};
</script>
