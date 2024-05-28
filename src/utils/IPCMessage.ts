export interface IPCMessage {
  type: number;
  action: number;
  data: unknown;
  route: string;
  id: string;
}
