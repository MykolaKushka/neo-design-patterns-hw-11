import { AbstractHandler } from "../AbstractHandler";
import { DataRecord } from "../../models/DataRecord";

export class TimestampParser extends AbstractHandler {
  protected process(record: DataRecord): DataRecord {
    const ts = (record as any).timestamp;
    if (typeof ts !== "string") throw new Error("Missing or invalid 'timestamp'");
    const d = new Date(ts);
    if (isNaN(d.getTime())) throw new Error("Invalid timestamp");
    return { ...record, timestamp: d.toISOString() } as DataRecord;
  }
}
