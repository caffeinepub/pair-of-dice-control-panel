import List "mo:core/List";
import Time "mo:core/Time";



actor {
  type Event = {
    timestamp : Time.Time;
    controlId : Text;
    controlType : Text;
    controlName : ?Text;
    value : Text;
    codeType : Text;
    decimalCode : Nat;
    commandStr : Text;
  };

  type Control = {
    id : Text;
    controlType : Text;
    controlName : ?Text;
    decimalCode : Nat;
    decimalCodeOn : ?Nat;
    decimalCodeOff : ?Nat;
    decimalCodeLeft : ?Nat;
    decimalCodeRight : ?Nat;
    decimalCodeUp : ?Nat;
    decimalCodeDown : ?Nat;
    radioOptions : ?[Text];
    radioGroupIsVertical : ?Bool;
    sliderIsVertical : ?Bool;
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

  public query ({ caller }) func getLayout() : async Layout {
    currentLayout;
  };

  public shared ({ caller }) func saveLayout(layout : Layout) : async () {
    for (control in layout.controls.values()) {
      if (not isValidDecimalCode(control.decimalCode)) {
        return;
      };
      switch (control.decimalCodeOn, control.decimalCodeOff, control.decimalCodeLeft, control.decimalCodeRight, control.decimalCodeUp, control.decimalCodeDown) {
        case (?_, ?_, ?_, ?_, ?_, ?_) {
          ignore ();
        };
        case (_) {};
      };
    };
    currentLayout := layout;
  };

  public shared ({ caller }) func emitButtonEvent(controlId : Text, controlType : Text, controlName : ?Text, value : Text, codeType : Text, decimalCode : Nat, commandStr : Text) : async () {
    let event : Event = {
      timestamp = Time.now();
      controlId;
      controlType;
      controlName;
      value;
      codeType;
      decimalCode;
      commandStr;
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

  // ===================== BACKEND SCAFFOLD (EDIT AT WILL) =====================
  public query ({ caller }) func backendScaffoldPlaceholderFunction() : async Text {
    "Backend scaffold placeholder for future user-defined logic";
  };
  // =================== END BACKEND SCAFFOLD (EDIT AT WILL) ===================
};
