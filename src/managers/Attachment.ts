import db from "../utils/database";

enum AttachmentFlags {
  Empty,
  Uploaded,
  Locked,
  Failed,
};

//! todo (check if Attachment class is required)
interface Attachment {
  message_id: string;
  filename: string;
  flags: AttachmentFlags;
  user_id: string;
};

export class AttachmentManager {
  private message_id: string;

  constructor(message_id: string) {
    this.message_id = message_id;
  }

  async list(): Promise<Attachment[]> {
    const attachments = (await db.execute("SELECT * FROM attachments WHERE message_id = ?", [this.message_id], { prepare: true })).rows;

    return attachments as unknown as Attachment[];
  }

  async lock(filename: string): Promise<void> {
    await db.execute("UPDATE attachments SET flags = ? WHERE message_id = ? AND filename = ?", [
      AttachmentFlags.Locked,
      this.message_id,
      filename
    ], { prepare: true });
  }

  async fail(filename: string): Promise<void> {
    await db.execute("UPDATE attachments SET flags = ? WHERE message_id = ? AND filename = ?", [
      AttachmentFlags.Failed,
      this.message_id,
      filename
    ], { prepare: true });
  }
}
