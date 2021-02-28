<template>
  <q-page class="" id="pageExchangeTransactions">
    <q-btn @click="clear">Clear</q-btn>
    <q-toggle v-model="groupByDay" label="Group By Day"></q-toggle>
    <q-file
      v-model="files"
      label="Select/Drop csv files bitcoin.tax format"
      filled
      multiple
    />
    <q-table
      title="Exchange Transactions"
      :data="filtered"
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
import { columns, getExchangeTrades } from "../services/exchange-tx-provider";
import { processFile } from "../services/file-handler";
import Vue from "Vue";

const reader = new FileReader();
let currentFileName = null;
reader.onload = async function(event) {
  const result = await processFile(
    currentFileName,
    atob(event.target.result.split("base64,")[1])
  );
  currentFileName = null;
  //console.log(atob(event.target.result.split("base64,")[1]));
};
export default {
  name: "PageExchangeTransactions",
  data() {
    return {
      filter: "",
      exchangeTrades: Object.freeze([]),
      columns,
      files: [],
      groupByDay: true,
      pagination: {
        rowsPerPage: 0
      },
      $store: store,
      $actions: actions
    };
  },
  watch: {
    files: function(val) {
      for (const f of val) {
        const interval = setInterval(() => {
          if (currentFileName != null) return;
          clearInterval(interval);
          currentFileName = f.name;
          reader.readAsDataURL(f);
        }, 400);
      }
    }
  },
  computed: {
    filtered() {
      if (!this.groupByDay) return this.exchangeTrades;
      const grouped = [];
      for (const et of this.exchangeTrades) {
        //find an entry for date/asset
        let dateAsset = grouped.find(
          g => g.asset == et.asset && g.date == et.date
        );
        if (!dateAsset) {
          dateAsset = {
            asset: et.asset,
            date: et.date,
            amount: 0.0,
            fee: 0.0,
            gross: 0.0,
            account: "",
            action: 0,
            txId: "g-"
          };
          grouped.push(dateAsset);
        }
        //add values to date asset
        dateAsset.amount += et.action == "BUY" ? et.amount : -et.amount;
        dateAsset.fee += et.fee;
        dateAsset.gross += et.action == "BUY" ? et.gross : -et.gross;
        dateAsset.runningBalance = et.runningBalance;
        dateAsset.price = dateAsset.gross / dateAsset.amount;
        dateAsset.action += 1;
        dateAsset.txId = "g-" + et.txId.substring(0, 14);
        if (!dateAsset.account.includes(et.account))
          dateAsset.account += et.account + ",";
      }
      return grouped;
    }
  },
  methods: {
    clear() {
      actions.setData("exchangeTrades", []);
      this.files = [];
    }
  },
  async created() {
    const exchangeTrades = await getExchangeTrades();
    Vue.set(this, "exchangeTrades", Object.freeze(exchangeTrades));
  },
  mounted() {
    window.__vue_mounted = this.name;
  }
};
</script>
