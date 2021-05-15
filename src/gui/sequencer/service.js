var lib = {};
module.exports = lib;

var trackLib = require('./track.js');
var transportLib = require('./transport.js');

var templates = document.getElementById('templates');
var trackTemplate = templates.getElementsByClassName('track')[0];

lib.createService = function(sequencer, parentElement) {
  var _sequencer = sequencer;
  var _tracks = [];
  var _transport = transportLib.createTransport(sequencer);
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
      });
    },
    /* the UI root element of the sequencer */
    getElement: function() {
      return _rootElement;
    }
  };
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
      if (event.target.name.indexOf('audio_preset') === 0) {
        getTrack(event).updateAudioPreset();
      }

      if (event.target.name.indexOf('chords') === 0) {
        service.updateTracks();
      }

      if (event.target.name.indexOf('instrument') === 0) {
        getTrack(event).updateVisualization();
      }
        
      if (event.target.type === 'checkbox') {
        event.target.value = (event.target.checked) ? '1' : '0';
        if (event.target.classList.contains("mute")) {
          getTrack(event).mute(event.target.checked);
        }
        getTrack(event).updateVisualization();
      }

      controls.updateURL();
    });

    // assure we have at least on track at all times
    // if (sequencer.getTracks().length == 0) {
    //   sequencer.createTrack();
    // }
    // XXX control elements of tracks are initiated lazy?!
  };

  service.updateByParameters = function(parameters) {
    // there is no chord[0] and the is always at least one track
    // add as many scale GUIs as needed
    while (parameters.has("chords" + _tracks.length)) {
      service.addNewTrack();
    }

    // TODO also delete tracks if needed

    _tracks.forEach(function(track) {
      track.initAudioControls();
    });
  }

  return service;
}
