var lib = {};
module.exports = lib;

var voicingLib = require("./voicing.js");
var compositeLib = require("../parser/composite.js");
var compositeParser = require("../parser/composite_parser.js");

var REGEX_COUNT_SCALE = /\*/g;

/**
 * TODO make this a clean method again (which needs some f)
*
 * Returns false if there is no valid chord definition to be parsed.
 */
function createChordDefinition(asString, step, inversion, transposition, inversionOptimization, direction, voicing, scale, rhythmPattern, arpeggioPattern) {
  var _step = step;
  var _inversionOptimization = inversionOptimization;
  var _direction = direction;
  var _asString = asString;

  // make step 0 based
  --_step;

  var _inversion = inversion;
  var _transposition = transposition;
  var _scale = scale;

  function mergeVoices(combinedVoicing, voicing) {
    var voice;
    for (var i in voicing) {
      if (!voicing.hasOwnProperty(i)) {
        continue;
      }
      voice = voicing[i];
      combinedVoicing[voice] = voice;
    }
  }

  var _rhythmPattern = rhythmPattern;
  var _arpeggioPattern = arpeggioPattern;
  var _voicing = voicing;

  return {
    toString: function() {
      return _asString;
    },
    getStep: function() {
      return _step;
    },
    getInversionOptimization: function() {
      return _inversionOptimization;
    },
    getDirection: function() {
      return _direction;
    },
    getInversion: function() {
      return _inversion;
    },
    setInversion: function(inversion) {
      _inversion = inversion;
    },
    getTransposition: function() {
      return _transposition;
    },
    getVoicing: function() {
      return _voicing;
    },
    setVoicing: function(voicing) {
      _voicing = voicing;
    },
    getScale: function() {
      return _scale;
    },
    getRhythmPattern: function() {
      return _rhythmPattern;
    },
    getArpeggioPattern: function() {
      return _arpeggioPattern;
    },
    createChord: function() {
      return _scale.createChord(this);
    }
  };
}


var STEP_REGEX_STR = '\\d+';
var SCALE_REGEX_STR = '\\**';
function createParserDelegate() {
  var parserDelegate = compositeLib.createCompositeParserDelegate();
  parserDelegate.getRegexOfSubject = function() {
    return new RegExp('^(' + STEP_REGEX_STR + ')(' + SCALE_REGEX_STR + ')');
  };
  return parserDelegate;
}

/**
 * Returns an object with the properties:
 * - errors
 * - composite // a composite representing the parsed structure
 * - list // an array of all created chord definitions which were created out of the parsed structure
 */
lib.parseChordDefinitions = function(multilineString, voicings, scales, rhythmPatterns, arpeggioPatterns) {
  var variables = {};
  var parserResult = compositeParser.parseComposite(multilineString, createParserDelegate(), variables);

  var chordDefinitionBuilderFactory = createChordDefinitionBuilderFactory(scales, voicings, rhythmPatterns, arpeggioPatterns, parserResult.getMessageContainer());
  // XXX How to add builder errors ?
  var list = parserResult.getComposite().createFlatSubjectList(chordDefinitionBuilderFactory);

  return {
    getMessageContainer: function() { return parserResult.getMessageContainer(); },
    getComposite: function() { return parserResult.getComposite(); },
    getList: function() { return list; }
  };
}

function resolveVariable(variableName, map, type, messages) {
  if (typeof(map[variableName]) === 'undefined') {
    messages.addWarning("Ignoring unknown " + type + " reference: " + variableName);
    return false;
  }
  return map[variableName];
}

function resolveScale(scaleIndex, scales, messages) {
  if (scaleIndex >= scales.length) {
    messages.addWarning('Ignoring reference to scale ' + '*'.repeat(scaleIndex) + ', because there are only ' + scales.length + ' scales available.');
    return false;
  }
  return scales[scaleIndex];
}

