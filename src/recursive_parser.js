var lib = {};
module.exports = lib;

var LINES_REGEX = /[^\r\n]+/g;

function createReferenceResolver(referenceMap, parserDelegate) {
  return {
    resolveReference: function(referenceName) {
      // resolve reference
      var thing = referenceMap[referenceName];
      if (typeof thing === "undefined") {
        // TODO what is best to do here?
        console.error("Reference resolver for " + parserDelegate.getName() + ": Undeclared reference used: " + referenceName);
        return;
      }

      // already resolved?
      if (typeof(thing) !== "string") {
        return thing;
      }

      // resolve
      referenceMap[referenceName] = parserDelegate.parseThing(thing, this);

      return referenceMap[referenceName];
    }
  };
}

/**
* Returns resultMapping, a mapping object of names to <Thing> objects.
*
* parserDelegate is an object which is expected to have the following methods:
* - String getName() // <- something which makes error messages more verbose
* - <Thing> parseThing(singleLineString, referencResolver)
* - addNoNameThing(<Thing>, resultMapping) // <- this way there can be different behaviors to for unnamed things
*
* referencResolver provides the method:
* - <Thing> resolveReference(referenceNameString)
*/
lib.parseThingsRecursive = function(multineText, parserDelegate) {
  var resultMapping = {};
  var noNameThings = [];

  // first just initialize the result mapping with the unparsed strings, parsing and resolving references follows later,
  // because first all definitions are required to be known...

  // for each line of the multine string:
  var lines = multineText.match(LINES_REGEX) || [];
  lines.forEach(function(definition){
    var split = definition.trim().split(":");
    if (split.length > 2) {
      console.error("parseThingsRecursive() - Ignoring line, because it contains too many \":\": " + definition);
      return;
    }
    if (split.length == 1) {
      // collect the things without name separatly, so its final handling can be decided by the parser delegate
      noNameThings.push(split[0].trim());
      return;
    }
    resultMapping[split[0].trim()] = split[1].trim();
  });

  var referenceResolver = createReferenceResolver(resultMapping, parserDelegate);

  // parse and resolve references...
  for (var key in resultMapping) {
    if (!resultMapping.hasOwnProperty(key)) {
      continue;
    }
    if (typeof(resultMapping[key]) === "string") {
      resultMapping[key] = parserDelegate.parseThing(resultMapping[key], referenceResolver);
    }
  }

  noNameThings.forEach(function(unparsedThing) {
    var thing = parserDelegate.parseThing(unparsedThing, referenceResolver);
    parserDelegate.addNoNameThing(thing, resultMapping);
  });

  return resultMapping;
};
