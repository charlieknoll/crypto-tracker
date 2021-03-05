<template>
  <q-table
    row-key="txId"
    dense
    :title="title"
    :data="data"
    :columns="columns"
    @row-click="rowClick"
    :pagination.sync="pagination"
    :rows-per-page-options="[0]"
    :style="{ height: tableHeight }"
    ref="transactionTable"
  >
  </q-table>
</template>

<script>
import { QTable } from "quasar";
export default {
  name: "TableTransactions",
  extends: QTable,
  props: {
    title: String,
    data: Array,
    columns: Array,
    rowClick: Function
  },
  data() {
    return {
      page: 1
    };
  },
  computed: {
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
  }
};
</script>

<style></style>
