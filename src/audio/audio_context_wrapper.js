module.exports = new (function AudioContextWrapper() {
  /**
  * Shared audio context
  */
  var audioContext;
  var consumers = [];
  
  /**
   * Add a consumer of the shared AudioContext. It will be called as soon as the audio context becomes available. 
   * This has to be used when the audio context is not initialized yet and it cannot be used right away, because
   * the creation of an audio context always requires user interaction (= the first input event).
   * 
   * @param {function(AudioContext)} consumer
   */
  this.addAudioContextConsumer = function(consumer) {
    if (this.isAudioContextInitialized()) {
      consumer(audioContext);
    } else {
      consumers.push(consumer);
    }
  }

  /**
   * First call initializes the shared audio context.
   */
  this.getAudioContext = function() {
    if (!audioContext) {
      audioContext = new AudioContext({latencyHint: 'playback'});
      consumers.forEach(consumer => consumer(audioContext));
      consumers = [];
    }
    return audioContext;
  }

  this.isAudioContextInitialized = function() {
    return !!audioContext;
  }
})();
