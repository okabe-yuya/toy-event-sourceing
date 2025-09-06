import { TransactionId } from "../../models/transaction";
import TransactionEvent from "./transaction";

/** 取引完了 */
class EndTransactionEvent implements TransactionEvent {
  public eventName: string;
  public occurredAt: Date;

  constructor(public transactionId: TransactionId) {
    this.eventName = "EndTransactionEvent";
    this.occurredAt = new Date();
  }
}

export default EndTransactionEvent;
