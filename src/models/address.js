export default function (a) {
  return {
    address: a.address,
    name: a.name,
    type: a.type,
    chains: a.chains ?? "",
  };
}
