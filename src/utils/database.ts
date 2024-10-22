
// type User = {
//   id: string;
//   flags: number;
//   username: string;
//   password: string;
//   name: string | null;
//   email: string | null;
//   phone: string | null;
//   mfa: string | null;
//   created_at: number;
// }

// type Signup = {
//   id: string;
//   flags: number;
//   username: string;
//   password: string;
//   token: string;
//   code: string;
//   email: string | null;
//   created_at: number;
// }

// type Space = {
//   id: string;
//   name: string;
//   flags: number;
//   owner_id: string;
//   created_at: number;
// }

// type Session = {
//   id: string;
//   user_id: string;
//   token: string;
//   flags: number;
//   browser: string | null;
//   os: string | null;
//   ip: string | null;
//   ua: string | null;
//   updated_at: number;
//   created_at: number;
// }

// type Role = {
//   space_id: string;
//   id: string;
//   permissions: number;
//   created_at: number;
// };

// type PasswordReset = {
//   id: string;
//   token: string;
// };

// type EmailValidation = {
//   id: string;
//   token: string;
// };

// type Chat = {
//   id: string;
//   name: string;
//   flags: number;
//   space_id: string | null;
//   created_at: number;
// };

// type ChatMember = {
//   flags: number;
//   chat_id: string;
//   user_id: string;
//   created_at: number;
// }

// type Member = {
//   space_id: string;
//   user_id: string;
//   share: number;
//   permissions: number;
//   color: number | null;
//   created_at: number;
// };

// type Message = {
//   id: string;
//   chat_id: string;
//   user_id: string;
//   content: string;
//   flags: number;
//   updated_at: number;
//   created_at: number;
// };

// type Ratelimit = {
//   type: string;
//   count: number;
//   created_at: number;
//   id: string | null;
//   ip: string | null;
// };

// type MemberRole = {
//   space_id: string;
//   user_id: string;
//   role_id: string;
// };

// type Invite = {
//   id: string;
//   space_id: string;
//   uses: number;
//   max_uses: number;
//   max_age: number;
//   created_at: number;
// };

// type Relation = {
//   user_id0: string;
//   user_id1: string;
//   flags: number;
//   updated_at: number;
//   created_at: number;
// };

// const db = new ScylloClient<{
//   users: User,
//   chats: Chat,
//   roles: Role,
//   spaces: Space,
//   signups: Signup,
//   members: Member,
//   invites: Invite,
//   messages: Message,
//   sessions: Session,
//   relations: Relation,
//   rate_limits: Ratelimit,
//   member_roles: MemberRole,
//   chat_members: ChatMember,
//   password_resets: PasswordReset,
//   email_validations: EmailValidation,
// }>({
//   client: {
//     contactPoints: ["192.168.0.127"],
//     keyspace: "messagin",
//     localDataCenter: "datacenter1"
//   }
// });

// export default db;

import { Client } from "cassandra-driver";

const db = new Client({
  contactPoints: ["192.168.0.127", "127.0.0.1"],
  keyspace: "messagin",
  localDataCenter: "datacenter1"
});

export default db;
