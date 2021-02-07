const methodIds = [
  {
    id: "0xb6b55f25",
    name: "deposit"
  },
  {
    id: "0x095ea7b3",
    name: "approve"
  },
  {
    id: "0x029b2f34",
    name: "add_liquidity"
  },
  {
    id: "0x7d49d875",
    name: "remove_liquidity"
  },
  {
    id: "0x2e1a7d4d",
    name: "withdraw"
  },
  {
    id: "0xa6417ed6",
    name: "exchange_underlying"
  },
  {
    id: "0xa9059cbb",
    name: "transfer"
  },
  {
    id: "0x029b2f34",
    name: "add_liquidity"
  },
  {
    id: "0xab832b43",
    name: "grant"
  },
  {
    id: "0x1e83409a",
    name: "claim"
  },
  {
    id: "0x6a627842",
    name: "mint"
  },
  {
    id: "0x65fc3873",
    name: "create_lock"
  },
  {
    id: "0xd7136328",
    name: "vote_for_gauge_weights"
  },
  {
    id: "0x3ccfd60b",
    name: "withdraw"
  },
  {
    id: "0x3ccfd60b",
    name: "withdraw"
  },
  {
    id: "0x3ccfd60b",
    name: "withdraw"
  }
];
export default function getMethodName(input) {
  if (input == "0x") return "";
  const methodId = methodIds.find(m => m.id === input.substring(0, 10));
  return methodId ? methodId.name : "";
}
