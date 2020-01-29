var lib = {};
module.exports = lib;

var lexerLib = require('./async_lexer.js');
var messageLib = require('./message.js');
/**
 * compositeParserDelegate is an object which is expected to have these methods:
 - - getRegexOfSubject() // optional. returns the regular expression for subjects to be parsed
 * - createSubjectComposite(name) // returns a new empty composite object; the optional parameter name is used to create composites of that variable name
 * - createSubject(match, name) // creates a new subject by parsing match array (which was successfully matched against
 *                                      the regular expression returned by getSubjectRegex()). On error it returns the error message as string.
 *
 * Subject and a composite objects are expected to have this method:
 * - addOption(key, valueAsString, operator, isShort, isForced) // adds an option, operator can be one of the strings: "+", "+=", "-=" returns a string error message on errors.
 *
 * A subject composite object is expected to have these methods:
 * - addChild(subjectOrComposite) // add a subject or another composite
 * - getChildren() // returns an array of all children of the composite or false
 *
 * returns an object with these methods:
 * - getMessageContainer() // can contain errors from the lexer or from the passed
 *                   delegate or from the subject and composite methods.
 *      each error message is an object with the methods: getMessage() and getIndex()
 * - getComposite() // the resulting composite object
 */
lib.parseComposite = function (multiLineString, compositeParserDelegate, subjectVariables) {
  var lexerDelegate = createLexerDelegate(compositeParserDelegate, subjectVariables);
  lexerLib.lexMultilineString(multiLineString, lexerDelegate);
  lexerDelegate.onEnd(multiLineString.length - 1);
  return lexerDelegate.getResult();
}

function createLexerDelegate(compositeParserDelegate, subjectVariables) {
  var _delegate = compositeParserDelegate;
  var _stack = [_delegate.createSubjectComposite("default")]; // of composites and variables
  var _lastSubjectOrComposite = _stack[0];
  var _variables = subjectVariables;
  var _messages = messageLib.createMessageContainer();

  function addError(message, index) {
    _messages.addError(message, index);
  }

  function declareVariable(name, isPure) {
    var __composite = _delegate.createSubjectComposite(name);
    var __name = name;
    var __isPureDeclaration = isPure;

    var variable = {
      addChild: function(child) {
        __composite.addChild(child);
      },
      applyValue: function(parentComposite, index) {
        var children = __composite.getChildren();
        if (children === false || children.length === 0) {
          addError("No value to apply for variable " + __name, index);
          console.warn("No value to apply for variable");
          return;
        }
        var value = __composite;
        if (children.length === 1) {
          value = children[0];
        }
        // add value to the variables
        _variables[__name] = value;
        // and add value to its parent
        if (!__isPureDeclaration) {
          parentComposite.addChild(value);
        }
      }
    };

    _stack.push(variable);
  }

  function isVariable(object) {
    return typeof object.addOption === 'undefined';
  }

  function resolveVariable(name, index) {
    var value = _variables[name];
    if (typeof(value) === "undefined") {
      addError("Undeclared variable used: " + name, index);
      return false;
    }
    // always wrap the value in an own composite, so it can have its own options
    var composite = _delegate.createSubjectComposite();
    composite.addChild(value);
    return composite;
  }

  var resultDelegate = {
    onVariableDeclaration: function(variableName, isPure, index) {
      // a variable declaration ends the variable declaration directly before it
      if (isVariable(_stack[_stack.length - 1])) {
        _stack.pop().applyValue(_stack[_stack.length - 1], index);
      }
      declareVariable(variableName, isPure);
      _lastSubjectOrComposite = false;
    },
    onVariable: function (variableName, index) {
      var subjectOrComposite = resolveVariable(variableName, index);
      if (subjectOrComposite !== false) {
        _stack[_stack.length - 1].addChild(subjectOrComposite);
        _lastSubjectOrComposite = subjectOrComposite;
      }
    },
    onGroupStart: function() {
      var composite = _delegate.createSubjectComposite();
      _stack.push(composite);
      _lastSubjectOrComposite = false;
    },
    onGroupEnd: function(index) {
      // an ending group ends a variable declaration
      if (isVariable(_stack[_stack.length - 1])) {
        _stack.pop().applyValue(_stack[_stack.length - 1], index);
      }
      _lastSubjectOrComposite = _stack.pop();
      // add composite to its parent
      _stack[_stack.length - 1].addChild(_lastSubjectOrComposite);
    },
    onSubject: function(thingDefinition, indexInMultilineString) {
      var subject = _delegate.createSubject(thingDefinition);
      if (typeof subject === "string") {
        addError(subject, indexInMultilineString);
        return false; // fatal error
      }
      _stack[_stack.length - 1].addChild(subject);
      _lastSubjectOrComposite = subject;
    },
    onOption: function(key, valueAsString, operator, isShort, isForced, indexInMultilineString) {
      var error = _lastSubjectOrComposite.addOption(key, valueAsString, operator, isShort, isForced);
      if (typeof error === "string") {
        addError(error, indexInMultilineString); // fatal error
        return false;
      }
    },
    onError: function(errorMessage, index) {
      addError(errorMessage, index);
    },
    getResult: function() {
      return {
        getMessageContainer: function() { return _messages; },
        getComposite: function() { return _stack[0]; }
      };
    },
    onEnd: function(index) {
      if (isVariable(_stack[_stack.length - 1])) {
        // apply left over variable
        _stack.pop().applyValue(_stack[_stack.length - 1], index);
      }
    }
  };

  // pass through the regular expression of the subjects
  if (typeof(compositeParserDelegate.getRegexOfSubject === 'function')) {
    resultDelegate.getRegexOfSubject = compositeParserDelegate.getRegexOfSubject;
  }
  return resultDelegate;
}
