<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />

        <q-toolbar-title>
          Crypto Tracker
        </q-toolbar-title>
        <q-spinner
          color="white"
          size="3em"
          :class="[$store.importing ? '' : 'hidden']"
        />
        <q-btn-dropdown stretch flat :label="taxYear">
          <q-list>
            <q-item
              v-for="n in taxYears"
              :key="`x.${n}`"
              clickable
              v-close-popup
              tabindex="0"
              @click="taxYear = n"
            >
              <q-item-label>{{ n }}</q-item-label>
            </q-item>
          </q-list>
        </q-btn-dropdown>
        <div>v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      content-class="bg-grey-1"
    >
      <q-list>
        <template v-for="(menuItem, index) in menuList">
          <q-item
            :key="index"
            clickable
            :to="menuItem.to"
            :active="menuItem.to === $route.path"
            exact
            v-ripple
          >
            <q-item-section avatar>
              <q-icon :class="menuItem.class" :name="menuItem.icon" />
            </q-item-section>
            <q-item-section>
              {{ menuItem.label }}
            </q-item-section>
          </q-item>
          <q-separator :key="'sep' + index" v-if="menuItem.separator" />
        </template>
        <q-item>
          <q-file
            v-model="files"
            label="Select/Drop csv files bitcoin.tax format"
            filled
            multiple
          />
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
const menuList = [
  {
    icon: "mdi-view-dashboard-variant",
    label: "Dashboard",
    separator: true,
    to: "/"
  },
  {
    icon: "mdi-key-chain-variant",
    label: "Addresses",
    separator: false,
    to: "/addresses"
  },
  {
    icon: "mdi-door-open",
    label: "Opening Positions",
    separator: false,
    to: "/opening-positions"
  },

  {
    icon: "mdi-swap-horizontal-circle",
    label: "Chain Transactions",
    separator: false,
    to: "/chain-transactions"
  },
  {
    icon: "mdi-swap-horizontal-variant",
    label: "Token Transactions",
    separator: false,
    to: "/token-transactions"
  },
  {
    icon: "mdi-file-swap",
    label: "Exchange Trades",
    separator: false,
    to: "/exchange-transactions"
  },
  {
    icon: "mdi-file-swap",
    label: "Offchain Transfers",
    separator: false,
    to: "/offchain-transfers"
  },
  {
    icon: "mdi-note-text-outline",
    label: "Running Balances",
    separator: false,
    to: "/running-balances"
  },
  {
    icon: "mdi-cash-multiple",
    label: "Income",
    separator: false,
    to: "/income"
  },
  {
    icon: "mdi-credit-card-minus",
    label: "Spending",
    separator: false,
    to: "/spending"
  },
  {
    icon: "mdi-door-closed",
    label: "Closing Positions",
    separator: false,
    to: "/closing-positions"
  },
  {
    icon: "mdi-calculator",
    label: "Capital Gains",
    separator: true,
    to: "/capital-gains"
  },
  {
    icon: "mdi-database-arrow-right",
    label: "Import",
    separator: false,
    to: "/import"
  },
  {
    icon: "mdi-database-arrow-down",
    label: "Tax Export",
    separator: true,
    to: "/export"
  },
  {
    icon: "mdi-cog",
    label: "Settings",
    separator: false,
    to: "/settings"
  },
  {
    icon: "help",
    iconColor: "primary",
    label: "Help",
    to: "/help",
    separator: false
  }
];
import { store } from "../boot/store";
import { actions } from "../boot/actions";
import { processFiles } from "../services/file-handler";

export default {
  name: "MainLayout",
  data() {
    return {
      leftDrawerOpen: false,
      files: null,
      menuList,
      taxYear: store.taxYear,
      taxYears: store.taxYears,
      $store: store
    };
  },

  watch: {
    taxYear: function(val) {
      actions.setObservableData("taxYear", val);
    },
    files: async function(val) {
      if (val && val.length == 0) return;
      if (val && val.length) this.$store.importing = true;
      await processFiles(val);
      this.$store.importing = false;
      this.files = [];
      if (store.onload) store.onload();
    }
  }
};
</script>
