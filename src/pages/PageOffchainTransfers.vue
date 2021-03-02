<template>
  <q-page class="" id="pageOffchainTransfers" ref="page">
    <q-table
      title="Offchain Transfers"
      :data="filtered"
      :columns="columns"
      row-key="txId"
      dense
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
        <q-btn class="q-ml-lg" color="negative" label="Clear" @click="clear" />
      </template>
    </q-table>
  </q-page>
</template>

<script>
import { store } from "../boot/store";
import { actions } from "../boot/actions";

import { columns } from "../services/offchain-transfers-provider";
import Vue from "Vue";

export default {
  name: "PageOffchainTransfers",
  data() {
    return {
      accountFilter: "",
      offchainTransfers: Object.freeze([]),
      columns,
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
          ? this.offchainTransfers
          : this.offchainTransfers.filter(
              ct => parseInt(ct.date.substring(0, 4)) == this.$store.taxYear
            );

      if (this.accountFilter.length == 0) return txs;
      const filter = this.accountFilter.toLowerCase();
      txs = txs.filter(function(t) {
        return (
          t.toAccount.toLowerCase().includes(filter) ||
          t.fromAccount.toLowerCase().includes(filter)
        );
      });

      return txs;
    }
  },
  methods: {
    clear() {
      this.$actions.setData("offchainTransfers", []);
      this.offchainTransfers = [];
    },
    async load() {
      const offchainTransfers =
        (await this.$actions.getData("offchainTransfers")) ?? [];
      Vue.set(this, "offchainTransfers", Object.freeze(offchainTransfers));
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
    window.__vue_mounted = "PageOffchainTransfers";
  }
};
</script>
