## Tax Classification and Coding Rules

### Expense Coding

Expenses are determined if the "To Account" of a chain tx is of type "Spending". In this case both the tx fee and the amount spent are considered for recognizing a realized gain. E.g. amount = tx amount + fee, fee = 0.0.

Errored transaction fees are considered realized gains and classified as expenses as well.

All amounts are converted to the amount * Base Currency Price on the day of the exchange.

### Transfer Coding

Transfer fees paid using a utility token are considered a realized gain and adjustment to the transferred amount of tokens' cost basis in base currency terms. These are applied on a FIFO basis so the cost basis can increase for the oldest tokens held.

### Base currency Coding

Base currency tokens can be exchanged with each other and are assumed to be 1:1 to the base currency.  So a trade of 900 USD for 1000 USDT would be considered an income event of 100 USD.

### Short vs Long Term Gains

