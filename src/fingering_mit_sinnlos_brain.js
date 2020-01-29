var ChromatoneLibFingering = {};
(function(lib, tLib) {
  /** unconverted training data */
  var _data = {
    //"basic" : [ // testi testi....
    //  "1 3+"
    //],
    "1 b3 b5 6": [
      ["1 b3 b5+ 6"]
    ],
    "1 3 5 6": [
      ["r1 3+ 5 6"],
      ["1 b3 4 rb6"],
      ["1 2+ r4 6"],
      ["1 rb3 5 b7"]
    ],
    "1 3 5 7": [
      ["r1", "3+", "5" , "7"],
      [1   , "b3", "5" , "rb6"],
      [1   , "3+", "r4" , "6" ],
      [1   , "rb2" , "4" , "b6" ]
    ],
    "1 3 5 b7": [
      ["r1",   "3+", "5"  , "b7"],
      [  1 ,  "b3" , "b5+", "rb6"],
      [  1 ,  "b3" , "r4" , "6" ],
      [  1 ,  "r2+" , "b5+" ,"6" ]
    ],
    "1 b3 5 b6": [
      ["r1", "b3", "5" , "b6"],
      [1   , "3+", "4" , "r6"],
      [1   , "b2", "r4", "b6" ],
      [1   , "r3+" , "5", "7" ]
    ],
    "1 b3 5 6": [
      ["r1", "b3", "5" ,  "6"],
      [1   , "3+", "b5+", "r6"],
      [1   , "2+" , "r4" , "b6" ],
      [1   , "rb3","b5+" , "b7" ]
    ]
  };

  var _netConfig = {
      binaryThresh: 0.5,     // ¯\_(ツ)_/¯
      hiddenLayers: [4,4],     // array of ints for the sizes of the hidden layers in the network
      activation: 'sigmoid'  // supported activation types: ['sigmoid', 'relu', 'leaky-relu', 'tanh']
  };

  var _trainConfig = {
     errorThresh: 0.0005,
     iterations: 20000 * 2,
  };

  var _net;

  function convertNote(note) {
    return note.getChromaticInterval() / 12;
  }

  /**
   * input
   * -----
   *
   * n0: convert(note[0])
   * n1: convert(note[1])
   * ...
   *
   * output
   * ------
   * i0: 0|1 (which iteration to use on the chromatic keyboard, basically isUp()...)
   * i1:  "
   * ...
   *
   */
  function convertTrainingData(data) {
    var res = [];

    for (property in data) {
      if (!data.hasOwnProperty(property)) {continue;}
      var group = data[property];
      group.forEach(function(notes) {
        // initialize this input/output pair
        var i = 0;
        var io = {input:{}, output:{}};
        res.push(io);
        notes = tLib.parseNotes(notes);
        notes.forEach(function(note) {
          io.input[i] = convertNote(note);
          io.output[i] = note.isUp() ? 1 : 0;
          ++i;
        });
        if (typeof io.output[0] !== "undefined") {
          delete io.output[0];
        }
      });
    }

    return res;
  }

  /** notes .. array of notes */
  /*function updateFingering(notes) {
    var notesArray = tLib.parseNotes(notes);
    var net = getNet();
    var input = {};

    for (var i=0; i<notesArray.length; ++i) {
      input[i] = convertNote(notesArray[i]);
    }

    if (notesArray.length > 0) {
      notesArray[0].setUp(false);
    }

    var output = net.run(input);

    // var likely = require('brain/likely');
    // var output = likely(input, net);

    for (var i=1; i<notesArray.length; ++i) {
      if (typeof output[i] === "undefined") {
        console.error("updateFingering() - net did not return enough output.");
        continue;
      }
      notesArray[i].setUp(Math.round(output[i]) == 1);
    }

    console.log("ChromatoneLibFingering.updateFingerings() ", notes, input, output);
  }*/
  function updateFingering(notes) {
    var notesArray = tLib.parseNotes(notes);

    if (notesArray.length < 1) {
      return;
    }

    notesArray[0].setUp(false);

    if (notesArray.length < 2) {
      return;
    }

    // second note is up, if it would be one the same row like the note before
    var isUp = notesArray[0].getChromaticInterval() % 2 === notesArray[1].getChromaticInterval() % 2;
    notesArray[1].setUp(isUp);

    if (notesArray.length < 3) {
      return;
    }

    if (isUp) {
      // third note would also stay up if it is on the same row like the note before
      isUp = notesArray[1].getChromaticInterval() % 2 === notesArray[2].getChromaticInterval() % 2;
    } else {
      isUp = notesArray[1].getChromaticInterval() % 2 !== notesArray[2].getChromaticInterval() % 2;
    }
    notesArray[2].setUp(isUp);

    if (notesArray.length < 4) {
      return;
    }

    // fourth note always is down
    notesArray[3].setUp(false);

    if (notesArray.length > 4) {
      console.warn("updateFingering() - only works with up to 4 notes!");
    }
  }
  lib.updateFingering = updateFingering;

  /**
   * progression[] ... array of chords
   */
  function optimizeVoiceLeading(progression) {
    if (progression.length < 2) {
      // nothing to do
      return;
    }

    for (var i=0; i<progression.length - 1; ++i) {
      var chord = progression[i];
      var nextChord = progression[i + 1];


    }
  }
  lib.optimizeVoiceLeading = optimizeVoiceLeading;

  function train(data) {
    data = data || convertTrainingData(_data);
    console.log("ChromatoneLibFingering.train() ", data);
    var net = new brain.NeuralNetwork(_netConfig);
    // var net = new brain.recurrent.RNN();
    console.log(net.train(data, _trainConfig));
    _net = net;
  };
  lib.train = train;

  function getNet() {
    if (typeof _net === "undefined") {
      train();
    }
    return _net;
  }
  lib.getNet = getNet;

  function getTrainingData() {
    return _data;
  }
  lib.getTrainingData = getTrainingData;

})(ChromatoneLibFingering, ChromatoneLibTheory);
