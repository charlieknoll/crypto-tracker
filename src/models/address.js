export default function(a) {
  return {
    address: a.address,
    name: a.name,
    type: a.type,
    imported: a.imported ?? false,
    lastBlockSync: a.lastBlockSync ?? 0
  };
}
