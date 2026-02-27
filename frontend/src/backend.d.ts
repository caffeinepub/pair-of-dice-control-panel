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
    decimalCodeLeft?: bigint;
    controlName?: string;
    controlType: string;
    decimalCode: bigint;
    radioOptions?: Array<string>;
    radioGroupIsVertical?: boolean;
    decimalCodeRight?: bigint;
    sliderIsVertical?: boolean;
    decimalCodeOn?: bigint;
    decimalCodeUp?: bigint;
    decimalCodeOff?: bigint;
    decimalCodeDown?: bigint;
}
export interface Layout {
    controls: Array<Control>;
}
export interface Event {
    controlName?: string;
    controlType: string;
    decimalCode: bigint;
    value: string;
    commandStr: string;
    codeType: string;
    controlId: string;
    timestamp: Time;
}
export interface backendInterface {
    backendScaffoldPlaceholderFunction(): Promise<string>;
    emitButtonEvent(controlId: string, controlType: string, controlName: string | null, value: string, codeType: string, decimalCode: bigint, commandStr: string): Promise<void>;
    getEventsByControlId(controlId: string): Promise<Array<Event>>;
    getLayout(): Promise<Layout>;
    getRecentEvents(): Promise<Array<Event>>;
    saveLayout(layout: Layout): Promise<void>;
}
