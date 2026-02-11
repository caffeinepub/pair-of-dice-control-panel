import Array "mo:core/Array";
import Time "mo:core/Time";

module {
  type OldEvent = {
    timestamp : Time.Time;
    controlId : Text;
    controlType : Text;
    value : Text;
    binaryCode : Text;
  };

  type OldControl = {
    id : Text;
    controlType : Text;
    binaryCode : Text;
    radioOptions : ?[Text];
    radioGroupIsVertical : ?Bool;
    sliderIsVertical : ?Bool;
  };

  type OldLayout = {
    controls : [OldControl];
  };

  type OldEventLog = {
    events : [OldEvent];
    maxSize : Nat;
  };

  type OldActor = {
    currentLayout : OldLayout;
    eventLog : OldEventLog;
  };

  type NewEvent = {
    timestamp : Time.Time;
    controlId : Text;
    controlType : Text;
    controlName : ?Text;
    value : Text;
    binaryCode : Text;
  };

  type NewControl = {
    id : Text;
    controlType : Text;
    controlName : ?Text;
    binaryCode : Text;
    radioOptions : ?[Text];
    radioGroupIsVertical : ?Bool;
    sliderIsVertical : ?Bool;
  };

  type NewLayout = {
    controls : [NewControl];
  };

  type NewEventLog = {
    events : [NewEvent];
    maxSize : Nat;
  };

  type NewActor = {
    currentLayout : NewLayout;
    eventLog : NewEventLog;
  };

  public func run(old : OldActor) : NewActor {
    let newControls = old.currentLayout.controls.map(
      func(oldControl) {
        {
          oldControl with
          controlName = null;
        };
      }
    );

    let newEvents = old.eventLog.events.map(
      func(oldEvent) {
        {
          oldEvent with
          controlName = null;
        };
      }
    );

    {
      currentLayout = { old.currentLayout with controls = newControls };
      eventLog = { old.eventLog with events = newEvents };
    };
  };
};
