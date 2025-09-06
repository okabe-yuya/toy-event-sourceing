async function clearEvents() {
  const transactionId = document.getElementById("transactionId")?.innerText;
  if (!transactionId) {
    return;
  }

  window.alert("reset events: Are you sure? This operation cannot be reversed.")

  try {
    await fetch("http://localhost:8787/api/v1/events/transaction", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transactionId,
      }),
    });


    const eventElement = document.getElementById("events");
    if (eventElement) {
      eventElement.innerHTML = "";
    }

    resetElement();
  } catch (error) {
    console.error("データ取得失敗:", error);
  }
}

async function fetchEvents() {
  // 画面更新時に取引IDの情報が欠損するため、cookieから読み取る
  const transactionId = (await cookieStore.get("transactionId"))?.value;
  if (!transactionId) {
    return;
  }

  try {
    const response = await fetch(`http://localhost:8787/api/events?transactionId=${transactionId}`);
    const data = await response.json();

    const eventElement = document.getElementById("events");
    if (eventElement) {
      const events = data["data"];

      for (let index = 0; index < events.length; index++) {
        const event_ = events[index];

        const wrapperDiv = document.createElement("div");
        wrapperDiv.style.display = "flex";

        const div = document.createElement("div");
        div.innerHTML = `: ${event_["eventName"]}`;


        const button = document.createElement("button");
        button.innerHTML = "replay here";
        button.onclick = () => {
          replay(index);
        }

        wrapperDiv.appendChild(button);
        wrapperDiv.appendChild(div);
        eventElement.appendChild(wrapperDiv);
      }
    }
  } catch (error) {
    console.error("データ取得失敗:", error);
  }
};

async function reFetchEvents() {
  const eventElement = document.getElementById("events");
  if (eventElement) {
    eventElement.innerHTML = "";
    await fetchEvents();
  }
}

async function replay(offset) {
  try {
    const transactionId = document.getElementById("transactionId")?.innerText;
    if (!transactionId) {
      window.alert("something was wrong. please load");
      return;
    }

    const response = await fetch(`http://localhost:8787/api/v1/transaction/replay?offset=${offset}&transactionId=${transactionId}`);
    const data = await response.json();

    const replayInvoiceAmountElement = document.getElementById("replay-invoice-amount");
    const replayInvoiceDateElement = document.getElementById("replay-invoice-date");
    if (replayInvoiceAmountElement && replayInvoiceDateElement) {
      const invoices = data["data"]["invoices"];
      const latestInvoice = invoices[invoices.length - 1];

      if (latestInvoice) {
        replayInvoiceAmountElement.innerText = latestInvoice["invoiceAmount"];
        replayInvoiceDateElement.innerText = latestInvoice["invoiceDate"];
      }
    }

    const replayTotalPaymentAmountElement = document.getElementById("replay-payment-amount");
    if (replayTotalPaymentAmountElement) {
      const payments = data["data"]["payments"];
      const totalPayment = payments.reduce((acc, payment) => acc + payment["paymentAmount"], 0);

      replayTotalPaymentAmountElement.innerText = totalPayment;
    }

    onOpenModal();
  } catch (error) {
    console.error("データ取得失敗:", error);
  }
}

async function fetchLatestTransaction() {
  try {
    // 画面更新時に取引IDの情報が欠損するため、cookieから読み取る
    const transactionId = (await cookieStore.get("transactionId"))?.value;
    if (!transactionId) {
      return;
    }

    const response = await fetch(`http://localhost:8787/api/v1/transaction/latest?transactionId=${transactionId}`);
    const data = await response.json();

    if (Object.keys(data["data"]).length > 0) {
      const transctionIdElement = document.getElementById("transactionId");
      if (transctionIdElement) {
        transctionIdElement.innerText = data["data"]["transactionId"]
      }
      setInvoiceToElement(data["data"]["invoices"]);
      setPaymentToElement(data["data"]["payments"]);
    }
  } catch (error) {
    console.error("データ取得失敗:", error);
  }
}

async function createStartTransactionEvent() {
  const invoiceAmount = document.getElementById("invoiceAmount")?.value;
  const invoiceDate = document.getElementById("invoiceDate")?.value;
  if (!invoiceAmount) {
    window.alert("invoiceAmount is empty");
    return;
  }

  if (!invoiceDate) {
    window.alert("invoiceDate is empty");
    return;
  }

  try {
    const response = await fetch("http://localhost:8787/api/v1/events/transactions/startTransactionEvent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        invoiceAmount,
        invoiceDate,
      }),
    });

    // やり取りのためIDを隠し属性として記録
    const data = await response.json();
    const transctionIdElement = document.getElementById("transactionId");
    if (transctionIdElement) {
      transctionIdElement.innerText = data["data"]["transactionId"]
      await cookieStore.set("transactionId", data["data"]["transactionId"]);
    }

    setInvoiceToElement(data["data"]["invoices"]);
    setPaymentToElement(data["data"]["payments"]);

    await reFetchEvents();
  } catch (error) {
    console.error("データ作成失敗: ", error);
  }
}

