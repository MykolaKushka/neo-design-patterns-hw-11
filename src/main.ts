import * as fs from "fs/promises";
import { buildAccessLogChain } from "./chain/chains/AccessLogChain";
import { buildTransactionChain } from "./chain/chains/TransactionChain";
import { buildSystemErrorChain } from "./chain/chains/SystemErrorChain";
import { ProcessingMediator } from "./mediator/ProcessingMediator";
import { AccessLogWriter } from "./mediator/writers/AccessLogWriter";
import { TransactionWriter } from "./mediator/writers/TransactionWriter";
import { ErrorLogWriter } from "./mediator/writers/ErrorLogWriter";
import { RejectedWriter } from "./mediator/writers/RejectedWriter";
import { DataRecord } from "./models/DataRecord";
import { AbstractHandler } from "./chain/AbstractHandler";

const handlerMap: Record<string, () => AbstractHandler> = {
  access_log: buildAccessLogChain,
  transaction: buildTransactionChain,
  system_error: buildSystemErrorChain,
};

async function main() {
  const raw = await fs.readFile("src/data/records.json", "utf-8");
  const records: DataRecord[] = JSON.parse(raw);

  const mediator = new ProcessingMediator(
    new AccessLogWriter(),
    new TransactionWriter(),
    new ErrorLogWriter(),
    new RejectedWriter()
  );

  let loaded = records.length;
  let ok = 0;
  let rejected = 0;

  for (const rec of records) {
    const builder = handlerMap[rec.type];
    if (!builder) {
      mediator.onRejected(rec as DataRecord, "Unsupported type");
      rejected++;
      continue;
    }
    const chain = builder();
    try {
      const processed = chain.handle(rec as DataRecord) as DataRecord;
      mediator.onSuccess(processed);
      ok++;
    } catch (e: any) {
      mediator.onRejected(rec as DataRecord, e?.message || "Unknown error");
      rejected++;
    }
  }

  await mediator.finalize();

  console.log(`[INFO] Завантажено записів: ${loaded}`);
  console.log(`[INFO] Успішно оброблено: ${ok}`);
  console.log(`[WARN] Відхилено з помилками: ${rejected}`);
  console.log(`[INFO] Звіт збережено у директорії src/output/`);
}

main();
