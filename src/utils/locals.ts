import { User } from "../schemas/User";

export interface ResLocals {
  rateLimit: {
    type: string;
    limit: number;
    reset: number;
    remaining: number;
    created_at: number;
  };
  ip: string;
  user: User;
  is_bot: boolean;
  session: string;
};
