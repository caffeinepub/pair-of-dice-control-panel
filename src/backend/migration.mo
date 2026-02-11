import Map "mo:core/Map";
import Text "mo:core/Text";

module {
  type OldControl = {
    id : Text;
    controlType : Text;
    binaryCode : Text;
    radioOptions : ?[Text];
  };

  type OldLayout = {
    controls : [OldControl];
  };

  type OldEvent = {
    timestamp : Int;
    controlId : Text;
    controlType : Text;
    value : Text;
    binaryCode : Text;
  };

  type OldEventLog = {
    events : [OldEvent];
    maxSize : Nat;
  };

  type OldActor = {
    currentLayout : OldLayout;
    eventLog : OldEventLog;
  };

  type NewControl = {
    id : Text;
    controlType : Text;
    binaryCode : Text;
    radioOptions : ?[Text];
    radioGroupIsVertical : ?Bool;
  };

  type NewLayout = {
    controls : [NewControl];
  };

  type NewActor = {
    currentLayout : NewLayout;
    eventLog : OldEventLog;
  };

  public func run(old : OldActor) : NewActor {
    let newControls = old.currentLayout.controls.map(
      func(control) {
        {
          id = control.id;
          controlType = control.controlType;
          binaryCode = control.binaryCode;
          radioOptions = control.radioOptions;
          radioGroupIsVertical = ?false;
        };
      }
    );
    {
      currentLayout = { controls = newControls };
      eventLog = old.eventLog;
    };
  };
};

