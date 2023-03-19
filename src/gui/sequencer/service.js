var lib = {};
module.exports = lib;

const trackLib = require('./track.js');
const transportLib = require('./transport.js');

const templates = document.getElementById('templates');
const trackTemplate = templates.getElementsByClassName('track')[0];

const isAudioContextInitialized  = require("../../audio/audio_context_wrapper.js").isAudioContextInitialized;
const getAudioContext = require("../../audio/audio_context_wrapper.js").getAudioContext;

lib.createService = function(sequencer, parentElement) {
  var _sequencer = sequencer;
  var _tracks = [];
  var _rootElement = parentElement.getElementsByClassName("sequencer")[0];
  var _tracksElement = _rootElement.getElementsByClassName('tracks')[0];
  var _adminElement = _rootElement.getElementsByClassName('administration')[0];
  var _controls;

  var _scales;
  var _voicings;
  var _rhythmPatterns;
  var _arpeggioPatterns;

  function getTrack(event) {
    var element = event.target;
    while (!element.classList.contains("track")) {
      element = element.parentElement;
    }
    var trackIndex = element.dataset.index;
    return _tracks[trackIndex];
  }

  var service = {
    start: function() {
      if (_sequencer.isEmpty()) {
        return;
      }
      // create audio context, when the user starts the sequencer the first time
      if (!isAudioContextInitialized()) {
        getAudioContext();
        for (var track of _tracks) {
          track.applyAudioSettings();
        }
      }
      _sequencer.start();
    },
    addNewTrack: function(options) {
      var trackEl = _tracksElement.appendChild(trackTemplate.cloneNode(true));
      var sequencerTrack = _sequencer.createTrack();
      var track = trackLib.createTrack(
        {
          index: _tracks.length,
          element: trackEl,
          content: sequencerTrack,
          sequencer: _sequencer
        }
      );
      setTimeout(function() {
        track.initControlElements(_controls);
      });
      _tracks.push(track);
      return track;
    },
    popTrack: function() {
      var track = _tracks.pop();
      _sequencer.popTrack();
      _tracksElement.removeChild(track.getElement());
      _controls.updateURL();
      return track;
    },
    updateTracks: function(scales, voicings, rhythmPatterns, arpeggioPatterns) {
      if (Array.isArray(scales)) {
        _scales = scales;
        _voicings = voicings;
        _rhythmPatterns = rhythmPatterns;
        _arpeggioPatterns = arpeggioPatterns;
      }
      var chordDefs;
      _tracks.forEach(function(track) {
        chordDefs = track.updateContent(_scales, _voicings, _rhythmPatterns, _arpeggioPatterns, chordDefs);
        if (isAudioContextInitialized()) {
          track.applyAudioSettings();
        }
      });
      _sequencer.resetGUIUpdates();
      _transport.applyAudioSettings();
    },
    /* the UI root element of the sequencer */
    getElement: function() {
      return _rootElement;
    }
  };

  var _transport = transportLib.createTransport(sequencer, service) ;

  service.initControlElements = function(controls) {
    _controls = controls;
    _transport.initControlElements(controls);

    _adminElement.getElementsByClassName('add_track')[0].addEventListener('click', function(event) {
      service.addNewTrack();
    });

    _adminElement.getElementsByClassName('remove_track')[0].addEventListener('click', function(event) {
      service.popTrack();
    });

    _tracksElement.addEventListener("change", function(event) {
      var target = event.target;

      if (target.name.indexOf('chords') === 0) {
        service.updateTracks();
        controls.updateURL();
      } else if (getTrack(event).handleEvent(event)) {
        controls.updateURL();
      }
    });

    _tracksElement.addEventListener("input", function(event) {
      getTrack(event).handleEvent(event);
    });
    // assure we have at least on track at all times
    // if (sequencer.getTracks().length == 0) {
    //   sequencer.createTrack();
    // }
    // XXX control elements of tracks are initiated lazy?!
  };

  service.updateByParameters = function(parameters) {
    // there is no chord[0] and there is always at least one track
    // add as many scale GUIs as needed
    while (parameters.has("chords" + _tracks.length)) {
      service.addNewTrack();
    }

    // TODO also delete tracks if needed
  }

  return service;
}
