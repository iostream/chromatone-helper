var lib = {};
module.exports = lib;

lib.createTransport = function(sequencer) {
  var _sequencer = sequencer;

  return {
    initControlElements: function(controls) {
      controls.play.addEventListener("click", function() {
        _sequencer.start();
      });
      controls.pause.addEventListener("click", function() {
        _sequencer.pause();
      });
      controls.stop.addEventListener("click", function() {
        _sequencer.stop();
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
    }
  };
};
