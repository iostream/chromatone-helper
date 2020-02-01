var lib = {};
module.exports = lib;

/**
 * TODO Use the clone methods or delete them.
 */

lib.createCompositeParserDelegate = function(subjectVariables) {
  var _variables = subjectVariables;
  return {
    createSubject: function(subjectString, name) {
      return createSubject(subjectString, name);
    },
    createSubjectComposite: function(name) {
      return createSubjectComposite(name, _variables);
    }
  };
};

function createSubject(match, name) {
  var _options = createOptions();
  var _name = name;
  var _match = match;
  return {
    addOption: function(key, valueAsString, operator, isShort, isForced) {
      _options.addOption(key, valueAsString, operator, isShort, isForced);
    },
    setOptions: function(options) {
      _options = options;
    },
    getOptions: function() {
      return _options;
    },
    getName: function() {
      return _name;
    },
    getMatch: function() {
      return _match;
    },
    clone: function() {
      var clone = createSubject(_asString, _name);
      clone.setOptions(_options.clone());
      return clone;
    },
    asString: function() {
      var options = _options.asString();
      if (options.length > 0) {
        options = " " + options;
      }
      return '[' + _match[0] + options + ']';
    }
  };
}

var asStringIndent = "";

function createSubjectComposite(name, variables) {
  var _options = createOptions();
  var _name = name;
  var _children = [];
  var _variables = variables;

  return {
    addOption: function(key, valueAsString, operator, isShort, isForced) {
      _options.addOption(key, valueAsString, operator, isShort, isForced);
    },
    setOptions: function(options) {
      _options = options;
    },
    getName: function() {
      return _name;
    },
    addChild: function(child) {
      _children.push(child);
    },
    getChildren: function() {
      return _children;
    },
    clone: function() {
      var clone = createSubjectComposite(_name, _variables);
      _children.forEach(function(child) {
        clone.addChild(child.clone());
      });
      clone.setOptions(_options.clone());
      return clone;
    },
    asString: function(indentation) {
      var indentation = indentation || "";
      var childIndent = indentation + asStringIndent;
      var result = indentation + "(";
      if (_name) {
        result += (indentation + name + ":");
      }
      var options = _options.asString();
      if (options.length > 0) {
        result += (" " + options);
      }
      _children.forEach(function(child) {
        result += (childIndent + child.asString(childIndent) + " ");
      });
      result += (indentation + ")");
      return result;
    },
    /**
     * subjectBuilderFactory(errorHandler) is a method which is expected to return a new object with the methods:
     * - withMatch(match)
     * - withOption(key, value, operator) // called for all options, from least specific to most specific
     * - getResult() // returns the resulting subject
     */
    createFlatSubjectList: function(subjectBuilderFactory) {
      // return this.createFlatSubjectListRecursive(subjectBuilderFactory, []);
      return this.createFlatSubjectListRecursive2(subjectBuilderFactory, []);
    },
    /**
     * In this version the outer parts are the more specific options. I think
     * this could make more sense.
     */
    createFlatSubjectListRecursive2: function(subjectBuilderFactory, parentOptionsList) {
      var subjects = [];

      /**
       * The builder only gets onOption calls for the operator "="
       *  - when they are the first
       *  - or they are forced
       */
      function isAssignable(key, operator, isForced, assignments) {
        if (operator !== '=') {
          return true;
        }
        if (typeof(assignments[key]) === 'undefined') {
          assignments[key] = true;
          return true;
        }
        return isForced;
      }

      var optionsList = parentOptionsList.concat([_options]);

      _children.forEach(function(child) {
        if (typeof child.createFlatSubjectListRecursive2 === 'function') {
          subjects = subjects.concat(child.createFlatSubjectListRecursive2(subjectBuilderFactory, optionsList));
          return;
        }
        var assignments = {};
        var subjectBuilder = subjectBuilderFactory();
        subjectBuilder.withMatch(child.getMatch());
        child.getOptions().forEachOption(function(key, value, operator, isShort, isForced) {
          if (!isAssignable(key, operator, isForced, assignments)) {
            return;
          }
          subjectBuilder.withOption(key, value, operator, isShort, isForced);
        });
        optionsList.forEach(function(options) {
          options.forEachOption(function(key, value, operator, isShort, isForced) {
            if (!isAssignable(key, operator, isForced, assignments)) {
              return;
            }
            subjectBuilder.withOption(key, value, operator, isShort, isForced);
          });
        });
        subjects.push(subjectBuilder.getResult());
      });
      return subjects;
    },
    // XXX now unused:
    /*createFlatSubjectListRecursive: function(subjectBuilderFactory, parentOptionsList) {
      var subjects = [];

      var optionsList = parentOptionsList.concat([_options]);

      _children.forEach(function(child) {
        if (typeof child.createFlatSubjectListRecursive === 'function') {
          subjects = subjects.concat(child.createFlatSubjectListRecursive(subjectBuilderFactory, optionsList));
          return;
        }
        var subjectBuilder = subjectBuilderFactory();
        subjectBuilder.withMatch(child.getMatch());
        optionsList.forEach(function(options) {
          options.forEachOption(function(key, value, operator, isShort) {
              subjectBuilder.withOption(key, value, operator, isShort);
          });
        });
        child.getOptions().forEachOption(function(key, value, operator, isShort) {
            subjectBuilder.withOption(key, value, operator, isShort);
        });
        subjects.push(subjectBuilder.getResult());
      });
      return subjects;
    }*/
  };
}

