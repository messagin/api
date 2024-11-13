import { Request } from "express";

export interface CreateRequest extends Request {
  body: {
    username: string;
    email: string;
    password: string;
    name?: string;
  }
}
export interface LoginRequest extends Request {
  body: {
    token: string;
    email: string;
    password: string;
  }
};
export interface CreateTrialRequest extends Request {
  body: {
    username: string;
  }
};

export interface GetByIdRequest extends Request {
  params: {
    user_id: string;
  }
};
// export interface ValidateMfaRequest extends Request {
//   body: {

//   }
// };
export interface UpdatePasswordRequest extends Request {
  body: {
    old_password: string;
    new_password: string;
  }
};
// export interface DestroyRequest extends Request {
//   params: {

//   }
// };
