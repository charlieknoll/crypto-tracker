<template>
  <q-table
    row-key="txId"
    dense
    :title="title"
    :data="data"
    :columns="columns"
    @row-click="click"
    v-bind="$attrs"
    v-model:pagination="pagination"
    :rows-per-page-options="[0]"
    :style="{ height: tableHeight }"
    ref="transactionTable"
  >
    <template v-slot:top-right>
      <slot name="top-right"></slot>
    </template>
  </q-table>
</template>

<script>
export default {
  name: "TableTransactions",
  // eslint-disable-next-line
  props: {
    title: String,
    data: Array,
    columns: Array
  },
  data() {
    return {
      page: 1,
      ready: false
    };
  },
  computed: {
    pagination: {
      get() {
        if (!this.ready) return { rowsPerPage: 1 };
        if (this.$q.screen.height == 0) return { rowsPerPage: 1 };
        if (!this.$refs.transactionTable) return { rowsPerPage: 1 };
        const pixels = this.$q.screen.sm
          ? this.$q.screen.height
          : this.$q.screen.height - 50;
        const titleHeight = this.$refs.transactionTable.$el.firstChild
          .offsetHeight;
        const headerHeight = this.$refs.transactionTable.$el.children[1]
          .firstChild.firstChild.offsetHeight;
        const footerHeight = this.$refs.transactionTable.$el.children[2]
          .offsetHeight;
        const rowPixels = pixels - titleHeight - headerHeight - footerHeight; //table title, row header, row-footer
        //const rowPixels = pixels - 78 - 28 - 33; //table title, row header, row-footer
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
  watch: {
    data() {
      this.page = 1;
    }
  },
  methods: {
    click(evt, row, index) {
      if (evt.ctrlKey) {
        if (row.hash) {
          const txId = row.hash.split("-");
          window.open("https://etherscan.io/tx/" + txId[0]);
        }
      }
    }
  },
  mounted() {
    this.ready = true;
  }
};
</script>

<style></style>
