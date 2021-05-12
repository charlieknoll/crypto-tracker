# CryptoTracker (crypto-tracker)

Track your crypto capital gains

## Setup

- Enter accounts
- Setup etherscan API KEY
- Import transaction json for each account
- Import token transaction json for each account
- Setup USD pegged token codes
- Export csv list of trades, income and spending


## Install the dependencies
```bash
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)
```bash
quasar dev
```

### Lint the files
```bash
npm run lint
```

### Build the app for production
```bash
quasar build
```

### Customize the configuration
See [Configuring quasar.conf.js](https://quasar.dev/quasar-cli/quasar-conf-js).


## State strategy

Chain transactions, token transactions, exchange transactions are stored in their imported format in local storage. This is because they must be decorated (similar to joined to leaf nodes in SQL) with calced values. E.g. toName, fromName.

Because chain and token transactions are immutable, they are merged into the state using the hash. Exchange transactions are matched on a hash of a number of parameters (timestamp, action, asset, amount, account). If you need to import updated data, you'll need to delete all exhange transactions and re import everything.

Issues that this solves are describe in this blog post:

https://www.cointracker.io/blog/defi-yield-farming-crypto-tax-guide

https://coinpanda.io/blog/cryptocurrency-staking-taxes/

To use the tool:

- Add an owned account on the "Addresses" page
- Import account and token transactions on the "Import" page
- Review the account transactions on the "Chain Transactions" page
- Assign names and account types to the "Unnamed Accounts" - it is helpful to open the apps in 2 tabs, one with "Accounts" page open and one with "Chain Transactions" page open
- Ctrl+click to open the Chain Transaction on etherscan
- It is important to set the account type for tax classification purposes