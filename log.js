var log = (function() {
  var el = document.getElementById('console');

  function _log(level, message) {
    var tmp = document.createElement('div');
    tmp.className=level;
    tmp.innerText=message;
    el.appendChild(tmp);
  }

  function log(message) {
    _log('info', message);
  }

  ['info', 'error', 'warning', 'success'].forEach(function(level) {
    log[level] = _log.bind(log, level);
  });

  return log;
})();