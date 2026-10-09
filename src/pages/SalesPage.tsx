import { useEffect, useMemo, useState } from "react";
import { createSale, deleteSale, getSales } from "../api/sales";
import { getParticipants } from "../api/participants";
import { getProducts } from "../api/products";
import type { AdminUser } from "../api/auth";
import type { Participant } from "../types/participant";
import type { Product } from "../types/product";
import type { Sale } from "../types/sale";
import ParticipantPicker from "../components/ui/ParticipantPicker";
import { formatCurrency } from "../utils/format";

type SalesPageProps = {
  admin: AdminUser;
};

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function paymentMethodLabel(method: Sale["paymentMethod"]) {
  switch (method) {
    case "BANK_TRANSFER":
      return "Bank Transfer";
    case "GCASH":
      return "GCash";
    case "MAYA":
      return "Maya";
    case "CUSTOM":
      return "Custom";
    case "CASH":
      return "Cash";
    default:
      return "";
  }
}

function SalesPage({ admin }: SalesPageProps) {
  const canDeleteSales = admin.role === "OWNER" || admin.role === "ADMIN";
  const [deletingSaleId, setDeletingSaleId] = useState<number | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const [buyerType, setBuyerType] = useState<"PARTICIPANT" | "WALK_IN">(
    "PARTICIPANT",
  );

  const [participantId, setParticipantId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "UNPAID">(
    "UNPAID",
  );
  const [paymentMethod, setPaymentMethod] =
    useState<NonNullable<Sale["paymentMethod"]>>("CASH");
  const [reference, setReference] = useState("");
  const [saleDate, setSaleDate] = useState(getToday());

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    Promise.all([getProducts(), getParticipants(), getSales()])
      .then(([productData, participantData, saleData]) => {
        if (ignore) {
          return;
        }

        setProducts(productData);
        setParticipants(participantData);
        setSales(saleData);
      })
      .catch((err) => {
        if (!ignore) {
          console.error(err);
          setError("Failed to load sales.");
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const activeProducts = useMemo(
    () => products.filter((product) => product.isActive),
    [products],
  );

  const selectedProduct = activeProducts.find(
    (product) => product.id === Number(productId),
  );

  const parsedQuantity = Math.max(0, Number(quantity) || 0);

  const totalAmount = selectedProduct
    ? selectedProduct.price * parsedQuantity
    : 0;

  const todayTotal = sales
    .filter((sale) => sale.saleDate === getToday())
    .reduce((sum, sale) => sum + sale.totalAmount, 0);

  function resetForm() {
    setParticipantId("");
    setCustomerName("");
    setQuantity("1");
    setPaymentStatus(buyerType === "WALK_IN" ? "PAID" : "UNPAID");
    setPaymentMethod("CASH");
    setReference("");
    setSaleDate(getToday());
  }

  async function handleDeleteSale(sale: Sale) {
    const confirmed = window.confirm(
      `Delete sale of ${sale.productName} × ${sale.quantity} for ${
        sale.participantName ?? sale.customerName ?? "Walk-in"
      }?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingSaleId(sale.id);
      setError(null);
      setSuccessMessage(null);

      await deleteSale(sale.id);

      setSales((current) => current.filter((item) => item.id !== sale.id));

      setSuccessMessage(`${sale.productName} sale deleted.`);
    } catch (err) {
      console.error(err);

      setError(err instanceof Error ? err.message : "Failed to delete sale.");
    } finally {
      setDeletingSaleId(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProduct || parsedQuantity < 1) {
      return;
    }

    if (
      buyerType === "PARTICIPANT" &&
      (!participantId || Number(participantId) <= 0)
    ) {
      setError("Select a participant.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const createdSale = await createSale({
        buyerType,
        participantId:
          buyerType === "PARTICIPANT" ? Number(participantId) : null,
        customerName:
          buyerType === "WALK_IN" && customerName.trim()
            ? customerName.trim()
            : null,
        productId: selectedProduct.id,
        quantity: parsedQuantity,
        paymentStatus: buyerType === "WALK_IN" ? "PAID" : paymentStatus,
        paymentMethod:
          buyerType === "WALK_IN" || paymentStatus === "PAID"
            ? paymentMethod
            : null,
        reference:
          (buyerType === "WALK_IN" || paymentStatus === "PAID") &&
          reference.trim()
            ? reference.trim()
            : null,
        saleDate,
      });

      const selectedParticipant =
        buyerType === "PARTICIPANT"
          ? participants.find(
              (participant) => participant.id === Number(participantId),
            )
          : null;

      const participantDisplayName = selectedParticipant
        ? `${selectedParticipant.firstName} ${selectedParticipant.lastName}`.trim() ||
          selectedParticipant.nickname
        : null;

      const displaySale: Sale = {
        ...createdSale,
        productName: createdSale.productName || selectedProduct.name,
        participantName: createdSale.participantName || participantDisplayName,
      };

      setSales((current) => [displaySale, ...current]);

      setSuccessMessage(
        `${selectedProduct.name} × ${parsedQuantity} recorded.`,
      );

      resetForm();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to record sale.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-4 text-sm text-zinc-500">Loading sales...</div>;
  }

  return (
    <div className="p-4">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sales</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Record product sales for participants and walk-in buyers.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs text-zinc-500">Today</p>
          <p className="text-xl font-bold">{formatCurrency(todayTotal)}</p>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      {successMessage && (
        <p className="mb-4 text-sm text-emerald-600 dark:text-emerald-400">
          {successMessage}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">New Sale</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Record the sale in a few steps.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Buyer
              </span>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBuyerType("PARTICIPANT");
                    setCustomerName("");
                    setPaymentStatus("UNPAID");
                  }}
                  className={
                    buyerType === "PARTICIPANT"
                      ? "primary-action rounded-lg px-3 py-2 text-sm font-medium"
                      : "secondary-action rounded-lg px-3 py-2 text-sm font-medium"
                  }
                >
                  Participant
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBuyerType("WALK_IN");
                    setParticipantId("");
                    setPaymentStatus("PAID");
                  }}
                  className={
                    buyerType === "WALK_IN"
                      ? "primary-action rounded-lg px-3 py-2 text-sm font-medium"
                      : "secondary-action rounded-lg px-3 py-2 text-sm font-medium"
                  }
                >
                  Walk-in
                </button>
              </div>
            </div>

            {buyerType === "PARTICIPANT" ? (
              <label className="block">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Participant
                </span>

                <ParticipantPicker
                  participants={participants}
                  selectedParticipantId={participantId}
                  onSelect={setParticipantId}
                  disabled={submitting}
                  placeholder="Search participant..."
                />
              </label>
            ) : (
              <label className="block">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Customer name
                </span>

                <input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Optional"
                  disabled={submitting}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#103f25] dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
            )}

            <label className="block">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Product
              </span>

              <select
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                disabled={submitting}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="">Select product...</option>
                {activeProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} — {formatCurrency(product.price)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Quantity
              </span>

              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                disabled={submitting}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>

            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-950">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-500">Total</span>
                <span className="text-2xl font-bold">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
            {buyerType === "PARTICIPANT" && (
              <>
                <div>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Payment
                  </span>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentStatus("UNPAID")}
                      className={
                        paymentStatus === "UNPAID"
                          ? "primary-action rounded-lg px-3 py-2 text-sm font-medium"
                          : "secondary-action rounded-lg px-3 py-2 text-sm font-medium"
                      }
                    >
                      Unpaid
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentStatus("PAID")}
                      className={
                        paymentStatus === "PAID"
                          ? "primary-action rounded-lg px-3 py-2 text-sm font-medium"
                          : "secondary-action rounded-lg px-3 py-2 text-sm font-medium"
                      }
                    >
                      Paid
                    </button>
                  </div>
                </div>
              </>
            )}

            {paymentStatus === "PAID" && (
              <>
                <label className="block">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Payment method
                  </span>

                  <select
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(
                        event.target.value as NonNullable<
                          Sale["paymentMethod"]
                        >,
                      )
                    }
                    disabled={submitting}
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  >
                    <option value="CASH">Cash</option>
                    <option value="GCASH">GCash</option>
                    <option value="MAYA">Maya</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Reference
                  </span>

                  <input
                    value={reference}
                    onChange={(event) => setReference(event.target.value)}
                    placeholder="Optional"
                    disabled={submitting}
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </label>
              </>
            )}

            <label className="block">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Sale date
              </span>

              <input
                type="date"
                value={saleDate}
                onChange={(event) => setSaleDate(event.target.value)}
                disabled={submitting}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>

            <button
              type="submit"
              disabled={
                submitting ||
                !selectedProduct ||
                parsedQuantity < 1 ||
                (buyerType === "PARTICIPANT" && !participantId)
              }
              className="primary-action w-full rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? "Recording..." : "Record Sale"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Sales History</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Most recent sales first.
            </p>
          </div>

          {sales.length === 0 ? (
            <p className="text-sm text-zinc-500">No sales recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {sales.map((sale) => {
                const buyer =
                  sale.participantName ?? sale.customerName ?? "Walk-in";

                return (
                  <div
                    key={sale.id}
                    className="rounded-xl border border-zinc-200 p-3 py-2.5 dark:border-zinc-800"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {sale.productName} × {sale.quantity}
                        </p>

                        <p className="mt-0.5 text-xs text-zinc-500">{buyer}</p>

                        <p className="mt-0.5 text-[11px] text-zinc-400">
                          {sale.saleDate}
                          {sale.paymentMethod
                            ? ` · ${paymentMethodLabel(sale.paymentMethod)}`
                            : ""}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold">
                          {formatCurrency(sale.totalAmount)}
                        </p>

                        <span
                          className={`mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[11px] ${
                            sale.paymentStatus === "PAID"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          }`}
                        >
                          {sale.paymentStatus}
                        </span>

                        {canDeleteSales && sale.participantId == null && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSale(sale)}
                            disabled={deletingSaleId === sale.id}
                            className="mt-1 block ml-auto text-[11px] text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                          >
                            {deletingSaleId === sale.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default SalesPage;
