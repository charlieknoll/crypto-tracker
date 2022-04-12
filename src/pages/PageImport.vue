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
      <div style="min-width: 160px; display: inline-block" class="q-mr-sm">
        <q-select
          filled
          v-model="chain"
          :options="chains"
          stack-label
          label="Chain"
        />
      </div>
      <br />
      <q-btn
        :label="`Import ${chain} Transactions`"
        @click="importTransactions"
      ></q-btn>
      <q-btn
        label="Clear All Chain Transactions"
        @click="clearTransactions"
      ></q-btn>

      <br />
      <q-btn
        label="Import Coinbase Pro Transactions"
        @click="importCbpTransactions"
      ></q-btn>
      <q-btn label="Clear Price History" @click="clearPriceHistory"></q-btn>
      <q-btn label="test" @click="test"></q-btn>
      <br />

      <p>
        <span>Current block: {{ currentBlock }}</span>
      </p>

      <q-list>
        <q-item v-for="address in ownedAddresses" :key="address.address">
          <q-item-section>
            <q-item-label>{{ address.name }}</q-item-label>
            <q-item-label caption>{{ address.address }}</q-item-label>
          </q-item-section>

          <q-item-section side top>
            <q-item-label caption
              >Last block: {{ lastBlockSync(address) }}</q-item-label
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
  getTransactions,
  scanProviders,
} from "../services/etherscan-provider";
export default {
  name: "PageImport",
  data() {
    return {
      files: null,
      chain: "",
      messages: [],
      chains: [],
      currentBlock: 0,
      $store: store,
      $actions: actions,
    };
  },
  methods: {
    async importTransactions() {
      //call etherscan import service
      try {
        this.$store.importing = true;
        const provider = scanProviders.find((sp) => sp.gasType == this.chain);
        await getTransactions(provider);
      } finally {
        this.$store.importing = false;
      }
    },
    async importCbpTransactions() {
      //call etherscan import service
      try {
        this.$store.importing = true;
        await importCbpTrades(true);
      } finally {
        this.$store.importing = false;
      }
    },
    lastBlockSync(a) {
      return a[`last${this.chain}BlockSync`];
    },
    test() {
      this.$store.addresses[0].lastETHBlockSync = 888;
    },
    clearPriceHistory() {
      this.$actions.setData("prices", []);
    },
    clearCurveHistory() {
      const prices = actions.getData("prices").filter((p) => p.symbol != "CRV");
      this.$actions.setData("prices", prices);
    },
    clearTransactions() {
      this.$actions.setData("chainTransactions", []);
      this.$actions.setData("tokenTransactions", []);
      this.$actions.setData("internalTransactions", []);
      const addresses = [...this.$store.addresses];
      const cleansedAddresses = addresses.map((a) => {
        const cleanAddress = {};
        cleanAddress.name = a.name;
        cleanAddress.address = a.address;
        cleanAddress.chains = a.chains;
        cleanAddress.type = a.type;
        for (const sp of scanProviders) {
          cleanAddress[`last${sp.gasType}BlockSync`] = 0;
        }

        return cleanAddress;
      });

      this.$actions.setObservableData(
        "addresses",
        cleansedAddresses.filter(
          (a) => a.name && a.name.substring(0, 2) != "0x"
        )
      );
    },
  },

  computed: {
    ownedAddresses() {
      //TODO filter on chain
      var accounts = this.$store.addresses.filter(
        (a) =>
          a.type == "Owned" &&
          a.chains.replaceAll(" ", "").split(",").indexOf(this.chain) > -1
      );
      return accounts;
      // return accounts.map((a) => {
      //   a.lastBlockSync = a[`last${this.chain}BlockSync`];
      //   return a;
      // });
    },
  },
  watch: {
    files: async function (val) {
      if (val && val.length == 0) return;
      if (val && val.length) this.$store.importing = true;
      await processFiles(val);
      this.$store.importing = false;
      this.files = [];
    },
    chain: async function (val) {
      this.currentBlock = await getCurrentBlock(
        scanProviders.find((sp) => sp.gasType == this.chain)
      );
    },
  },

  async mounted() {
    window.__vue_mounted = "PageImport";
    this.chains = scanProviders.map((sp) => sp.gasType);
    this.chain = "ETH";
  },
};
</script>
