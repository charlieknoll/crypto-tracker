const empty = function empty (e) {
  if (typeof e === 'string') {
    e = e.trim()
  }
  switch (e) {
    case '':
    case 0:
    case '0':
    case null:
    case false:
    case typeof e === 'undefined':
      return true
    default:
      return false
  }
}
export { empty }
