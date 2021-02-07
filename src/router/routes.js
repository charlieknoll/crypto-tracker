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
        name: "settings",
        path: "settings",
        component: () => import("pages/PageSettings.vue")
      },
      {
        name: "addresses",
        path: "addresses",
        component: () => import("pages/PageAddresses.vue")
      },
      {
        name: "chain-transactions",
        path: "chain-transactions",
        component: () => import("pages/PageChainTransactions.vue")
      },
      {
        name: "token-transactions",
        path: "token-transactions",
        component: () => import("pages/PageTokenTransactions.vue")
      },
      {
        name: "exchange-transactions",
        path: "exchange-transactions",
        component: () => import("pages/PageExchangeTransactions.vue")
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
