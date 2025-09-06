import { TransactionId } from "../../models/transaction";
import TransactionEvent from "./transaction";

/** 請求取り消し */
class ResetTransactionEvent implements TransactionEvent {
  public eventName: string;
  public occurredAt: Date;

  constructor(public transactionId: TransactionId) {
    this.eventName = "ResetTransactionEvent";
    this.occurredAt = new Date();
  }
}

export default ResetTransactionEvent;
