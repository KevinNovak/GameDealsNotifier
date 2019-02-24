function secondsSinceEpoch() {
  return Math.floor(new Date().getTime() / 1000);
}

module.exports = {
  secondsSinceEpoch
};
