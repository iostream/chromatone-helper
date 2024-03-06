var lib = {};
module.exports = lib;

const tLib = require("../../theory/base.js");
const p = require("../../theory/progression.js");
const arpeggioLib = require("../../theory/arpeggio.js");
const instrumentLib = require("../instrument/proxy.js");
const audioInstrumentLib = require("../../audio/instrument.js");

const isAudioContextInitialized  = require("../../audio/audio_context_wrapper.js").isAudioContextInitialized;
const getAudioContext = require("../../audio/audio_context_wrapper.js").getAudioContext;

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

  var _audioInstrumentSelect = _optionsElement.getElementsByClassName('audio')[0];
  var _audioPresetSelect = _optionsElement.getElementsByClassName('audio-preset')[0];
  var _muteElement = _optionsElement.querySelector('input[name="mute"]');
  var _volumeElement = _optionsElement.querySelector('input[name="vol"]');

  var _progression;
  var _events;
  var _chordDefParserResult;

  var _currentAudioInstrumentName;

  // append the track index to the name of the track's form elements, for serialising etc.
  // do not change the parameter names of the first track, for backward compatibility!
  if (_index > 0) {
    [
      _optionsElement.getElementsByTagName("input"),
      _optionsElement.getElementsByTagName("select"),
      _optionsElement.getElementsByTagName("textarea"),
      _optionsElement.getElementsByTagName("label"),
    ].forEach(function(els) {
      for (var i=0; i < els.length; ++i) {
        if (els[i].tagName == 'LABEL') {
          els[i].setAttribute('for', ((els[i]).getAttribute('for')) + _index);
        } else {
          let name = els[i].name;
          els[i].name = name + _index;
          if (els[i].type === 'checkbox') {
            els[i].setAttribute("data-name", name);
          }
        }
      }
    });
  }

  // used for event delegation:
  _rootElement.dataset.index = _index;

  function collectInstrumentOptions() {
    var options = {type: _instrumentSelect.value, compact: _instrumentCompact.checked};
    for (var i = 0; i < _stringedOptionElements.length; ++i) {
      var el = _stringedOptionElements[i];
      options[el.getAttribute("data-name")] = el.checked;
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
    updateAudioInstrument: function() {
      if (_audioInstrumentSelect.selectedIndex === -1) {
        // make backward compatible: select first instrument when none is explicitly set
        _audioInstrumentSelect.selectedIndex = 0;
      }
      var implementation = _audioInstrumentSelect.options[_audioInstrumentSelect.selectedIndex].innerHTML;
      if (!_currentAudioInstrumentName || _currentAudioInstrumentName !== implementation) {
        if (_content.getAudioInstrument()) {
          audioInstrumentLib.releaseInstrument(_content.getAudioInstrument());
        }
        _content.setAudioInstrument(audioInstrumentLib.createInstrument(implementation));
        _currentAudioInstrumentName = implementation;

        // add preset names
        _audioPresetSelect.innerHTML = '';
        _content.getAudioInstrument().getPresetNames().forEach(function(name, index) {
          var option = document.createElement('option');
          option.appendChild(document.createTextNode(name));
          option.value = index;
          _audioPresetSelect.appendChild(option);
        });
      }
    },
    updateVisualization: function(progression, chordComposite) {
      var options = collectInstrumentOptions();
      _visualizationElement.innerHTML = '';
      var instrument = instrumentLib.createInstrument(options, _visualizationElement, _sequencer);
      instrument.addChordProgressionUsingChordDefinitionComposite(_progression, _chordDefParserResult.getComposite(), _events);
      _content.setInstrumentGUI(instrument);

      updateOptionsVisibility();
    },
    mute: function(on) {
      _content.mute(on);
    },
    setVolume: function(volume) {
      if (!_content || !_content.getAudioInstrument()) {
        return;
      }
      _content.getAudioInstrument().setVolume(volume);
    },
    initControlElements: function(controls) {
    },
    updateContent: function(scales, voicings, rhythmPatterns, arpeggioPatterns, parentChordDefs) {
      _chordDefParserResult = parseChordDefinitions(_chordDefElement.value, voicings, scales, rhythmPatterns, arpeggioPatterns);
      _progression = p.createChordProgression(_chordDefParserResult.getList());
      _events = arpeggioLib.arpeggiate(_progression, rhythmPatterns.defaultRhythmPattern, arpeggioPatterns.defaultArpeggioPattern);
      _content.setEvents(_events);
      if (_content && _content.getAudioInstrument()) {
        _content.getAudioInstrument().allNotesOff();
      }
      this.updateVisualization();
    },
    handleEvent: function(event) {
      // call getAudioContext() in order to prevent errors, when the audio context was not initialized yet
      getAudioContext();
      var target = event.target;
      if (target.name.indexOf('audio_preset') === 0) {
        this.updateAudioPreset();
        return true;
      }
      if (target.name.indexOf('audio') === 0) {
        this.updateAudioInstrument();
        this.updateAudioPreset();
        return true;
      }
      if (target.name.indexOf('instrument') === 0) {
        this.updateVisualization();
        return true;
      }
      if (target.type === 'checkbox') {
        target.value = (target.checked) ? '1' : '0';
        if (target.classList.contains("mute")) {
          this.mute(target.checked);
          return true;
        }
        this.updateVisualization();
        return true;
      }
      if (target.name.indexOf('vol') === 0) {
        this.setVolume(target.value);
        return true;
      }
      return false;
    },
    applyAudioSettings: function() {
      this.updateAudioInstrument();
      this.updateAudioPreset();
      this.mute(_muteElement.checked);
      this.setVolume(_volumeElement.value);
    }
  };

  function updateOptionsVisibility() {
    if (_instrumentSelect.selectedIndex == -1) {
      return;
    }
    var selectedInstrument = _instrumentSelect.options[_instrumentSelect.selectedIndex];
    if (selectedInstrument.classList.contains("stringed")) {
      _stringedOptionsGroup.classList.remove("hidden");
    } else {
      _stringedOptionsGroup.classList.add("hidden");
    }

    if (selectedInstrument.classList.contains("world")) {
      _instrumentCompact.parentElement.classList.add("hidden");
    } else {
      _instrumentCompact.parentElement.classList.remove("hidden");
    }
  }

  // add audio instrument options
  audioInstrumentLib.getInstrumentNames().forEach((instrumentName, index) => {
    var option = document.createElement('option');
    option.appendChild(document.createTextNode(instrumentName));
    option.value = index;
    _audioInstrumentSelect.appendChild(option);
  });

  track.updateAudioInstrument();  

  if (isAudioContextInitialized()) {
    track.applyAudioSettings();
  }

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
