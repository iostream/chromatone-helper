var lib = {};
module.exports = lib;

lib.createTransport = function(sequencer, sequencerGUI) {
  var _sequencer = sequencer;
  var _sequencerGUI = sequencerGUI;
  var _controls;

  function updatePlayState() {
    if (_sequencer.isPlaying()) {
      _controls.play.classList.add('active');
    } else {
      _controls.play.classList.remove('active');
    }
    if (_sequencer.isPaused()) {
      _controls.pause.classList.add('active');
    } else {
      _controls.pause.classList.remove('active');
    }
  }

  return {
    initControlElements: function(controls) {
      _controls = controls;
      window.addEventListener("keydown", function(event) {
        // ignore key presses in input fields
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
          return;
        }
        if (event.key === ' ') {
          // ctrl + space ... toggle play/pause
          // space ... toggle play/stop
          if (_sequencer.isPlaying()) {
            if (event.ctrlKey) {
              _sequencer.pause();
            } else {
              _sequencer.stop();
            }
          } else {
            _sequencerGUI.start();
          }
          updatePlayState();
          event.preventDefault();
        }
      });
      controls.play.addEventListener("click", function() {
        _sequencerGUI.start();
        updatePlayState();
      });
      controls.pause.addEventListener("click", function() {
        _sequencer.pause();
        updatePlayState();
      });
      controls.stop.addEventListener("click", function() {
        _sequencer.stop();
        updatePlayState();
      });
      controls.step_forward.addEventListener("click", function() {
        _sequencer.stepForward();
      });
      controls.step_backward.addEventListener("click", function() {
        _sequencer.stepBackward();
      });
      controls.loop.addEventListener("click", function() {
        _sequencer.setLoop(controls.loop.checked);
        _controls.updateURL();
      });
      controls.bpm.addEventListener("input", function() {
        _sequencer.setBpm(controls.bpm.value);
        _controls.updateURL();
      });
      _sequencer.addStopCallback(function() {
        updatePlayState();
      });
    },
    applyAudioSettings: function() {
      _sequencer.setLoop(_controls.loop.checked);
      _sequencer.setBpm(_controls.bpm.value);
      _controls.bpm_out.value = _controls.bpm.value;
    }
  };
};
