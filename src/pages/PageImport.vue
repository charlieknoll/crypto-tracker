<template>
  <q-page class="constrain q-pa-md" id="pageImport">
    <div class="q-table__title">Import</div>
    <q-form class="q-gutter-md q-pa-lg">
      <p>
        Please see the <router-link to="help">help</router-link> page for
        information on bitcoin.tax file formats.
      </p>
      <q-file
        v-model="files"
        label="Select/Drop csv files bitcoin.tax format"
        filled
        multiple
      />
      <q-btn
        label="Import ETH Transactions"
        @click="importTransactions"
      ></q-btn>
      <q-btn
        label="Import Coinbase Pro Transactions"
        @click="importCbpTransactions"
      ></q-btn>
      <q-btn label="Clear Transactions" @click="clearTransactions"></q-btn>
      <q-btn label="Clear Price History" @click="clearPriceHistory"></q-btn>
      <br />
      <p>Current block: {{ currentBlock }}</p>

      <q-list>
        <q-item v-for="address in ownedAddresses" :key="address.address">
          <q-item-section>
            <q-item-label>{{ address.name }}</q-item-label>
            <q-item-label caption>{{ address.address }}</q-item-label>
          </q-item-section>

          <q-item-section side top>
            <q-item-label caption
              >Last block: {{ address.lastBlockSync }}</q-item-label
            >
          </q-item-section>
        </q-item>
      </q-list>
    </q-form>
  </q-page>
</template>

<script>
import { store } from "../boot/store";
import { actions } from "../boot/actions";
import { processFiles } from "../services/file-handler";
import { importCbpTrades } from "../services/coinbase-provider";
import {
  getCurrentBlock,
  getTransactions
} from "../services/etherscan-provider";
export default {
  name: "PageImport",
  data() {
    return {
      files: null,
      currentBlock: 0,
      messages: [],
      $store: store,
      $actions: actions
    };
  },
  methods: {
    async importTransactions() {
      //call etherscan import service
      try {
        this.$store.importing = true;
        await getTransactions();
      } finally {
        this.$store.importing = false;
      }
    },
    async importCbpTransactions() {
      //call etherscan import service
      try {
        this.$store.importing = true;
        await importCbpTrades();
      } finally {
        this.$store.importing = false;
      }
    },
    clearPriceHistory() {
      this.$actions.setData("prices", []);
    },
    clearCurveHistory() {
      const prices = actions.getData("prices").filter(p => p.symbol != "CRV");
      this.$actions.setData("prices", prices);
    },
    clearTransactions() {
      this.$actions.setData("chainTransactions", []);
      this.$actions.setData("tokenTransactions", []);
      const addresses = [...this.$store.addresses];
      const cleansedAddresses = [];
      for (const a of addresses) {
        //console.log("address:", a);
        a.lastBlockSync = 0;
        if (a.name && a.name.substring(0, 2) != "0x") {
          cleansedAddresses.push(a);
        }
      }
      this.$actions.setObservableData("addresses", cleansedAddresses);
    }
  },

  computed: {
    ownedAddresses() {
      return this.$store.addresses.filter(a => a.type == "Owned");
    }
  },
  watch: {
    files: async function(val) {
      if (val && val.length == 0) return;
      if (val && val.length) this.$store.importing = true;
      await processFiles(val);
      this.$store.importing = false;
      this.files = [];
    }
  },

  async mounted() {
    window.__vue_mounted = "PageImport";
    this.currentBlock = await getCurrentBlock();
  }
};
</script>
