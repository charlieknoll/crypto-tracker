<template>
  <q-page class="" id="pageOpeningPositions">
    <q-table
      title="Opening Positions"
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

import { columns } from "../services/opening-positions-provider";
export default {
  name: "PageOpeningPositions",
  data() {
    return {
      filter: "",
      history: store.openingPositions,
      columns: columns,
      pagination: {
        rowsPerPage: 0
      },
      $store: store,
      $actions: actions
    };
  },
  computed: {
    filteredHistory() {
      if (this.filter.length == 0) return this.history;
      const filter = this.filter;
      const filtered = this.history.filter(function(a) {
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

  mounted() {
    window.__vue_mounted = "PageOpeningPositions";
  }
};
</script>