function createChordDefinitionBuilderFactory(scales, voicings, rhythmPatterns, arpeggioPatterns, messages) {
  var _messages = messages;
  var _scales = scales;
  var _voicings = voicings;
  var _rhythmPatterns = rhythmPatterns;
  var _arpeggioPatterns = arpeggioPatterns;

  /**
   * subjectBuilderFactory is a f
   * - createSubjectBuilder()
   * which is expected to return a new object with the methods:
   * - withMatch(match)
   * - withOption(key, value, operator) // called for all options, from least specific to most specific
   * - getResult() // returns the resulting subject
   */
  return function() {

    // chord definiton parameters
    var _asString = '';
    var _step;
    var _inversion = -1;
    var _transposition = 0;
    var _scale = {subject: _scales[0], cloned: false};
    var _voicing = {subject: _voicings.defaultVoicing, cloned: false};
    var _rhythmPattern = {subject: _rhythmPatterns.defaultRhythmPattern, cloned: false};
    var _arpeggioPattern = {subject: _arpeggioPatterns.defaultArpeggioPattern, cloned: false};
    var _inversionOptimization = 0;
    var _direction = 's';

    return {
      withMatch: function(match) {
        _step = parseInt(match[1]);
        _scale = {subject: resolveScale(match[2].length, scales, _messages), cloned: false};
        _asString = match[0];
      },
      withOption: function(key, value, operator) {
        var subject;
        switch (key) {
          case 'i':
            _inversion = alterInteger(_inversion, value, operator, _messages);
            break;
          case 't':
            _transposition = alterInteger(_transposition, value, operator, _messages);
            break;
          case 'o': // inversion optimization algorithm, 0=off, 1=type 1, 2=type 2, etc.
            _inversionOptimization = value;
          case 'd':
            // inversion direction, (only effective, when inversion optimzation is turned on)
            // u=up, d=down, s=same (= try to optimize for best voice leading)
            _direction = value;
            break;
          case 's':
            var subject = resolveScale(value, _scales, _messages);
            _scale = alterSubject(_scale, subject, operator, "scale", _messages);
            break;
          case 'V':
            var subject = resolveVariable(value, _voicings, "voicing", _messages);
            _voicing = alterSubject(_voicing, subject, operator, "voicing", _messages);
            break;
          case 'R':
            var subject = resolveVariable(value, rhythmPatterns, "rhythm pattern", _messages);
            _rhythmPattern = alterSubject(_rhythmPattern, subject, operator, "rhythm pattern", _messages);
            break;
          case 'A':
            var subject = resolveVariable(value, _arpeggioPatterns, "arpeggio pattern", _messages);
            _arpeggioPattern = alterSubject(_arpeggioPattern, subject, operator, "arpeggio pattern", _messages);
            break;
          default:
            _messages.addWarning("Unknown option: " + key);
            // do add nothing to _asString
            return;
        }

        _asString += (" " + key + operator + value);
      },
      getResult: function() {
        return createChordDefinition(_asString, _step, _inversion, _transposition, _inversionOptimization, _direction, _voicing.subject, _scale.subject, _rhythmPattern.subject, _arpeggioPattern.subject);
      }
    }
  };
}

/**
 * Returns
 */
function alterInteger(existingValue, newValueAsString, operator, messages) {
  var newValue = parseInt(newValueAsString);
  if (isNaN(newValue)) {
    messages.addWarning("Ignoring non integer value: " + newValue);
    return existingValue;
  }
  switch (operator) {
    case '=':
      return newValue;
    case '+=':
      return existingValue + newValue;
    case '-=':
      return existingValue - newValue;
    default:
      messages.addWarning("Ignoring unknown operator: " + operator);
      return existingValue;
  }
}

/**
 * once set,
 */
function alterSubject(existingSubject, newSubject, operator, description, messages) {
  if (operator === '=') {
    return {subject: newSubject, cloned: false};
  }

  // all next operators change the subject, so clone the subject if needed in order
  // to not to change other chord definition's subjects
  if (existingSubject.subject !== false && !existingSubject.cloned) {
    existingSubject.subject = existingSubject.subject.clone();
    existingSubject.cloned = true;
  }

  if (operator === '-=') {
    if (existingSubject.subject === false) {
      return existingSubject;
    }
    existingSubject.subject.removePattern(newSubject);
    return existingSubject;
  }

  if (operator === '+=') {
    if (existingSubject.subject === false) {
      return existingSubject;
    }
    existingSubject.subject.addPattern(newSubject);
    return existingSubject;
  }

  messages.addWarning("Ignoring unknown " + description + " operator: " + operator);
  return existingSubject;
}
