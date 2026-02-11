import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface Control {
    id: string;
    controlType: string;
    radioOptions?: Array<string>;
    radioGroupIsVertical?: boolean;
    binaryCode: string;
}
export interface Layout {
    controls: Array<Control>;
}
export interface Event {
    controlType: string;
    value: string;
    controlId: string;
    timestamp: Time;
    binaryCode: string;
}
export interface backendInterface {
    emitEvent(controlId: string, controlType: string, value: string, binaryCode: string): Promise<void>;
    getEventsByControlId(controlId: string): Promise<Array<Event>>;
    getLayout(): Promise<Layout>;
    getRadioGroupLayout(): Promise<boolean>;
    getRecentEvents(): Promise<Array<Event>>;
    saveLayout(layout: Layout): Promise<void>;
}
