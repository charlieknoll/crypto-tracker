<template>
  <q-page class="" id="pageGiftExport">
    <table-transactions title="Gift Export" :rows="filtered" :columns="columns">
      <template v-slot:top-right>
        <div style="min-width: 250px; display: inline-block" class="q-mr-sm">
          <q-select
            filled
            v-model="$store.selectedAssets"
            multiple
            :options="$store.assets"
            use-chips
            stack-label
            label="Assets"
          />
        </div>

        <q-btn
          class="q-ml-lg"
          color="primary"
          label="Export"
          @click="exportGifts"
        />
      </template>
    </table-transactions>
  </q-page>
</template>

<script>
import { getGiftOpeningPositions } from "../services/capital-gains-provider";
import {
  columns,
  generateOpeningPositions,
} from "../services/gift-export-provider";
import TableTransactions from "src/components/TableTransactions.vue";

import { exportFile } from "quasar";
import { filterByAssets, filterByYear } from "../services/filter-service";
export default {
  name: "PageGiftExport",
  data() {
    return {
      gifts: Object.freeze([]),
      columns,
    };
  },
  components: {
    TableTransactions,
  },
  computed: {
    filtered() {
      let txs = this.gifts;
      txs = filterByAssets(txs, this.$store.selectedAssets);
      txs = filterByYear(txs, this.$store.taxYear);
      return Object.freeze(txs);
    },
  },
  methods: {
    async load() {
      this.gifts = await getGiftOpeningPositions(false);
    },
    exportGifts() {
      const content = generateOpeningPositions(this.filtered);
      const status = exportFile(
        "opening-gifts-" + this.$store.taxYear + ".csv",
        content,
        "text/csv"
      );
      if (status !== true) {
        this.$q.notify({
          message: "Browser denied file download...",
          color: "negative",
          icon: "warning",
        });
      }
    },
  },
  async created() {
    await this.load();
    this.$store.onload = this.load;
  },
  unmounted() {
    this.$store.onload = null;
  },
  mounted() {
    window.__vue_mounted = "PageGiftExport";
  },
};
</script>
