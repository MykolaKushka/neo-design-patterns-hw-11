import { AbstractHandler } from "../AbstractHandler";
import { SystemErrorRecord } from "../../models/DataRecord";

export class MessageTrimmer extends AbstractHandler {
  protected process(record: SystemErrorRecord): SystemErrorRecord {
    const msg = typeof record.message === "string" ? record.message.trim() : "";
    return { ...record, message: msg.slice(0, 255) };
  }
}
