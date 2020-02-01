var lib = {};
module.exports = lib;

/**
 * presets[]                        .. the presets to be initialized
 * presetSelectElementOrElements|[] .. select element or elements which are used to switch between the different presets
 * elements[]                       .. the elements, the preset values get assigned to when a preset is selected
 */
lib.initPresets = function(presets, presetSelectElementOrElements, elements) {
  var presetSelectElements = presetSelectElementOrElements;
  if (!Array.isArray(presetSelectElements)) {
    presetSelectElements = [presetSelectElements];
  }

  presetSelectElements.forEach(function(presetEl) {
    // initialize the preset select box
    for (var i = 0; i < presets.length; ++i) {
      var preset = presets[i];
      var option = presetEl.appendChild(document.createElement("option"));
      option.value = i;
      option.innerHTML = preset
        .map(function(v){
          return Array.isArray(v) ? v.join(", ") : v;
        })
        .join(" -> ");
    }
    presetEl.addEventListener("change", function(event) {
      // Apply the selected preset to the element or elements
      var preset = presets[presetEl.value];
      for (var i=0; i < elements.length; ++i) {
        var elementOrElements = elements[i];
        if (typeof elementOrElements === "function") {
          elementOrElements = elementOrElements(preset[i]);
        }
        if (Array.isArray(elementOrElements)) {
          if (!Array.isArray(preset[i])) {
            console.error("initPresets () - Preset not set up right!");
            continue;
          }
          var index = 0;
          preset[i].forEach(function(presetValue) {
            if (typeof elementOrElements[index] === "undefined") {
              console.error("initPresets () - Preset not set up right: " + (index + 1));
            } else {
              applyPresetValue(elementOrElements[index], presetValue);
            }
            ++index;
          });

        } else {
          applyPresetValue(elementOrElements, preset[i]);
        }
      }
      presetEl.form.update.click();
    });
  });
}

function applyPresetValue(element, presetValue) {
  if (typeof(presetValue) === "undefined") {
    element.value = "";
    return;
  }
  element.value = presetValue;
}
