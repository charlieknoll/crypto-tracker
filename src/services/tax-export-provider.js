import { formatCurrency } from "../utils/moneyUtils";
export const columns = [
  {
    name: "asset",
    label: "Asset",
    field: "asset",
    align: "left"
  },
  {
    name: "dateSold",
    label: "Date Sold",
    field: "date",
    align: "left"
  },
  {
    name: "dateAcquired",
    label: "Date Acquired",
    field: "dateAcquired",
    align: "left"
  },
  {
    name: "longShort",
    label: "Type",
    field: "longShort",
    align: "left"
  },
  {
    name: "amount",
    label: "Amount",
    field: "amount",
    align: "left"
  },
  {
    name: "proceeds",
    label: "Proceeds",
    field: "proceeds",
    align: "right",
    format: (val, row) => formatCurrency(val)
  },
  {
    name: "costBasis",
    label: "Cost Basis",
    field: "costBasis",
    align: "right",
    format: (val, row) => formatCurrency(val)
  },
  {
    name: "gainOrLoss",
    label: "Gain/Loss",
    field: "gainOrLoss",
    align: "right",
    format: (val, row) => formatCurrency(val)
  }
];
