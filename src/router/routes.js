const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "dashboard",
        path: "",
        component: () => import("pages/PageDashboard.vue")
      },
      {
        name: "Settings",
        path: "settings",
        component: () => import("pages/PageSettings.vue")
      },
      {
        name: "Addresses",
        path: "addresses",
        component: () => import("pages/PageAddresses.vue")
      },
      {
        name: "Chain Transactions",
        path: "chain-transactions",
        component: () => import("pages/PageChainTransactions.vue")
      },
      {
        name: "Token Transactions",
        path: "token-transactions",
        component: () => import("pages/PageTokenTransactions.vue")
      },
      {
        name: "Exchange Trades",
        path: "exchange-transactions",
        component: () => import("pages/PageExchangeTransactions.vue")
      },
      {
        name: "Offchain Transfers",
        path: "offchain-transfers",
        component: () => import("pages/PageOffchainTransfers.vue")
      },
      {
        name: "Running Balances",
        path: "running-balances",
        component: () => import("pages/PageRunningBalances.vue")
      },
      {
        name: "Capital Gains",
        path: "capital-gains",
        component: () => import("pages/PageCapitalGains.vue")
      },
      {
        name: "Opening Positions",
        path: "opening-positions",
        component: () => import("pages/PageOpeningPositions.vue")
      },
      {
        name: "Import",
        path: "import",
        component: () => import("pages/PageImport.vue")
      }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "*",
    component: () => import("pages/Error404.vue")
  }
];

export default routes;
