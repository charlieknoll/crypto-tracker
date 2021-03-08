<template>
  <q-page class="" id="pageChainTransactions">
    <table-transactions
      :title="'Chain Transactions - ' + $store.taxYear"
      :data="filtered"
      :columns="columns"
    >
      <template v-slot:top-right>
        <div style="min-width: 250px; display: inline-block;" class="q-mr-sm">
          <q-select
            filled
            v-model="$store.selectedAccounts"
            multiple
            :options="$store.accounts"
            use-chips
            stack-label
            label="Accounts"
          />
        </div>
        <q-toggle
          class="q-mr-lg"
          v-model="onlyShowUnNamed"
          label="Only Unnamed"
        ></q-toggle>
      </template>
    </table-transactions>
  </q-page>
</template>

<script>
import { store } from "../boot/store";
import { actions } from "../boot/actions";
import { getChainTransactions, columns } from "../services/chain-tx-provider";
import Vue from "Vue";
import TableTransactions from "src/components/TableTransactions.vue";
import { filterByAccounts, filterByYear } from "src/services/filter-service";

export default {
  name: "PageChainTransactions",
  components: { TableTransactions },
  data() {
    return {
      onlyShowUnNamed: false,
      columns,
      page: 1,
      chainTransactions: Object.freeze([]),
      $store: store,
      $actions: actions
    };
  },
  computed: {
    filtered() {
      let txs = filterByYear(this.chainTransactions, this.$store.taxYear);

      if (this.onlyShowUnNamed) {
        txs = txs.filter(
          tx =>
            tx.toName.substring(0, 2) == "0x" ||
            tx.fromName.substring(0, 2) == "0x"
        );
      } else {
        txs = filterByAccounts(txs, this.$store.selectedAccounts, true);
      }
      return Object.freeze(txs);
    }
  },
  methods: {
    async load() {
      const chainTransactions = await getChainTransactions();
      Vue.set(this, "chainTransactions", Object.freeze(chainTransactions));
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
    window.__vue_mounted = "pageChainTransactions";
  }
};
</script>
