var lib = {};
module.exports = lib;

/*
  TODO Add feature:
  - when delcaring a variable using $, e.g. "$var: 1 2 3", then the value is only assigned to the variable,
    but gets not inserted back into its parent
*/

// Reused parts of regular expressions:
var NUMBER_REGEX_STR = '-?[\\d]+(?:\\.\\d+)?';
var SMALL_CHARACTER_REGEX_STR = '[a-z]';
var BIG_CHARACTER_REGEX_STR = '[A-Z]';//;
var VARIABLE_REGEX_STR = '[A-Za-z_][A-Za-z_\\d]*';
var VARIABLE_DECLARATION_SUFFIX = ':';
var PURE_VARIABLE_DECLARATION_PREFIX = '\\$';
var EXPRESSION_REGEX_STR = '\\([^\)]+\\)';
var LINE_COMMENT_STR = "#";

// Next possible token states:
var INITIAL = 0;
var WHITESPACE = 1; // includes new lines
var SUBJECT = 2;
var VARIABLE_DECLARATION = 3; // includes pure variable declarations
var VARIABLE = 4;
var SHORT_NUMBER_OPTION = 5;
var SHORT_CHARACTER_OPTION = 6;
var LONG_OPTION = 7;
var OPENED_BRACKET = 8;
var CLOSED_BRACKET = 9;
var LINE_COMMENT = 10;

