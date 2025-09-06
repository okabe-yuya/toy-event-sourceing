import { InvoiceId, TransactionId } from "../../models/transaction";
import TransactionEvent from "./transaction";

/** 取引開始イベント */
class StartTransactionEvent implements TransactionEvent {
  public eventName: string;
  public occurredAt: Date;

  public transactionId: TransactionId;
  public invoiceId: InvoiceId;

  constructor(
    public invoiceAmount: number,
    public invoiceDate: Date,
  ) {
    this.eventName = "StartTransactionEvent";
    this.occurredAt = new Date();

    this.transactionId = crypto.randomUUID();
    this.invoiceId = crypto.randomUUID();
  }
}

export default StartTransactionEvent;
