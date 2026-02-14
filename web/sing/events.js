function evalEventEnum(eventName, varName, value) {
    if (events[eventName] && events[eventName].vars[varName] && events[eventName].vars[varName].type === "enum") {
        return events[eventName].vars[varName].enum[value];
    }
    return value;
}

const events = {
    "none":{
        "name": "None",
        "vars":[],
    },
    "vibrato": {
        "name": "Vibrato",
        "vars": {
            "width": {
                "name": "Width",
                "type": "range",
                "min": 0,
                "max": 9000,
                "default": 0,
            },
            "rate": {
                "name": "Rate",
                "type": "range",
                "min": 0,
                "max": 9000,
                "default": 50,
            },
        },
        "color":0xFF5454,
        "ts": function(e) {
            return `Vibrato: Width ${e.vars.width}, Rate ${e.vars.rate}`;
        },
        i:0,
    },
    "chorus": {
        "name": "Chorus",
        "vars": {
            "v1ratio": {
                "name": "Voice 1 Ratio",
                "type": "range",
                "min": 0,
                "max": 20000,
                "default": 0,
            },
            "v2ratio": {
                "name": "Voice 2 Ratio",
                "type": "range",
                "min": 0,
                "max": 20000,
                "default": 0,
            },
            "v3ratio": {
                "name": "Voice 3 Ratio",
                "type": "range",
                "min": 0,
                "max": 20000,
                "default": 0,
            },
        },
        "color":0x54FF54,
        "ts": function(e) {
            return `Chorus: V1 ${e.vars.v1ratio}, V2 ${e.vars.v2ratio}, V3 ${e.vars.v3ratio}`;
        },
        i:1,
    },
    "stretchmode":{
        "name": "Stretch Mode",
        "vars": {
            "mode": {
                "name": "Mode",
                "type": "enum",
                "enum": {
                    0: "Whole Word",
                    1: "Only Vowels",
                    2: "Only Top",
                    3: "Only Last",
                },
                "default": 0,
            },
        },
        "color":0x5454FF,
        "ts": function(e) {
            return `Stretch Mode: ${evalEventEnum("stretchmode", "mode", e.vars.mode)}`;
        },
        i:2,
    },
    "eos": {
        "name": "End of Sentence",
        "vars":[],
        "color":0xFFA500,
        "ts": function(e) {
            return `End of Sentence`;
        },
        i:3,
    },
    "phonetic": {
        "name": "Phonetic Input",
        "vars": {
            "state":{
                "name": "State",
                "type": "enum",
                "enum": {
                    0: "Off",
                    1: "On",
                },
                "default": 0,
            },
        },
        "color":0x800080,
        "ts": function(e) {
            return `Phonetic Input: ${e.vars.state == 0 ? "Off" : "On"}`;
        },
        i:4,
    }
}

const addEventSelect = document.getElementById("addEventSelect");

function updateVarsDivs(){
    const selectedValue = addEventSelect.value;
    document.querySelectorAll("#eventsMenu .vars").forEach(div => {
        div.classList.add("hidden");
    });
    if (selectedValue && events[selectedValue]) {
        document.getElementById(`event-${selectedValue}`).classList.remove("hidden");
    }
}

for (const [key, value] of Object.entries(events)) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = value.name;
    addEventSelect.appendChild(option);

    if (value.vars) {
        const eventDiv = document.createElement("div");
        eventDiv.id = `event-${key}`;
        eventDiv.className = "vars hidden";
        
        for (const [varKey, varValue] of Object.entries(value.vars)) {
            const variableDiv = document.createElement("div");
            variableDiv.className = "pill outerpill";
            eventDiv.appendChild(variableDiv);

            const label = document.createElement("label");
            label.textContent = varValue.name;
            label.htmlFor = `${key}-${varKey}`;
            label.className = "pill";
            let input;
            let valueDisplay;
            if (varValue.type === "range") {
                input = document.createElement("input");
                input.type = "range";
                input.className = "slider"
                input.id = `${key}-${varKey}`;
                input.min = varValue.min;
                input.max = varValue.max;
                input.value = varValue.default;

                valueDisplay = document.createElement("span");
                valueDisplay.id = `${key}-${varKey}-value`;
                valueDisplay.textContent = varValue.default;
                input.addEventListener("input", function() {
                    valueDisplay.textContent = input.value;
                });
                valueDisplay.style.width = "5ch";
                valueDisplay.style.display = "inline-block";
                valueDisplay.style.textAlign = "center";
            }else if (varValue.type === "enum") {
                // radio buttons
                input = document.createElement("div");
                input.className = "radio-group";
                for (const [enumKey, enumValue] of Object.entries(varValue.enum)) {
                    const radioLabel = document.createElement("label");
                    const labelSpan = document.createElement("span");
                    labelSpan.textContent = enumValue;
                    radioLabel.appendChild(labelSpan);
                    radioLabel.className = "yellow button";
                    const radioInput = document.createElement("input");
                    radioInput.type = "radio";
                    radioInput.name = `${key}-${varKey}`;
                    radioInput.value = enumKey;
                    if (enumKey == varValue.default) {
                        radioInput.checked = true;
                    }
                    radioLabel.appendChild(radioInput);
                    input.appendChild(radioLabel);
                }
            }
            
            

            variableDiv.appendChild(label);
            variableDiv.appendChild(input);
            if (typeof valueDisplay!=='undefined'){
                variableDiv.appendChild(valueDisplay);
            }
        }
        
        document.getElementById("controlsContainer").appendChild(eventDiv);
    }

    addEventSelect.addEventListener("change", function() {
        updateVarsDivs();
    });
}

function getSelectedEvent() {
    const selectedValue = addEventSelect.value;
    if (selectedValue && events[selectedValue]) {
        const eventData = { name: selectedValue, vars: {} };
        
        for (const [evar,value] of Object.entries(events[selectedValue].vars)){
            const input = document.getElementById(`${selectedValue}-${evar}`);
            if (input) {
                eventData.vars[evar] = parseInt(input.value, 10);
            } else if (value.type === "enum") {
                const radios = document.getElementsByName(`${selectedValue}-${evar}`);
                for (const radio of radios) {
                    if (radio.checked) {
                        eventData.vars[evar] = parseInt(radio.value, 10);
                        break;
                    }
                }
            }
        }
        return eventData;
    }
    return null;
}

function setSelectedEvent(eventData) {
    if (eventData && events[eventData.name]) {
        addEventSelect.value = eventData.name;
        updateVarsDivs();
        
        for (const [key, value] of Object.entries(eventData.vars)) {
            const input = document.getElementById(`${eventData.name}-${key}`);
            if (input) {
                input.value = value;
            }
        }
    }
}