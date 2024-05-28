import { randomBytes } from "crypto";

export default class IdManager {
  private ids: Set<string>;

  constructor() {
    this.ids = new Set();
  }
  generate(): string {
    const id = randomBytes(12).toString("base64url");
    if (this.ids.has(id)) return this.generate();
    this.ids.add(id);
    return id;
  }
  revoke(id: string) {
    this.ids.delete(id);
  }
}
