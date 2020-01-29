var lib = {};
module.exports = lib;

var voicingLib = require("./voicing.js");
var compositeLib = require("../parser/composite.js");
var compositeParser = require("../parser/composite_parser.js");

var REGEX_COUNT_SCALE = /\*/g;

/**
 * Returns false if there is no valid chord definition to be parsed.
 */
function createChordDefinition(asString, step, inversion, transposition, voicing, scale, rhythmPattern, arpeggioPattern) {
  var _step = step;
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
  // var rhythmPatternReferences = parseStringParameters("R", null, "rhythms");
  // if (rhythmPatternReferences.length == 1) {
  //   if (rhythmPatternReferences[0] !== null) {
  //     _rhythmPattern = resolveRhythmPattern(rhythmPatternReferences[0], rhythmPatterns, chordDef);
  //   }
  // } else if (rhythmPatternReferences.length > 1) {
  //   rhythmPatternReferences.forEach(function(patternReference) {
  //     var pattern = resolveRhythmPattern(patternReference, rhythmPatterns, chordDef);
  //     if (!pattern) {
  //       return;
  //     }
  //     if (!_rhythmPattern) {
  //       _rhythmPattern = pattern.clone();
  //       return;
  //     }
  //     _rhythmPattern.addPattern(pattern);
  //   });
  // }

  var _arpeggioPattern = arpeggioPattern;
  // var arpeggioPatternReferences = parseStringParameters("A", null, "arpeggios");
  // if (arpeggioPatternReferences.length == 1) {
  //   if (arpeggioPatternReferences[0] !== null) {
  //     _arpeggioPattern = resolveArpeggioPattern(arpeggioPatternReferences[0], arpeggioPatterns, chordDef);
  //   }
  // } else if (arpeggioPatternReferences.length > 1) {
  //   arpeggioPatternReferences.forEach(function(patternReference) {
  //     var pattern = resolveArpeggioPattern(patternReference, arpeggioPatterns, chordDef);
  //     if (!pattern) {
  //       return;
  //     }
  //     if (!_arpeggioPattern) {
  //       _arpeggioPattern = pattern.clone();
  //       return;
  //     }
  //     _arpeggioPattern.addPattern(pattern);
  //   });
  // }
  var _voicing = voicing;
  // var _voicing = parseStringParameters("V", defaultVoicing, "voicings")
  //   // map voicing references to actual voicings
  //   .map(function(voicingReference) {
  //     if (voicingLib.isVoicing(voicingReference)) {
  //       return voicingReference;
  //     }
  //     if (Array.isArray(voicingReference)) {
  //       return voicingReference;
  //     }
  //     if(voicings[voicingReference]) {
  //       return voicings[voicingReference];
  //     }
  //     console.warn("Unknown voicing reference \"" + voicingReference + "\" used in chord definition \"" + chordDef  + "\"");
  //     return defaultVoicing;
  //   })
  //   // if more than one voicing was used, they need to be merged
  //   // TODO does this already work as expected?
  //   .reduce(function(a, b) {
  //     var combinedVoicing = {};
  //     mergeVoices(combinedVoicing, a);
  //     mergeVoices(combinedVoicing, b);
  //     return combinedVoicing;
  //   });

  return {
    toString: function() {
      return _asString;
    },
    getStep: function() {
      return _step;
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

  /**
   * subjectBuilderFactory is a f
   * - createSubjectBuilder()
   * which is expected to return a new object with the methods:
   * - withMatch(match)
   * - withOption(key, value, operator) // called for all options, from least specific to most specific
   * - getResult() // returns the resulting subject
   */
  return function() {
    // references
    var _scales = scales;
    var _voicings = voicings;
    var _rhythmPatterns = rhythmPatterns;
    var _arpeggioPatterns = arpeggioPatterns;

    // chord definiton parameters
    var _asString = '';
    var _step;
    var _inversion = 0;
    var _transposition = 0;
    var _scale = {subject: _scales[0], cloned: false};
    var _voicing = {subject: _voicings.defaultVoicing, cloned: false};
    var _rhythmPattern = {subject: _rhythmPatterns.defaultRhythmPattern, cloned: false};
    var _arpeggioPattern = {subject: _arpeggioPatterns.defaultArpeggioPattern, cloned: false};

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
            _inversion = setInteger(_inversion, value, operator, _messages);
            break;
          case 't':
            _transposition = setInteger(_transposition, value, operator, _messages);
            break;
          case 's':
            var subject = resolveScale(value, _scales, _messages);
            _scale = setSubject(_scale, subject, operator, "scale", _messages);
            break;
          case 'V':
            var subject = resolveVariable(value, _voicings, "voicing", _messages);
            _voicing = setSubject(_voicing, subject, operator, "voicing", _messages);
            break;
          case 'R':
            var subject = resolveVariable(value, rhythmPatterns, "rhythm pattern", _messages);
            _rhythmPattern = setSubject(_rhythmPattern, subject, operator, "rhythm pattern", _messages);
            break;
          case 'A':
            var subject = resolveVariable(value, arpeggioPatterns, "arpeggio pattern", _messages);
            _arpeggioPattern = setSubject(_arpeggioPattern, subject, operator, "arpeggio pattern", _messages);
            break;
          default:
            _messages.addWarning("Unknown option: " + key);
            // do add nothing to _asString
            return;
        }

        _asString += (" " + key + operator + value);
      },
      getResult: function() {
        return createChordDefinition(_asString, _step, _inversion, _transposition, _voicing.subject, _scale.subject, _rhythmPattern.subject, _arpeggioPattern.subject);
      }
    }
  };
}

/**
 * Returns
 */
function setInteger(existingValue, newValueAsString, operator, messages) {
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
function setSubject(existingSubject, newSubject, operator, description, messages) {
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
