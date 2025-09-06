import { Transaction, TransactionId } from "../../models/transaction";
import EndTransactionEvent from "./endTransactionEvent";
import PaymentEvent from "./paymentEvent";
import ResetTransactionEvent from "./resetTransactionEvent";
import StartTransactionEvent from "./startTransactionEvent";
import TransactionEvent from "./transaction";

/**
 * イベントからモデルを復元する。
 */
function replay(events: TransactionEvent[]): Transaction | null {
  // イベントが存在しない場合は復元できないため null を返す
  if (events.length === 0) return null;

  const [headEvent, ...tailEvents] = events;
  if (!(headEvent instanceof StartTransactionEvent)) {
    throw new Error("イベントは必ず取引開始から開始する必要があります")
  }

  let transaction = new Transaction(headEvent.transactionId)
    .startTransaction(headEvent.invoiceAmount, headEvent.invoiceDate);

  // TODO: トランスコンパイル時に網羅性不十分のエラーにできないか？
  for (const event of tailEvents) {
    switch (event.eventName) {
      case "StartTransactionEvent": {
        const _event = event as StartTransactionEvent;
        transaction = transaction.startTransaction(_event.invoiceAmount, _event.invoiceDate);

        break;
      }

      case "ResetTransactionEvent": {
        const _event = event as ResetTransactionEvent;
        transaction = transaction.resetTransaction(_event.transactionId);

        break;
      }

      case "PaymentEvent": {
        const _event = event as PaymentEvent;
        transaction = transaction.execPayment(_event.targetInvoiceId, _event.paymentAmount);

        break;
      }

      case "EndTransactionEvent": {
        const _event = event as EndTransactionEvent;
        transaction = transaction.endTransaction(_event.transactionId);

        break;
      }
    }
  }

  return transaction;
}

export default replay;