async function createPaymentEvent() {
  const paymentAmount = document.getElementById("paymentAmount")?.value;
  if (!paymentAmount) {
    window.alert("paymentAmount is empty");
    return;
  }

  const transactionId = document.getElementById("transactionId")?.innerText;
  if (!transactionId) {
    window.alert("something was wrong. please load");
    return;
  }

  try {
    const response = await fetch("http://localhost:8787/api/v1/events/transactions/paymentEvent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentAmount,
        transactionId,
      }),
    });

    const data = await response.json();
    setPaymentToElement(data["data"]["payments"]);

    await reFetchEvents();
  } catch (error) {
    console.error("データ作成失敗: ", error);
  }
}

async function createResetTransactionEvent() {
  const transactionId = document.getElementById("transactionId")?.innerText;
  if (!transactionId) {
    window.alert("something was wrong. please load");
    return;
  }

  window.alert("reset transaction: Are you sure? This operation cannot be reversed.")

  try {
    await fetch("http://localhost:8787/api/v1/events/transactions/resetTransactionEvent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transactionId,
      }),
    });

    resetElement();
    await reFetchEvents();
  } catch (error) {
    console.error("データ作成失敗: ", error);
  }
}

async function createEndTransactionEvent() {
  const transactionId = document.getElementById("transactionId")?.innerText;
  if (!transactionId) {
    window.alert("something was wrong. please load");
    return;
  }

  try {
    const response = await fetch("http://localhost:8787/api/v1/events/transactions/endTransactionEvent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transactionId,
      }),
    });

    const data = await response.json();
    setInvoiceToElement(data["data"]["invoices"]);
    setPaymentToElement(data["data"]["payments"]);

    await reFetchEvents();
  } catch (error) {
    console.error("データ作成失敗: ", error);
  }
}

function setInvoiceToElement(invoices) {
  if (invoices.length === 0) return;

  const invoiceAmountElement = document.getElementById("dis-invoiceAmount");
  if (invoiceAmountElement) {
    invoiceAmountElement.innerText = invoices[invoices.length - 1]["invoiceAmount"];
  }

  const invoiceDateElement = document.getElementById("dis-invoiceDate");
  if (invoiceDateElement) {
    invoiceDateElement.innerText = invoices[invoices.length - 1]["invoiceDate"];
  }

  document.getElementById("latest-transaction").style.display = "block";
  document.getElementById("invoice-eria").style.display = "none";
  document.getElementById("payment-eria").style.display = "block";
  document.getElementById("transaction-eria").style.display = "block";
}

function setPaymentToElement(payments) {
  if (payments.length === 0) return;

  const totalPaymentElement = document.getElementById("totalPayment");
  if (totalPaymentElement) {
    const totalPayment = payments.reduce((acc, payment) => acc + payment["paymentAmount"], 0);
    totalPaymentElement.innerText = totalPayment;

    const statusElement = document.getElementById("transaction-status");
    if (statusElement) {
      const invoiceAmountElement = document.getElementById("dis-invoiceAmount");
      const invoiceAmount = parseInt(invoiceAmountElement.innerText, 10);

      let status = 'unpaid';
      if (totalPayment > invoiceAmount) {
        status = "overpaid";
      } else if (totalPayment === invoiceAmount) {
        status = "full amount";
      } else {
        status = "outstanding";
      }

      statusElement.innerText = status;
    }
  }
}

function resetElement() {
  const invoiceAmountElement = document.getElementById("dis-invoiceAmount");
  if (invoiceAmountElement) {
    invoiceAmountElement.innerText = "";
  }

  const invoiceDateElement = document.getElementById("dis-invoiceDate");
  if (invoiceDateElement) {
    invoiceDateElement.innerText = "";
  }

  const totalPaymentElement = document.getElementById("totalPayment");
  if (totalPaymentElement) {
    totalPaymentElement.innerText = "";
  }

  document.getElementById("latest-transaction").style.display = "none";
  document.getElementById("invoice-eria").style.display = "block";
  document.getElementById("payment-eria").style.display = "none";
  document.getElementById("transaction-eria").style.display = "none";
}

function onCloseModal() {
  const modal = document.getElementById("replay-modal");
  if (modal) {
    modal.style.display = "none";
  }
}

function onOpenModal() {
  const modal = document.getElementById("replay-modal");
  if (modal) {
    modal.style.display = "block";
  }
}