function createState(thingRegex) {
  // getNextStates() of each state returns the next possible token states
  // and also potentionally alters the internal state variables:
  var nesting = 0;
  var isAfterSubjectOrVariableOrEndOfGroup = false;

  var allStates = {};

  // Initialize all state objects...
  allStates[INITIAL] = {
    nextStates: [LINE_COMMENT, OPENED_BRACKET, WHITESPACE, SUBJECT, VARIABLE_DECLARATION, VARIABLE]
  };
  allStates[WHITESPACE] = {
    regexp: /^[\r\n\s]+/,
    notNestedStates: [SUBJECT, VARIABLE_DECLARATION, VARIABLE, OPENED_BRACKET, LINE_COMMENT],
    getNextStates: function () {
      var my = allStates[WHITESPACE];
      var states = (nesting > 0) ? my.nestedStates : my.notNestedStates;
      if (isAfterSubjectOrVariableOrEndOfGroup) {
        states = [LONG_OPTION].concat(states);
      }
      return states;
    }
  };
  allStates[WHITESPACE].nestedStates = allStates[WHITESPACE].notNestedStates.concat([CLOSED_BRACKET]);
  allStates[SUBJECT] = {
    regexp: thingRegex,
    notNestedStates: [SHORT_NUMBER_OPTION, SHORT_CHARACTER_OPTION, WHITESPACE],
    getNextStates: function () {
      var my = allStates[SUBJECT];
      isAfterSubjectOrVariableOrEndOfGroup = true;
      if (nesting > 0) {
        return my.nestedStates;
      }
      return my.notNestedStates;
    }
  };
  allStates[SUBJECT].nestedStates = allStates[SUBJECT].notNestedStates.concat([CLOSED_BRACKET]);
  allStates[VARIABLE_DECLARATION] = {
    regexp: new RegExp('^(' + PURE_VARIABLE_DECLARATION_PREFIX + "?)(" + VARIABLE_REGEX_STR + ")" + VARIABLE_DECLARATION_SUFFIX),
    getNextStates: function () {
      isAfterSubjectOrVariableOrEndOfGroup = false;
      return [WHITESPACE];
    }
  };
  allStates[VARIABLE] = {
    notNestedStates: [WHITESPACE],
    nestedStates: [WHITESPACE, CLOSED_BRACKET],
    regexp: new RegExp('^' + VARIABLE_REGEX_STR),
    getNextStates: function () {
      var my = allStates[VARIABLE];
      isAfterSubjectOrVariableOrEndOfGroup = true;
      return (nesting > 0) ? my.nestedStates : my.notNestedStates;
    }
  };
  allStates[SHORT_NUMBER_OPTION] = {
    regexp: new RegExp("(^" + SMALL_CHARACTER_REGEX_STR + ")(" + NUMBER_REGEX_STR + ")"),
    notNestedStates: [SHORT_NUMBER_OPTION, SHORT_CHARACTER_OPTION, WHITESPACE],
    getNextStates: function () {
      var my = allStates[SHORT_NUMBER_OPTION];
      return (nesting > 0) ? my.nestedStates : my.notNestedStates;
    }
  };
  allStates[SHORT_NUMBER_OPTION].nestedStates = allStates[SHORT_NUMBER_OPTION].notNestedStates.concat([CLOSED_BRACKET]);
  allStates[SHORT_CHARACTER_OPTION] = {
    regexp: new RegExp('^(' + BIG_CHARACTER_REGEX_STR + ')(' + VARIABLE_REGEX_STR + ')'),
    notNestedStates: [SHORT_CHARACTER_OPTION, WHITESPACE],
    getNextStates: function () {
      var my = allStates[SHORT_CHARACTER_OPTION];
      return (nesting > 0) ? my.nestedStates : my.notNestedStates;
    }
  };
  allStates[SHORT_CHARACTER_OPTION].nestedStates = allStates[SHORT_CHARACTER_OPTION].notNestedStates.concat([CLOSED_BRACKET]);
  allStates[LONG_OPTION] = {
    regexp: new RegExp('^(' + VARIABLE_REGEX_STR + ')([+-]?=)(' + VARIABLE_REGEX_STR + '|' + NUMBER_REGEX_STR + '|' + EXPRESSION_REGEX_STR + ')(!?)'),
    notNestedStates: [WHITESPACE],
    nestedStates: [WHITESPACE, CLOSED_BRACKET],
    getNextStates: function () {
      var my = allStates[LONG_OPTION];
      return (nesting > 0) ? my.nestedStates : my.notNestedStates;
    }
  };
  allStates[OPENED_BRACKET] = {
    regexp: /^\(/,
    nextStates: [WHITESPACE, OPENED_BRACKET, SUBJECT, VARIABLE_DECLARATION, VARIABLE],
    getNextStates: function () {
      var my = allStates[OPENED_BRACKET];
      ++nesting;
      isAfterSubjectOrVariableOrEndOfGroup = false;
      return my.nextStates;
    }
  };
  allStates[CLOSED_BRACKET] = {
    regexp: /^\)/,
    notNestedStates: [WHITESPACE, OPENED_BRACKET],
    nestedStates: [WHITESPACE, OPENED_BRACKET, CLOSED_BRACKET],
    getNextStates: function () {
      var my = allStates[CLOSED_BRACKET];
      --nesting;
      isAfterSubjectOrVariableOrEndOfGroup = true;
      return (nesting > 0) ? my.nestedStates : my.notNestedStates;
    }
  };
  allStates[LINE_COMMENT] = {
    regexp: new RegExp('^' + LINE_COMMENT_STR + '.*$', 'm'),
    notNestedStates: [WHITESPACE, OPENED_BRACKET, VARIABLE_DECLARATION, VARIABLE, LINE_COMMENT],
    getNextStates: function () {
      var my = allStates[LINE_COMMENT];
      isAfterSubjectOrVariableOrEndOfGroup = false;
      return (nesting > 0) ? my.nestedStates : my.notNestedStates;
    }
  };
  allStates[LINE_COMMENT].nestedStates = allStates[LINE_COMMENT].notNestedStates.concat([CLOSED_BRACKET]);

  var state;
  for (var stateIndex in allStates) {
    if (!allStates.hasOwnProperty(stateIndex)) {
      continue;
    }
    state = allStates[stateIndex];
    state.index = parseInt(stateIndex);
    if (typeof state.getNextStates !== "function") {
      // create static getNextStates function, if non was supplied
      state.getNextStates = (function () {
          var _states = state.nextStates.map(function(referencedStateIndex) {
            return allStates[referencedStateIndex];
          });
          return function() {
            return _states;
          }
      }());
    } else {
      // create a function which maps the dynamically returned indexes to state objects.
      state.getNextStates = (function() {
        var _originalFunction = state.getNextStates;
        return function() {
          return _originalFunction().map(function(referencedStateIndex) {
            return allStates[referencedStateIndex];
          });
        };
      }());
    }
  }

  allStates.getNesting = function() {
    return nesting;
  };

  return allStates;
}

/**
 * parserDelegate is an object which is expected to have the following methods:
 * - getRegexOfSubject() // optional. returns a regular expression for the subject to be parsed or nothing (then default is used)-
 * - onVariableDeclaration(variableName, isPure, indexInMultilineString)
 * - onVariable(variableName, indexInMultilineString)
 * - onGroupStart(indexInMultilineString)
 * - onGroupEnd(indexInMultilineString)
 * - onSubject(thingDefinition, indexInMultilineString)
 * - onOption(key, valueAsString, operator, isShort, isForced, indexInMultilineString) // operator is one of "=", "+=" and "-="
 * - onParserError(errorMessage, indexInMultilineString)
 *
 * If a callback function except onParserError and getRegexOfSubject returns false,
 * then the parsing is stopped.
 */
