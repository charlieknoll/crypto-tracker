<template>
  <q-page class="" id="pageChainTransactions" ref="p">
    <q-table
      title="Chain Transactions"
      :data="filtered"
      :columns="columns"
      row-key="txId"
      dense
      @row-click="click"
      :pagination.sync="pagination"
      :rows-per-page-options="[0]"
      class="my-sticky-header-table"
      :style="{ height: tableHeight }"
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
          v-model="onlyShowUnNamed"
          label="Only Unnamed"
        ></q-toggle>
      </template>
      <template v-slot:body-cell-error="props">
        <q-td :props="props">
          <q-chip
            :color="!props.row.isError ? 'green' : 'red'"
            :class="!props.row.isError ? 'hidden' : ''"
            text-color="white"
            dense
            class="text-weight-bolder"
            square
            >Error!</q-chip
          >
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script>
import { store } from "../boot/store";
import { actions } from "../boot/actions";
import { getChainTransactions, columns } from "../services/chain-tx-provider";
import Vue from "Vue";

export default {
  name: "PageChainTransactions",
  data() {
    return {
      accountFilter: "",
      onlyShowUnNamed: false,
      columns,
      chainTransactions: Object.freeze([]),
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
          ? this.chainTransactions
          : this.chainTransactions.filter(
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
      return Object.freeze(txs);
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
        window.open("https://etherscan.io/tx/" + row.hash);
      }
    }
  },
  async created() {
    const chainTxs = await getChainTransactions();
    Vue.set(this, "chainTransactions", Object.freeze(chainTxs));
  },
  mounted() {
    window.__vue_mounted = "pageChainTransactions";
  }
};
</script>
<style lang="sass">
.my-sticky-header-table
  /* height or max-height is important */
  /* height: 310px */

  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th
    /* bg color is important for th; just specify one */
    background-color: lightgrey

  thead tr th
    position: sticky
    z-index: 1
  thead tr:first-child th
    top: 0

  /* this is when the loading indicator appears */
  &.q-table--loading thead tr:last-child th
    /* height of all previous header rows */
    top: 48px
</style>
