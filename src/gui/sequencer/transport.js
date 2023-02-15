var lib = {};
module.exports = lib;

lib.createTransport = function(sequencer) {
  var _sequencer = sequencer;
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
            _sequencer.start();
          }
          updatePlayState();
        }
      });
      controls.play.addEventListener("click", function() {
        _sequencer.start();
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
      });
      controls.bpm.addEventListener("input", function() {
        _sequencer.setBpm(controls.bpm.value);
      });
      controls.bpm.dispatchEvent(new Event('input'));
      _sequencer.addStopCallback(function() {
        updatePlayState();
      });
    }
  };
};