lib.lexMultilineString = function(multilineString, parserDelegate) {

  // XXX TODO do something with the commas
  multilineString = multilineString.replace(/,/g, ' ');

  var state;
  // apply default value to regexOfSubject if needed
  var regexOfSubject;
  if (typeof(parserDelegate.getRegexOfSubject) === 'function') {
     regexOfSubject = parserDelegate.getRegexOfSubject();
  } else {
    regexOfSubject = new RegExp("^" + NUMBER_REGEX_STR);
  }

  var statesMapping = createState(regexOfSubject);
  var state = statesMapping[INITIAL];
  var pos = 0;

  while (pos < multilineString.length) {
    var currentString = multilineString.substring(pos);
    var nextPossibleStates = state.getNextStates();
    var nextPossibleState;
    var nextState = false;
    for (var i = 0; i < nextPossibleStates.length; ++i) {
      nextPossibleState = nextPossibleStates[i];
      var match = currentString.match(nextPossibleState.regexp);
      if (match === null) {
        continue;
      }
      nextState = nextPossibleState;
      break;
    }
    if (!nextState) {
      parserDelegate.onError("Unexpected character: " + currentString[0], pos);
      return;
    }
    if (handleNewState(nextState, parserDelegate, match, pos) === false) {
      return;
    }
    pos += match[0].length;
    state = nextState;
  }

  // let the last possible indention change do its thing or other stuff
  if (state) {
    state.getNextStates();
  }

  if (statesMapping.getNesting() == 1) {
    parserDelegate.onError("There is one missing closing bracket." , pos);
    return;
  }
  if (statesMapping.getNesting() > 1) {
    parserDelegate.onError("There are " + statesMapping.getNesting() + " missing closing brackets." , pos);
    return;
  }
}

/**
* returns false on error
*/
function handleNewState(state, parserDelegate, match, pos) {
  switch (state.index) {
    case WHITESPACE:
      // fallthrough
    case LINE_COMMENT:
      return;
      break;
    case SUBJECT:
      return parserDelegate.onSubject(match, pos);
      break;
    case VARIABLE_DECLARATION:
      return parserDelegate.onVariableDeclaration(match[2], match[1].length > 0, pos);
      break;
    case VARIABLE:
      return parserDelegate.onVariable(match[0], pos);
      break;
    case SHORT_NUMBER_OPTION:
      // fallthrough
    case SHORT_CHARACTER_OPTION:
      return parserDelegate.onOption(match[1], match[2], "=", true, false, pos);
      break;
    case LONG_OPTION:
      return parserDelegate.onOption(match[1], match[3], match[2], false, match[4].length > 0, pos);
      break;
    case OPENED_BRACKET:
      return parserDelegate.onGroupStart(pos);
      break;
    case CLOSED_BRACKET:
      return parserDelegate.onGroupEnd(pos);
      break;
    default:
      // This cannot happen
      parserDelegate.onError("Error of dev - unexpected token state index: " + state.index, pos);
      return false;
      break;
  }
}

// // for testing of the new lexer parser:
// var indent = "";
// var out = "";
// var parserDelegate = {
//   onVariableDeclaration: function (variableName) {
//      out += (indent + " DECLARE_VAR (" + variableName + "): \n");
//   },
//   onVariable: function (variableName) {
//     out += (indent + " USE_VARIABLE (" + variableName + ") \n");
//   },
//   onGroupStart: function() {
//     out += (indent + "(\n");
//     indent += "   ";
//   },
//   onGroupEnd: function() {
//     if (indent.length === 0) {
//       console.error("onGroupEnd() error");
//     }
//     indent = indent.substring(0, indent.length - 3);
//     out += (indent + ")\n");
//   },
//   onSubject: function(thingDefinition) {
//     out += (indent + " SUBJECT (" + thingDefinition + ") \n");
//   },
//   onOption: function(key, valueAsString) {
//     out += (indent + "OPTION (" + key + "=" + valueAsString + ")\n");
//   },
//   onError: function(errorMessage, indexInMultilineString) {
//     console.error("Parser Error:", errorMessage, "index=" + indexInMultilineString);
//   }
// };
// require("./src/parser/async_lexer.js").lexMultilineString(chordDefs, parserDelegate);
