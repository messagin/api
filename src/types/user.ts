import { Request } from "express";

export interface CreateRequest extends Request {
  body: {
    username: string;
    email: string;
    password: string;
    name?: string;
  }
}
export interface LoginRequest extends Request { };
export interface CreateTrialRequest extends Request { };
export interface GetSelfRequest extends Request { };
export interface GetByIdRequest extends Request { };
export interface ValidateMfaRequest extends Request { };
export interface UpdatePasswordRequest extends Request { };
export interface DestroyRequest extends Request { };
