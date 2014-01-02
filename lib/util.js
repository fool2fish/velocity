exports.mix = function(to, src) {
  var i;
  for (i in src) {
    if (!to[i] && src[i]) to[i] = src[i];
  }
}
