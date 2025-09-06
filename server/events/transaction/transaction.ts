import Event from "../event";

/**
 * 取引イベント
 */
interface TransactionEvent extends Event {
  eventName: string;
  occurredAt: Date;
}

export default TransactionEvent;
