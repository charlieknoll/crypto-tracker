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
    />
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
      onlyShowUnNamed: false,
      tokenTransactions: Object.freeze([]),
      columns: columns,
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
          ? this.tokenTransactions
          : this.tokenTransactions.filter(
              ct => parseInt(ct.date.substring(0, 4)) == this.$store.taxYear
            );

      if (this.onlyShowUnNamed) {
        txs = txs.filter(
          tx =>
            tx.toName.substring(0, 2) == "0x" ||
            tx.fromName.substring(0, 2) == "0x"
        );
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
