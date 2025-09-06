import { InvoiceId } from "../../models/transaction";
import TransactionEvent from "./transaction";

/** 領収 */
class PaymentEvent implements TransactionEvent {
  public eventName: string;
  public occurredAt: Date;

  constructor(
    public targetInvoiceId: InvoiceId,
    public paymentAmount: number,
  ) {
    this.eventName = "PaymentEvent";
    this.occurredAt = new Date();
  }
}

export default PaymentEvent;
