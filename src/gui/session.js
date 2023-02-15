var session = {};
module.exports = session;

function setSessionValue(key, value) {
  if (!window.sessionStorage) {
    return;
  }
  window.sessionStorage.setItem(key, value);
}

function getBooleanSessionValue(key, defaultValue) {
  if (!window.sessionStorage) {
    return defaultValue;
  }
  var item = window.sessionStorage.getItem(key);
  if (item === "true") {
    return true;
  }
  if (item === "false") {
    return false;
  }
  return defaultValue;
}

/**
 * callback(fullKeyWithoutPrefix, valueAsString);
 */
function forEachItemsByKeyPrefix(prefix, callback) {
  var key;
  var i = 0;
  while ((key = window.sessionStorage.key(i++)) ) {
    if (key.indexOf(prefix) === 0) {
      var subKey = key.substr(prefix.length);
      callback(subKey, window.sessionStorage.getItem(key));
    }
  }
}

var UPDATE_DAW_KEY = "update_daw";
session.setDAWUpdateActivated = function(enabled) {
  setSessionValue(UPDATE_DAW_KEY, !!enabled);
}

session.isDAWUpdateActivated = function() {
  return getBooleanSessionValue(UPDATE_DAW_KEY, false);
}

var TEXT_AREAS_KEY_PREFIX = "text_area_sizes.";
session.saveTextAreaSizes = function(textArea) {
  var keyPrefix = TEXT_AREAS_KEY_PREFIX + textArea.name + ".";
  setSessionValue(keyPrefix + "height", textArea.style.height);
  setSessionValue(keyPrefix + "width", textArea.style.width);
}

session.restoreTextAreaSizes = function(form) {
  forEachItemsByKeyPrefix(TEXT_AREAS_KEY_PREFIX, function(key, value) {
    var keyParts = key.split(".");
    if (keyParts < 2) {
      return;
    }
    form[keyParts[0]].style[keyParts[1]] = value;
  });
}
