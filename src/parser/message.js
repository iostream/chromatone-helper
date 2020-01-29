var lib = {};
module.exports = lib;

function createMessage(message, index) {
  var _message = message;
  var _index = index || false;
  return {
    getMessage: function() { return _message; },
    getIndex: function() { return _index; }
  };
}

lib.createMessageContainer = function() {
  var _errors = [];
  var _warnings = [];
  return {
    addError: function (message, index) {
      _errors.push(createMessage(message, index));
    },
    addWarning: function (message, index) {
      _warnings.push(createMessage(message, index));
    },
    getErrors: function() {
      return _errors;
    },
    getWarnings: function() {
      return _warnings;
    }
  };
}
