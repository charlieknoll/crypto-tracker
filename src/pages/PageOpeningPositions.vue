<template>
  <q-page class="" id="pageOpeningPositions">
    <q-table
      :title="'Opening Positions'"
      :data="filtered"
      :columns="columns"
      row-key="txId"
      dense
      :pagination.sync="pagination"
      :rows-per-page-options="[0]"
    >
      <template v-slot:top-right>
        <q-btn class="q-ml-lg" color="negative" label="Clear" @click="clear" />
      </template>
    </q-table>
  </q-page>
</template>

<script>
import { store } from "../boot/store";
import { actions } from "../boot/actions";

import { columns } from "../services/opening-positions-provider";
import Vue from "Vue";

export default {
  name: "PageOpeningPositions",
  data() {
    return {
      accountFilter: "",
      openingPositions: Object.freeze([]),
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
      let txs = this.openingPositions;
      if (this.accountFilter.length == 0) return txs;
      const filter = this.filter;
      const filtered = txs.filter(function(a) {
        return (
          (a.name && a.name.includes(filter)) ||
          (a.address && a.address.includes(filter)) ||
          !a.name ||
          !a.address
        );
      });

      return filtered;
    }
  },
  methods: {
    clear() {
      this.$actions.setData("openingPositions", []);
      this.openingPositions = [];
    },
    async load() {
      const openingPositions =
        (await this.$actions.getData("openingPositions")) ?? [];
      Vue.set(this, "openingPositions", Object.freeze(openingPositions));
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
    window.__vue_mounted = "PageOpeningPositions";
  }
};
</script>
