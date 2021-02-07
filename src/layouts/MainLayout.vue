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
    icon: "mdi-history",
    label: "Opening positions",
    separator: false,
    to: "/opening-positions"
  },

  {
    icon: "mdi-history",
    label: "Account Transactions",
    separator: false,
    to: "/chain-transactions"
  },
  {
    icon: "mdi-history",
    label: "Token Transactions",
    separator: false,
    to: "/token-transactions"
  },
  {
    icon: "mdi-history",
    label: "Exchange Trades",
    separator: false,
    to: "/exchange-transactions"
  },
  {
    icon: "mdi-history",
    label: "Capital Gains",
    separator: true,
    to: "/capital-gains"
  },
  {
    icon: "mdi-import",
    label: "Import",
    separator: false,
    to: "/import"
  },
  {
    icon: "mdi-import",
    class: "mdi-rotate-180",
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

export default {
  name: "MainLayout",
  data() {
    return {
      leftDrawerOpen: false,
      menuList
    };
  }
};
</script>