function createOptions() {
  var _shortOptions = {};
  var _options = {};

  function addOption(key, valueAsString, operator, isForced, options) {
    if (!options[key]) {
      options[key] = {};
    }
    if (!options[key][operator]) {
      options[key][operator] = [];
    }
    if (operator === '=') {
      // only one value is allowed to be added via "="
      if (Array.isArray(options[key][operator]) || isForced) {
        options[key][operator] = {value: valueAsString, isForced: isForced};
      }
    } else {
      options[key][operator].push(valueAsString);
    }
  }

  function createString(options) {
    var str = '';
    forEachOption(options, function(key, value, operator, isForced) {
      str += (key + operator + value + (isForced ? '!' : "") + ";");
    });
    return str;
  }

  function forEachOption(options, onOption) {
    for (var key in options) {
      if (!options.hasOwnProperty(key)) {
        continue;
      }
      var option = options[key];
      for (var operator in option) {
        if (!option.hasOwnProperty(operator)) {
          continue;
        }
        var values = option[operator];
        if (operator === '=') {
          onOption(key, values.value, operator, values.isForced);
          continue;
        }
        values.forEach(function(value) {
          onOption(key, value, operator, false);
        });
      }
    }
  }

  return {
    addOption: function(key, valueAsString, operator, isShort, isForced) {
      var options = isShort ? _shortOptions : _options;
      addOption(key, valueAsString, operator, isForced, options);
    },
    asString: function() {
      var shortOptions = createString(_shortOptions);
      var options = createString(_options);
      return (shortOptions !== '' ? 'short:' + shortOptions : '')
        + (options !== '' ? 'options:' + options : '')
    },
    isEmpty: function() {
      return _shortOptions.length === 0 && _options.length === 0;
    },
    forEachOption: function(callback) {
      forEachOption(_options, function(key, value, operator, isForced) {
        callback(key, value, operator, false, isForced);
      });
      forEachOption(_shortOptions, function(key, value, operator, isForced) {
        callback(key, value, operator, true, isForced);
      });
    },
    clone: function() {
      var clone = createOptions();
      forEachOption(_shortOptions, function(key, value, operator, isForced) {
        clone.addOption(key, value, operator, true, isForced);
      });
      forEachOption(_options, function(key, value, operator, isForced) {
        clone.addOption(key, value, operator, false, isForced);
      });
      return clone;
    }
  };
}