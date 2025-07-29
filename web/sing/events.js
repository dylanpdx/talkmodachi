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
                "min": 0,
                "max": 1024,
                "default": 0,
            },
            "rate": {
                "name": "Rate",
                "min": 0,
                "max": 5000,
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
                "min": 0,
                "max": 500,
                "default": 0,
            },
            "v2ratio": {
                "name": "Voice 2 Ratio",
                "min": 0,
                "max": 500,
                "default": 0,
            },
            "v3ratio": {
                "name": "Voice 3 Ratio",
                "min": 0,
                "max": 500,
                "default": 0,
            },
        },
        "color":0x54FF54,
        "ts": function(e) {
            return `Chorus: V1 ${e.vars.v1ratio}, V2 ${e.vars.v2ratio}, V3 ${e.vars.v3ratio}`;
        },
        i:1,
    },
}

const addEventSelect = document.getElementById("addEventSelect");

function updateVarsDivs(){
    const selectedValue = addEventSelect.value;
    document.querySelectorAll("#eventsMenu > div").forEach(div => {
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
            const label = document.createElement("label");
            label.textContent = varValue.name;
            label.htmlFor = `${key}-${varKey}`;
            
            const input = document.createElement("input");
            input.type = "range";
            input.id = `${key}-${varKey}`;
            input.min = varValue.min;
            input.max = varValue.max;
            input.value = varValue.default;
            
            eventDiv.appendChild(label);
            eventDiv.appendChild(input);
        }
        
        document.getElementById("eventsMenu").appendChild(eventDiv);
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