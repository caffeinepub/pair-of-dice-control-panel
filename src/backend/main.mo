import List "mo:core/List";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
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
    decimalCode : Nat;
    radioOptions : ?[Text];
    radioGroupIsVertical : ?Bool;
    sliderIsVertical : ?Bool;
    dialIncreaseCode : ?Nat;
    dialDecreaseCode : ?Nat;
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

  func isValidDecimalCode(code : Nat) : Bool {
    code >= 1 and code <= 16;
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

  func decimalToBinary(decimal : Nat) : Text {
    let reversedBinary = decimalToBinaryStringHelper(decimal);

    // Pad with extra zeros to ensure at least 4 characters
    let paddedBinary = reversedBinary # "0000";

    // Reverse the string to get the correct binary representation
    let binaryArray = paddedBinary.toArray();
    let reversedArray = Array.tabulate(
      binaryArray.size(),
      func(i) {
        binaryArray[binaryArray.size() - 1 - i];
      },
    );

    let trimmedArray = reversedArray.sliceToArray(0, 4);
    Text.fromIter(trimmedArray.values());
  };

  func decimalToBinaryStringHelper(decimal : Nat) : Text {
    if (decimal == 0) {
      return "";
    };
    let remainder = decimal % 2;
    let quotient = decimal / 2;
    decimalToBinaryStringHelper(quotient) # remainder.toText();
  };

  public query ({ caller }) func getLayout() : async Layout {
    currentLayout;
  };

  public shared ({ caller }) func saveLayout(layout : Layout) : async () {
    for (control in layout.controls.values()) {
      if (not isValidDecimalCode(control.decimalCode)) {
        return;
      };
      switch (control.dialIncreaseCode, control.dialDecreaseCode) {
        case (?inc, ?dec) {
          if (not isValidDecimalCode(inc) or not isValidDecimalCode(dec)) {
            return;
          };
        };
        case (_, _) {};
      };
    };
    currentLayout := layout;
  };

  public shared ({ caller }) func emitEvent(controlId : Text, controlType : Text, controlName : ?Text, value : Text, decimalCode : Nat) : async () {
    if (not isValidDecimalCode(decimalCode)) {
      return;
    };

    let binaryCode = decimalToBinary(decimalCode);

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

  public shared ({ caller }) func emitHatGpiosetEvent(controlId : Text, controlType : Text, controlName : ?Text, decimalCode : Nat) : async () {
    if (not isValidDecimalCode(decimalCode)) {
      return;
    };

    let binaryCode = decimalToBinary(decimalCode);
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
        let decimalCode = switch (direction) {
          case ("increase") { control.dialIncreaseCode };
          case ("decrease") { control.dialDecreaseCode };
          case (_) { return };
        };

        switch (decimalCode) {
          case (null) { return };
          case (?code) {
            if (not isValidDecimalCode(code)) {
              return;
            };

            let binaryCode = decimalToBinary(code);
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

  // ===================== BACKEND SCAFFOLD (EDIT AT WILL) =====================
  public query ({ caller }) func backendScaffoldPlaceholderFunction() : async Text {
    "Backend scaffold placeholder for future user-defined logic";
  };
  // =================== END BACKEND SCAFFOLD (EDIT AT WILL) ===================
};
