import List "mo:core/List";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Char "mo:core/Char";

actor {
  type Event = {
    timestamp : Time.Time;
    controlId : Text;
    controlType : Text;
    controlName : ?Text;
    value : Text;
    binaryCode : Text;
  };

  type Control = {
    id : Text;
    controlType : Text;
    controlName : ?Text;
    binaryCode : Text;
    radioOptions : ?[Text];
    radioGroupIsVertical : ?Bool;
    sliderIsVertical : ?Bool;
    dialIncreaseBinaryCode : ?Text;
    dialDecreaseBinaryCode : ?Text;
  };

  type Layout = {
    controls : [Control];
  };

  type EventLog = {
    events : [Event];
    maxSize : Nat;
  };

  var currentLayout : Layout = { controls = [] };
  var eventLog : EventLog = { events = []; maxSize = 100 };

  func addEvent(event : Event) {
    let newEvents = [event].concat(eventLog.events);

    if (newEvents.size() > eventLog.maxSize) {
      eventLog := {
        events = newEvents.sliceToArray(0, eventLog.maxSize);
        maxSize = eventLog.maxSize;
      };
    } else {
      eventLog := {
        events = newEvents;
        maxSize = eventLog.maxSize;
      };
    };
  };

  func isValidBinaryCode(code : Text) : Bool {
    if (code.size() != 4) {
      return false;
    };
    code.chars().all(
      func(char) {
        char == '0' or char == '1';
      }
    );
  };

  public query ({ caller }) func getLayout() : async Layout {
    currentLayout;
  };

  public shared ({ caller }) func saveLayout(layout : Layout) : async () {
    for (control in layout.controls.values()) {
      if (not isValidBinaryCode(control.binaryCode)) {
        return;
      };
      switch (control.dialIncreaseBinaryCode, control.dialDecreaseBinaryCode) {
        case (?inc, ?dec) {
          if (not isValidBinaryCode(inc) or not isValidBinaryCode(dec)) {
            return;
          };
        };
        case (_, _) {};
      };
    };
    currentLayout := layout;
  };

  public shared ({ caller }) func emitEvent(controlId : Text, controlType : Text, controlName : ?Text, value : Text, binaryCode : Text) : async () {
    if (not isValidBinaryCode(binaryCode)) {
      return;
    };

    let event : Event = {
      timestamp = Time.now();
      controlId;
      controlType;
      controlName;
      value;
      binaryCode;
    };
    addEvent(event);
  };

  public query ({ caller }) func getRecentEvents() : async [Event] {
    eventLog.events;
  };

  public query ({ caller }) func getEventsByControlId(controlId : Text) : async [Event] {
    let filteredEvents = List.empty<Event>();
    eventLog.events.values().forEach(
      func(event) {
        if (event.controlId == controlId) {
          filteredEvents.add(event);
        };
      }
    );
    filteredEvents.toArray();
  };

  public shared ({ caller }) func emitHatGpiosetEvent(controlId : Text, controlType : Text, controlName : ?Text, binaryCode : Text) : async () {
    if (not isValidBinaryCode(binaryCode)) {
      return;
    };

    let hatGpiosetCommand = convertToHatGpiosetCommand(binaryCode);

    let event : Event = {
      timestamp = Time.now();
      controlId;
      controlType;
      controlName;
      value = hatGpiosetCommand;
      binaryCode;
    };
    addEvent(event);
  };

  public shared ({ caller }) func emitDialEvent(controlId : Text, controlType : Text, controlName : ?Text, direction : Text) : async () {
    let controlOpt = currentLayout.controls.find(func(c) { c.id == controlId });
    switch (controlOpt) {
      case (null) { return };
      case (?control) {
        let binaryCode = switch (direction) {
          case ("increase") { control.dialIncreaseBinaryCode };
          case ("decrease") { control.dialDecreaseBinaryCode };
          case (_) { return };
        };

        switch (binaryCode) {
          case (null) { return };
          case (?code) {
            if (not isValidBinaryCode(code)) {
              return;
            };

            let hatGpiosetCommand = convertToHatGpiosetCommand(code);

            let event : Event = {
              timestamp = Time.now();
              controlId;
              controlType;
              controlName;
              value = hatGpiosetCommand;
              binaryCode = code;
            };
            addEvent(event);
          };
        };
      };
    };
  };

  func calculateTransitionDuration(lastState : Text, currentState : Text) : Nat {
    var transitions = 0;
    for (i in Nat.range(0, 4)) {
      let lastChars = lastState.toArray();
      let currentChars = currentState.toArray();

      if (i < lastChars.size() and i < currentChars.size()) {
        let lastChar = lastChars[i];
        let currentChar = currentChars[i];
        switch (lastChar, currentChar) {
          case (
            last,
            current,
          ) {
            if (last != current) {
              transitions += 1;
            };
          };
        };
      };
    };

    if (transitions > 0) {
      4 / transitions;
    } else {
      4;
    };
  };

  func convertToHatGpiosetCommand(binaryCode : Text) : Text {
    var gpiosetCommand = "";
    var currentState = "0000";
    var lastState = "0000";

    for (char in binaryCode.chars()) {
      var newState = "";
      for (i in Nat.range(0, 4)) {
        if (i == 3) {
          newState #= char.toText();
        } else {
          let charsArray = currentState.toArray();
          if (i < charsArray.size()) {
            let character = charsArray[i];
            newState #= character.toText();
          };
        };
      };

      currentState := newState;

      let transitionDuration = calculateTransitionDuration(lastState, currentState);

      gpiosetCommand #= "gpioset --mode=time 0 " # currentState # " --duration=" # transitionDuration.toText() # "ms\n";

      lastState := currentState;
    };

    // Ensure the final state is always set to "0000"
    gpiosetCommand # "gpioset --mode=time 0 0000 --duration=4ms\n";
  };

  // <CODE_AREAS>
  // ===================== BACKEND SCAFFOLD (EDIT AT WILL) =====================
  public query ({ caller }) func backendScaffoldPlaceholderFunction() : async Text {
    "Backend scaffold placeholder for future user-defined logic";
  };
  // =================== END BACKEND SCAFFOLD (EDIT AT WILL) ===================
  // </CODE_AREAS>
};
