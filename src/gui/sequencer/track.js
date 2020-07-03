var lib = {};
module.exports = lib;

var tLib = require("../../theory/base.js");
var p = require("../../theory/progression.js");
var arpeggioLib = require("../../theory/arpeggio.js");
var presetLib = require("../presets.js");
var chordPresets = require("../../../resources/presets.js").chords;
var instrumentLib = require("../instrument/proxy.js");

lib.createTrack = function(options) {
  var _index = options.index || 0;
  var _content = options.content;
  var _sequencer = options.sequencer;
  var _rootElement = options.element;

  var _optionsElement = _rootElement.getElementsByClassName("options")[0];

  var _chordDefElement = _rootElement.getElementsByClassName("progression")[0];
  var _messagesElement = _rootElement.getElementsByClassName("messages")[0];

  var _visualizationElement = _rootElement.getElementsByClassName("visualization")[0];

  var _instrumentSelect = _optionsElement.getElementsByClassName('instrument')[0];
  var _instrumentCompact = _optionsElement.getElementsByClassName('compact')[0];
  var _stringedOptionsGroup = _optionsElement.getElementsByClassName("stringed-options")[0];
  var _stringedOptionElements = _stringedOptionsGroup.getElementsByTagName("input");

  var _audioPresetSelect = _optionsElement.getElementsByClassName('audio-preset')[0];

  var _progression;
  var _chordDefParserResult;

  // do not change the parameter names of the first track, for backward compatibility!
  if (_index > 0) {
    [
      _optionsElement.getElementsByTagName("input"),
      _optionsElement.getElementsByTagName("select"),
      _optionsElement.getElementsByTagName("textarea")
    ].forEach(function(els) {
      for (var i=0; i < els.length; ++i) {
        els[i].name = ((els[i]).name) + _index;
      }
    });
  }

  initAudioControls();

  // used for event delegation:
  _rootElement.dataset.index = _index;

  function initAudioControls() {
    // remove previously added preset names
    var options = _audioPresetSelect.getElementsByTagName('option');
    while (options.length > 0) {
      _audioPresetSelect.removeChild(options[0]);
    }
    if (!_content || !_content.getAudioInstrument()) {
      return;
    }
    // add all current preset names
    _content.getAudioInstrument().getPresetNames().forEach(function(name, index) {
      option = document.createElement('option');
      option.appendChild(document.createTextNode(name));
      option.value = index;
      _audioPresetSelect.appendChild(option);
    });
  }

  function collectInstrumentOptions() {
    var options = {type: _instrumentSelect.value, compact: _instrumentCompact.checked};
    for (var i = 0; i < _stringedOptionElements.length; ++i) {
      var el = _stringedOptionElements[i];
      options[el.name] = el.checked;
    }
    return options;
  }

  function parseChordDefinitions(chordDefs, voicings, scales, rhythmPatterns, arpeggioPatterns) {
    var chordDefParserResult = tLib.parseChordDefinitions(chordDefs, voicings, scales, rhythmPatterns, arpeggioPatterns);
    _messagesElement.innerHTML = '';
    chordDefParserResult.getMessageContainer().getErrors().forEach(function(msg) {
      addMessage(_messagesElement, 'error', msg);
    });
    chordDefParserResult.getMessageContainer().getWarnings().forEach(function(msg) {
      addMessage(_messagesElement, 'warning', msg);
    });
    // addMessage(messagesElement, 'information', chordDefParserResult.getComposite().asString());
    return chordDefParserResult;
  }


  var track = {
    getElement: function() {
      return _rootElement;
    },
    updateOptionsGUI() {

    },
    updateAudioPreset: function() {
      if (!_content || !_content.getAudioInstrument()) {
        return;
      }
      if (_audioPresetSelect.selectedIndex > -1) {
        _content.getAudioInstrument().setPreset(_audioPresetSelect.options[_audioPresetSelect.selectedIndex].value);
      }
    },
    updateVisualization: function(progression, chordComposite) {
      var options = collectInstrumentOptions();
      _visualizationElement.innerHTML = '';
      var instrument = instrumentLib.createInstrument(options, _visualizationElement, _sequencer);
      instrument.addChordProgressionUsingChordDefinitionComposite(_progression, _chordDefParserResult.getComposite());
      _content.setInstrumentGUI(instrument);

      // show/hide the string instrument options before validation
      if (_instrumentSelect.selectedIndex > -1 && _instrumentSelect.options[_instrumentSelect.selectedIndex].classList.contains("stringed")) {
        _stringedOptionsGroup.classList.remove("hidden");
      } else {
        _stringedOptionsGroup.classList.add("hidden");
      }
    }
  };

  track.initControlElements = function(controls) {
    track.updateAudioPreset();
    // TODO: presetLib.initPresets(chordPresets, controls.chords_preset, [controls.chords]);
    // if (_index == 0) {
    //   _chordDefElement = controls.form['chords'];
    // } else {
    //   _chordDefElement = controls.form['chords[' + index + ']'];
    // }
  };

  track.updateContent = function(scales, voicings, rhythmPatterns, arpeggioPatterns, parentChordDefs) {
    _chordDefParserResult = parseChordDefinitions(_chordDefElement.value, voicings, scales, rhythmPatterns, arpeggioPatterns);
    _progression = p.createChordProgression(_chordDefParserResult.getList());
    var events = arpeggioLib.arpeggiate(_progression, rhythmPatterns.defaultRhythmPattern, arpeggioPatterns.defaultArpeggioPattern);
    _content.setEvents(events);
    track.updateVisualization();
  };

  track.initAudioControls = initAudioControls;
  return track;
};

function addMessage(parentElement, type, message) {
  var textMsg = message;
  if (message.getMessage) {
    textMsg = message.getMessage();
  }
  var el = document.createElement('div');
  el.className = type;
  var text = document.createTextNode(textMsg);
  el.appendChild(text);
  parentElement.appendChild(el);
}
