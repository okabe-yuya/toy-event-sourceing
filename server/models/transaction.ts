export type TransactionId = string;
export type InvoiceId = string;
export type PaymentId = string;
type TransactionStatus =
  "未請求" |
  "請求済み（支払い待ち）" |
  "未収金あり" |
  "満額領収済み" |
  "過払金あり" |
  "取引完了"
  ;
type PaymentStatus = Extract<TransactionStatus, "未収金あり" | "満額領収済み" | "過払金あり">;

/**
 * 請求を表すモデル
 */
class Invoice {
  public invoiceId: InvoiceId;
  public invoiceAmount: number;
  public invoiceDate: Date;

  public status: "有効" | "取り消し済み";
  public createdAt: Date;

  constructor(
    invoiceAmount: number,
    invoiceDate: Date,
  ) {
    this.invoiceId = crypto.randomUUID();
    this.invoiceAmount = invoiceAmount;
    this.invoiceDate = invoiceDate;

    this.status = "有効";
    this.createdAt = new Date();
  }
}

/**
 * 領収を表すモデル
 */
class Payment {
  public targetInvoiceId: InvoiceId;
  public paymentId: PaymentId;
  public paymentAmount: number;

  public status: "有効" | "取り消し済み";
  public createdAt: Date;

  constructor(
    targetInvoiceId: InvoiceId,
    paymentAmount: number,
  ) {
    this.targetInvoiceId = targetInvoiceId;
    this.paymentId = crypto.randomUUID();
    this.paymentAmount = paymentAmount;

    this.status = "有効";
    this.createdAt = new Date();
  }
}

/**
 * お金のやり取りを表すモデル
 */
export class Transaction {
  public transactionId: TransactionId;
  public invoices: Invoice[];
  public payments: Payment[];
  public status: TransactionStatus;
  public createdAt: Date;

  constructor(transactionId: TransactionId) {
    this.transactionId = transactionId;
    this.invoices = [];
    this.payments = [];

    this.status = "未請求";
    this.createdAt = new Date();
  }

  /** 請求を作成して取引を開始する */
  startTransaction(
    invoiceAmount: number,
    invoiceDate: Date,
  ): Transaction {
    const invoice = new Invoice(
      invoiceAmount,
      invoiceDate,
    )

    this.invoices = [
      ...this.invoices,
      invoice,
    ]
    this.status = "請求済み（支払い待ち）";

    return this;
  }

  /** 取引を完了する */
  endTransaction(transactionId: TransactionId): Transaction {
    if (this.transactionId !== transactionId) {
      throw new Error("取引IDが一致しません");
    }

    this.status = "取引完了";
    return this;
  }

  /** 取引の取り消し */
  resetTransaction(transactionId: TransactionId): Transaction {
    if (this.transactionId !== transactionId) {
      throw new Error("取引IDが一致しません");
    }

    this.invoices = [];
    this.payments = [];
    this.status = "未請求";

    return this;
  }

  /** 領収を行う */
  execPayment(
    targetInvoiceId: InvoiceId,
    paymentAmount: number,
  ): Transaction {
    const latestInvoice = this.invoices[this.invoices.length - 1];
    if (!latestInvoice) {
      throw new Error("請求が存在していないため、領収はできません");
    }

    const payment = new Payment(
      targetInvoiceId,
      paymentAmount,
    );
    const totalPaymentAmount = this.payments.reduce(
      (total, payment) => total + payment.paymentAmount,
      0
    ) + paymentAmount;

    this.payments = [...this.payments, payment];

    let status: PaymentStatus;
    if (latestInvoice.invoiceAmount > totalPaymentAmount) {
      status = "未収金あり"
    } else if (latestInvoice.invoiceAmount === totalPaymentAmount) {
      status = "満額領収済み"
    } else {
      status = "過払金あり"
    }
    this.status = status;

    return this;
  }

  /**
   * 最新の請求
   */
  latestInvoice(): Invoice | null {
    const invoice = this.invoices[this.invoices.length - 1];
    return invoice ?? null;
  }
}

