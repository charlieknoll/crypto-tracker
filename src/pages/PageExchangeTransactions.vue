<template>
  <q-page class="" id="pageExchangeTransactions">
    <q-table
      title="Exchange Transactions"
      :data="history"
      :columns="columns"
      row-key="txId"
      dense
      :pagination.sync="pagination"
      :rows-per-page-options="[0]"
    />
  </q-page>
</template>

<script>
import { store } from "../boot/store";
import { actions } from "../boot/actions";
import { exchangeHistory, columns } from "../services/exchange-tx-provider";

export default {
  name: "PageExchangeTransactions",
  data() {
    return {
      filter: "",
      history: [],
      columns,
      pagination: {
        rowsPerPage: 0
      },
      $store: store,
      $actions: actions
    };
  },
  // computed: {
  //   filteredHistory() {
  //     if (this.filter.length == 0) return this.history;
  //     const filter = this.filter;
  //     const filtered = this.history.filter(function(a) {
  //       return (
  //         (a.name && a.name.includes(filter)) ||
  //         (a.address && a.address.includes(filter)) ||
  //         !a.name ||
  //         !a.address
  //       );
  //     });

  //     return filtered;
  //   }
  // },
  methods: {
    // click(evt, row, index) {
    //   window.open("https://etherscan.io/tx/" + row.hash);
    // }
  },
  mounted() {
    window.__vue_mounted = this.name;
    this.history = exchangeHistory();
  }
};
</script>
