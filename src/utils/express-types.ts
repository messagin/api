import { Request } from "express";

export namespace UserRequest {
  export interface Create extends Request {
    body: {
      username: string;
      email: string;
      password: string;
      name?: string;
    }
  }
  export interface Destroy extends Request {
    params: {};
    body: {};
  }
}
