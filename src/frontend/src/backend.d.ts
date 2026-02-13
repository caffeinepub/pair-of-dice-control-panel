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
    controlName?: string;
    controlType: string;
    radioOptions?: Array<string>;
    radioGroupIsVertical?: boolean;
    sliderIsVertical?: boolean;
    binaryCode: string;
}
export interface Layout {
    controls: Array<Control>;
}
export interface Event {
    controlName?: string;
    controlType: string;
    value: string;
    controlId: string;
    timestamp: Time;
    binaryCode: string;
}
export interface backendInterface {
    backendScaffoldPlaceholderFunction(): Promise<string>;
    emitEvent(controlId: string, controlType: string, controlName: string | null, value: string, binaryCode: string): Promise<void>;
    emitHatGpiosetEvent(controlId: string, controlType: string, controlName: string | null, binaryCode: string): Promise<void>;
    getEventsByControlId(controlId: string): Promise<Array<Event>>;
    getLayout(): Promise<Layout>;
    getRecentEvents(): Promise<Array<Event>>;
    saveLayout(layout: Layout): Promise<void>;
}
