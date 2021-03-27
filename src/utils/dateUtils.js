export const dayNum = function(val) {
  return Math.round(new Date(val).getTime() / 1000 / 60 / 60 / 24);
};
