import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { toBlob } from "html-to-image";
import { getParticipantLedger } from "../../api/ledger";
import { getOrganizationGcashQR } from "../../api/organization";
import type { Participant } from "../../types/participant";
import type { ParticipantLedger } from "../../types/ledger";
import type { Product } from "../../types/product";
import { blobToDataUrl } from "../../utils/image";
import {
  formatCurrency,
  formatFullName,
  formatLabel,
  formatDate,
} from "../../utils/format";
import {
  createPayment,
  deletePayment,
  correctPayment,
  reversePayment,
  getPaymentCorrections,
  getPaymentAllocations,
} from "../../api/payments";
import type { AdminUser } from "../../api/auth";
import ChargeAdjustmentHistory from "./ChargeAdjustmentHistory";
import type {
  Payment,
  PaymentCorrection,
  PaymentAllocation,
} from "../../types/payment";
import type { Organization } from "../../types/organization";
import type { Charge } from "../../types/charge";

type ParticipantLedgerPanelProps = {
  participant: Participant;
  admin: AdminUser;
  onClose: () => void;
  organization: Organization | null;
  organizationLogo: string | null;
  products: Product[];
  onLedgerChanged?: () => void | Promise<void>;
};

type LedgerStatementProps = {
  participant: Participant;
  periodLabel: string;
  openingBalance: number;
  charges: ParticipantLedger["charges"];
  payments: ParticipantLedger["payments"];
  chargeTotal: number;
  paymentTotal: number;
  closingBalance: number;
  organizationName: string;
  organizationLogo: string | null;
  organizationGcashNumber: string | null;
  organizationGcashQr: string | null;
  products: Product[];
};

type StatementPeriod =
  "THIS_WEEK" | "LAST_7_DAYS" | "THIS_MONTH" | "LAST_30_DAYS" | "FULL_HISTORY";

function getBalanceLabel(balance: number) {
  if (balance > 0) {
    return "Owes";
  }

  if (balance < 0) {
    return "Credit";
  }

  return "Settled";
}

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getStatementRange(period: StatementPeriod) {
  const today = new Date();

  if (period === "FULL_HISTORY") {
    return {
      startDate: null,
      endDate: today,
    };
  }

  if (period === "LAST_30_DAYS") {
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 29);

    return {
      startDate,
      endDate: today,
    };
  }

  if (period === "LAST_7_DAYS") {
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 6);

    return {
      startDate,
      endDate: today,
    };
  }
  if (period === "THIS_WEEK") {
    return {
      startDate: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - today.getDay(),
      ),
      endDate: today,
    };
  }

  return {
    startDate: new Date(today.getFullYear(), today.getMonth(), 1),
    endDate: today,
  };
}

function getStatementPeriodLabel(period: StatementPeriod) {
  if (period === "THIS_WEEK") {
    return "This Week";
  }

  if (period === "LAST_7_DAYS") {
    return "Last 7 Days";
  }

  if (period === "LAST_30_DAYS") {
    return "Last 30 Days";
  }

  if (period === "FULL_HISTORY") {
    return "Full History";
  }

  return "This Month";
}

function getChargeLabel(charge: Charge, products: Product[]) {
  if (charge.feeType === "PRODUCT" && charge.productId != null) {
    return (
      products.find((product) => product.id === charge.productId)?.name ??
      "Product"
    );
  }

  return formatLabel(charge.feeType);
}

function waitForRender() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}
type PaymentReceiptProps = {
  participant: Participant;
  payment: Payment;
  allocations: PaymentAllocation[];
  corrections: PaymentCorrection[];
  organizationName: string;
  organizationLogo: string | null;
  rallyLedgerLogo: string;
  charges: Charge[];
  products: Product[];
};

type ReceiptAllocationLine = {
  chargeDate: string;
  feeType: string;
  amount: number;
  allocationType: PaymentAllocation["allocationType"];
};

function groupAllocationsForReceipt(
  allocations: PaymentAllocation[],
  charges: Charge[],
  products: Product[],
): ReceiptAllocationLine[] {
  return allocations
    .map((allocation) => {
      const charge = charges.find((item) => item.id === allocation.chargeId);

      const feeType =
        charge != null
          ? getChargeLabel(charge, products)
          : formatLabel(allocation.feeType);

      return {
        chargeDate: allocation.chargeDate,
        feeType,
        amount:
          allocation.allocationType === "ALLOCATE"
            ? allocation.amount
            : -allocation.amount,
        allocationType: allocation.allocationType,
      };
    })
    .sort((a, b) => {
      const dateComparison = a.chargeDate.localeCompare(b.chargeDate);
      if (dateComparison !== 0) return dateComparison;

      const typeComparison = a.feeType.localeCompare(b.feeType);
      if (typeComparison !== 0) return typeComparison;

      return a.allocationType.localeCompare(b.allocationType);
    });
}

function PaymentReceipt({
  participant,
  payment,
  allocations,
  corrections,
  organizationName,
  organizationLogo,
  rallyLedgerLogo,
  charges,
  products,
}: PaymentReceiptProps) {
  const allocatedAmount = allocations.reduce(
    (total, allocation) =>
      total +
      (allocation.allocationType === "ALLOCATE"
        ? allocation.amount
        : -allocation.amount),
    0,
  );
  const groupedAllocations = groupAllocationsForReceipt(
    allocations,
    charges,
    products,
  );

  const creditAmount = Math.max(payment.amount - allocatedAmount, 0);

  const isReversed =
    payment.amount === 0 &&
    corrections.some(
      (correction) =>
        correction.newAmount === 0 && correction.previousAmount > 0,
    );

  return (
    <div className="w-[520px] bg-white p-8 text-zinc-950">
      {/* ORGANIZATION HEADER */}
      <div className="border-b border-zinc-200 pb-5">
        <div className="flex items-center gap-3">
          {organizationLogo ? (
            <img
              src={organizationLogo}
              alt=""
              className="h-12 w-12 rounded-lg object-contain"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-950 text-sm font-bold text-white">
              {organizationName.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">
              {organizationName || "RallyLedger"}
            </p>

            <p className="text-xs text-zinc-500">Payment Receipt</p>
          </div>
        </div>
      </div>

      {/* PARTICIPANT */}
      <div className="mt-5">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Participant
        </p>

        <p className="mt-1 text-xl font-bold">
          {formatFullName(participant.firstName, participant.lastName)}
        </p>

        {participant.nickname && (
          <p className="mt-1 text-sm text-zinc-500">{participant.nickname}</p>
        )}
      </div>

      {/* REVERSED STATUS */}
      {isReversed && (
        <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-sm font-bold tracking-wide text-amber-700">
            PAYMENT REVERSED
          </p>
        </div>
      )}

      {/* PAYMENT DETAILS */}
      <div className="mt-5 rounded-lg bg-zinc-50 p-4">
        <div className="grid grid-cols-2 gap-y-3 text-sm">
          <span className="text-zinc-500">Payment Date</span>
          <span className="text-right font-medium">
            {formatDate(payment.paymentDate)}
          </span>

          <span className="text-zinc-500">Payment Method</span>
          <span className="text-right font-medium">
            {formatLabel(payment.paymentMethod)}
          </span>

          {payment.reference && (
            <>
              <span className="text-zinc-500">Reference</span>
              <span className="truncate text-right font-medium">
                {payment.reference}
              </span>
            </>
          )}
        </div>
      </div>

      {/* PAYMENT AMOUNT */}
      <div className="mt-5">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Payment
        </p>

        <div className="mt-2 flex items-end justify-between">
          <span className="text-sm text-zinc-600">Total Paid</span>

          <span className="text-2xl font-bold">
            {formatCurrency(payment.amount)}
          </span>
        </div>
      </div>

      {/* ALLOCATION HISTORY */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Allocation History
          </p>

          <span className="text-xs text-zinc-400">
            {groupedAllocations.length}{" "}
            {groupedAllocations.length === 1 ? "charge" : "charges"}
          </span>
        </div>

        {allocations.length === 0 ? (
          <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
            <p className="text-sm font-medium text-zinc-700">
              No allocation details available.
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              This payment may be available as credit or may not have detailed
              allocation records.
            </p>
          </div>
        ) : (
          <div className="mt-3 divide-y divide-zinc-200 rounded-lg border border-zinc-200">
            {Object.entries(
              groupedAllocations.reduce<
                Record<string, Record<string, ReceiptAllocationLine[]>>
              >((dates, allocation) => {
                const dateKey = allocation.chargeDate;
                const feeKey = allocation.feeType;

                dates[dateKey] ??= {};
                dates[dateKey][feeKey] ??= [];
                dates[dateKey][feeKey].push(allocation);

                return dates;
              }, {}),
            ).map(([date, feeGroups]) => (
              <div
                key={date}
                className="border-b border-zinc-100 px-3 py-3 last:border-b-0"
              >
                <p className="mb-3 text-sm font-bold">{formatDate(date)}</p>

                <div className="space-y-3 pl-3">
                  {Object.entries(feeGroups).map(([feeType, allocations]) => (
                    <div key={feeType}>
                      <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-zinc-900">
                        {feeType}
                      </p>

                      <div className="space-y-2 pl-3">
                        {allocations.map((allocation, index) => (
                          <div
                            key={`${date}-${feeType}-${index}`}
                            className="flex items-center justify-between gap-4"
                          >
                            <span className="text-sm text-zinc-600">
                              {allocation.allocationType === "RELEASE"
                                ? `Release # ${index + 1}`
                                : `${feeType} Fee # ${index + 1}`}
                            </span>

                            <span className="shrink-0 text-sm font-medium text-zinc-950">
                              {formatCurrency(allocation.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CURRENT STATE */}
      {allocations.length > 0 && (
        <div className="mt-5 rounded-lg border border-zinc-200 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Current Applied</span>

            <span className="font-semibold">
              {formatCurrency(allocatedAmount)}
            </span>
          </div>

          {creditAmount > 0 && (
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-zinc-500">Remaining Credit</span>

              <span className="font-semibold text-emerald-700">
                {formatCurrency(creditAmount)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* CORRECTION / REVERSAL HISTORY */}
      {corrections.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Payment History
          </p>

          <div className="mt-3 space-y-3">
            {corrections.map((correction) => {
              const isReversal =
                correction.newAmount === 0 && correction.previousAmount > 0;

              return (
                <div
                  key={correction.id}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">
                      {isReversal ? "Reversal" : "Correction"}
                    </p>

                    <p className="text-xs text-zinc-500">
                      {new Date(correction.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <p className="mt-2 text-sm">
                    {formatCurrency(correction.previousAmount)} →{" "}
                    {formatCurrency(correction.newAmount)}
                  </p>

                  <p className="mt-2 text-xs text-zinc-500">
                    Reason: {correction.reason}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="mt-8 border-t border-zinc-200 pt-5">
        <div className="flex items-center justify-center">
          <img
            src={rallyLedgerLogo}
            alt="RallyLedger"
            className="h-4 w-auto object-contain"
            crossOrigin="anonymous"
          />

          <p className="mt-1 text-center text-[8px] text-zinc-400">
            by kurovin.
          </p>
        </div>
      </div>
    </div>
  );
}

function LedgerStatement({
  participant,
  periodLabel,
  openingBalance,
  charges,
  payments,
  chargeTotal,
  paymentTotal,
  closingBalance,
  organizationName,
  organizationLogo,
  organizationGcashNumber,
  organizationGcashQr,
  products,
}: LedgerStatementProps) {
  const chargesByDate = charges.reduce<Record<string, typeof charges>>(
    (groups, charge) => {
      if (!groups[charge.chargeDate]) {
        groups[charge.chargeDate] = [];
      }

      groups[charge.chargeDate].push(charge);

      return groups;
    },
    {},
  );

  const chargeDateGroups = Object.entries(chargesByDate).sort(
    ([dateA], [dateB]) => dateB.localeCompare(dateA),
  );

  const sortedPayments = [...payments].sort((a, b) =>
    b.paymentDate.localeCompare(a.paymentDate),
  );

  const hasGcash = Boolean(organizationGcashNumber || organizationGcashQr);

  return (
    <div className="w-[700px] bg-white p-8 text-zinc-950">
      {/* HEADER */}
      <div className="border-b border-zinc-200 pb-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {organizationLogo ? (
              <img
                src={organizationLogo}
                alt=""
                className="h-10 w-10 rounded-lg object-contain"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-sm font-bold text-white">
                RL
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {organizationName || "RallyLedger"}
              </p>

              <p className="text-xs text-zinc-500">Powered by RallyLedger</p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">
              Statement
            </p>

            <p className="mt-1 text-sm font-semibold">{periodLabel}</p>
          </div>
        </div>

        <div className="mt-5">
          <h2 className="text-2xl font-bold leading-tight">
            {formatFullName(participant.firstName, participant.lastName)}
          </h2>

          {participant.nickname && (
            <p className="mt-1 text-sm text-zinc-500">{participant.nickname}</p>
          )}

          <p className="mt-2 text-xs text-zinc-500">
            Generated {formatDate(new Date().toISOString().slice(0, 10))}
          </p>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="mt-5 grid grid-cols-4 gap-2">
        <div className="rounded-lg bg-zinc-50 px-3 py-3">
          <p className="text-[11px] font-medium text-zinc-500">Opening</p>

          <p className="mt-1 text-base font-semibold">
            {formatCurrency(openingBalance)}
          </p>
        </div>

        <div className="rounded-lg bg-zinc-50 px-3 py-3">
          <p className="text-[11px] font-medium text-zinc-500">Charges</p>

          <p className="mt-1 text-base font-semibold">
            {formatCurrency(chargeTotal)}
          </p>
        </div>

        <div className="rounded-lg bg-zinc-50 px-3 py-3">
          <p className="text-[11px] font-medium text-zinc-500">Payments</p>

          <p className="mt-1 text-base font-semibold">
            {formatCurrency(paymentTotal)}
          </p>
        </div>

        <div className="rounded-lg bg-zinc-50 px-3 py-3">
          <p className="text-[11px] font-medium text-zinc-500">Balance</p>

          <p className="mt-1 text-base font-semibold">
            {formatCurrency(closingBalance)}
          </p>

          <p className="mt-0.5 text-[10px] text-zinc-400">
            {getBalanceLabel(closingBalance)}
          </p>
        </div>
      </div>

      {/* CHARGE SUMMARY */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Charge Summary
          </h3>

          <span className="text-xs text-zinc-400">
            {charges.length} {charges.length === 1 ? "charge" : "charges"}
          </span>
        </div>

        {charges.length === 0 ? (
          <p className="text-sm text-zinc-500">No charges recorded.</p>
        ) : (
          <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5">
            {Object.entries(
              charges.reduce<Record<string, number>>((totals, charge) => {
                const label =
                  charge.feeType === "PRODUCT" && charge.productId != null
                    ? (products.find(
                        (product) => product.id === charge.productId,
                      )?.name ?? "Product")
                    : formatLabel(charge.feeType);

                totals[label] = (totals[label] ?? 0) + charge.amount;

                return totals;
              }, {}),
            ).map(([label, amount]) => (
              <span key={label} className="text-xs text-zinc-700">
                <span className="font-medium">{label}</span>{" "}
                <span className="font-semibold">{formatCurrency(amount)}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* CHARGES */}
      <div className="mt-5">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Activity
        </h3>

        {chargeDateGroups.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No charge activity for this period.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {chargeDateGroups.map(([date, dateCharges]) => {
              const dateTotal = dateCharges.reduce(
                (sum, charge) => sum + charge.amount,
                0,
              );

              return (
                <div
                  key={date}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold">{formatDate(date)}</p>

                    <p className="text-xs font-semibold">
                      {formatCurrency(dateTotal)}
                    </p>
                  </div>

                  <div className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-0.5">
                    {dateCharges.map((charge) => {
                      const label =
                        charge.feeType === "PRODUCT" && charge.productId != null
                          ? (products.find(
                              (product) => product.id === charge.productId,
                            )?.name ?? "Product")
                          : formatLabel(charge.feeType);

                      return (
                        <span
                          key={charge.id}
                          className="text-[11px] leading-4 text-zinc-600"
                        >
                          {label}{" "}
                          <span className="font-medium text-zinc-900">
                            {formatCurrency(charge.amount)}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PAYMENTS */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Payments
          </h3>

          <span className="text-xs text-zinc-400">
            {payments.length} {payments.length === 1 ? "payment" : "payments"}
          </span>
        </div>

        {sortedPayments.length === 0 ? (
          <p className="text-sm text-zinc-500">No payments recorded.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {sortedPayments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">
                      {formatDate(payment.paymentDate)}
                    </p>

                    <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                      {formatLabel(payment.paymentMethod)}
                      {payment.reference ? ` · ${payment.reference}` : ""}
                    </p>
                  </div>

                  <p className="shrink-0 text-xs font-semibold">
                    {formatCurrency(payment.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FINAL BALANCE */}
      <div className="mt-5 flex items-center justify-between border-t border-zinc-200 pt-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Closing Balance
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {getBalanceLabel(closingBalance)}
          </p>
        </div>

        <p className="text-2xl font-bold">{formatCurrency(closingBalance)}</p>
      </div>

      {/* GCASH */}
      {hasGcash && (
        <div className="mt-5 border-t border-zinc-200 pt-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Pay via GCash
              </p>

              {organizationGcashNumber && (
                <p className="mt-1 text-sm font-semibold">
                  {organizationGcashNumber}
                </p>
              )}

              <p className="mt-0.5 text-xs text-zinc-500">
                Scan to pay or use the number above.
              </p>
            </div>

            {organizationGcashQr && (
              <img
                src={organizationGcashQr}
                alt="GCash payment QR"
                className="h-24 w-24 shrink-0 object-contain"
                crossOrigin="anonymous"
              />
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="mt-5 border-t border-zinc-200 pt-3 text-center text-[10px] text-zinc-400">
        <div className="mt-8 border-t border-zinc-800 pt-5">
          <div className="flex items-center justify-center">
            <img
              src="/branding/login-light-horizontal.png"
              alt="RallyLedger"
              className="h-4 w-auto object-contain"
              crossOrigin="anonymous"
            />
            <p className="mt-1 text-center text-[8px] text-zinc-400">
              by kurovin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ParticipantLedgerPanel({
  participant,
  admin,
  onClose,
  organization,
  organizationLogo,
  products,
  onLedgerChanged,
}: ParticipantLedgerPanelProps) {
  const canCorrectPayments = admin.role === "OWNER" || admin.role === "ADMIN";
  const canDeletePayments = admin.role === "OWNER" || admin.role === "ADMIN";
  const [ledger, setLedger] = useState<ParticipantLedger | null>(null);
  const [organizationGcashQr, setOrganizationGcashQr] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [reference, setReference] = useState("");
  const [paymentDate, setPaymentDate] = useState(getTodayDate());
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [expandedChargeDate, setExpandedChargeDate] = useState<string | null>(
    null,
  );
  const [sharingLedger, setSharingLedger] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [renderStatement, setRenderStatement] = useState(false);
  const [statementPeriod, setStatementPeriod] =
    useState<StatementPeriod>("THIS_MONTH");
  const statementPeriodLabel = getStatementPeriodLabel(statementPeriod);

  const statementRef = useRef<HTMLDivElement | null>(null);
  const [showChargeDetails, setShowChargeDetails] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [correctingPaymentId, setCorrectingPaymentId] = useState<number | null>(
    null,
  );
  const [correctionAmount, setCorrectionAmount] = useState("");
  const [correctionMethod, setCorrectionMethod] = useState("CASH");
  const [correctionReference, setCorrectionReference] = useState("");
  const [correctionDate, setCorrectionDate] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionError, setCorrectionError] = useState<string | null>(null);
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [reversingPaymentId, setReversingPaymentId] = useState<number | null>(
    null,
  );
  const [reversalReason, setReversalReason] = useState("");
  const [reversalError, setReversalError] = useState<string | null>(null);
  const [submittingReversal, setSubmittingReversal] = useState(false);

  const [paymentCorrections, setPaymentCorrections] = useState<
    Record<number, PaymentCorrection[]>
  >({});
  const [paymentAllocations, setPaymentAllocations] = useState<
    Record<number, PaymentAllocation[]>
  >({});
  const [expandedPaymentAllocations, setExpandedPaymentAllocations] = useState<
    Record<number, boolean>
  >({});
  const [loadingPaymentAllocations, setLoadingPaymentAllocations] = useState<
    Record<number, boolean>
  >({});
  const [expandedPaymentCorrections, setExpandedPaymentCorrections] = useState<
    Record<number, boolean>
  >({});
  const [loadingPaymentCorrections, setLoadingPaymentCorrections] = useState<
    Record<number, boolean>
  >({});
  const [renderPaymentReceipt, setRenderPaymentReceipt] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [receiptAllocations, setReceiptAllocations] = useState<
    PaymentAllocation[]
  >([]);
  const [receiptCorrections, setReceiptCorrections] = useState<
    PaymentCorrection[]
  >([]);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);

  const paymentReceiptRef = useRef<HTMLDivElement | null>(null);

  async function loadLedger() {
    try {
      const data = await getParticipantLedger(participant.id);

      setLedger(data);
      setPaymentError(null);
    } catch (err) {
      console.error(err);
      setPaymentError("Failed to refresh ledger");
    }
  }

  useEffect(() => {
    let ignore = false;

    async function loadLedgerData() {
      try {
        const [ledgerData, qrBlob] = await Promise.all([
          getParticipantLedger(participant.id),
          getOrganizationGcashQR(),
        ]);

        if (ignore) {
          return;
        }

        setLedger(ledgerData);
        setError(null);

        if (qrBlob) {
          setOrganizationGcashQr(await blobToDataUrl(qrBlob));
        } else {
          setOrganizationGcashQr(null);
        }

        setLoading(false);
      } catch (err) {
        if (!ignore) {
          console.error(err);
          setError("Failed to load ledger");
          setLoading(false);
        }
      }
    }

    void loadLedgerData();

    return () => {
      ignore = true;
    };
  }, [participant.id]);

  async function handlePaymentSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const paymentAmount = Number(amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      setPaymentError("Payment amount must be greater than zero.");
      return;
    }

    if (!paymentDate) {
      setPaymentError("Please select a payment date.");
      return;
    }

    try {
      setSubmittingPayment(true);
      setPaymentError(null);

      await createPayment({
        participantId: participant.id,
        amount: paymentAmount,
        paymentMethod,
        reference: reference.trim() || null,
        paymentDate,
      });

      await loadLedger();
      await onLedgerChanged?.();

      setAmount("");
      setPaymentMethod("CASH");
      setReference("");
      setPaymentDate(getTodayDate());
      setShowPaymentForm(false);
    } catch (err) {
      console.error(err);
      setPaymentError("Failed to record payment");
    } finally {
      setSubmittingPayment(false);
    }
  }
  async function handleDeletePayment(paymentId: number) {
    const confirmed = window.confirm("Delete this payment?");

    if (!confirmed) {
      return;
    }

    try {
      setPaymentError(null);

      await deletePayment(paymentId);
      await loadLedger();
      await onLedgerChanged?.();
    } catch (err) {
      console.error(err);
      setPaymentError("Failed to delete payment");
    }
  }

  async function handleCorrectPayment(payment: Payment) {
    if (!canCorrectPayments) {
      return;
    }

    const correctedAmount = Number(correctionAmount);

    if (!Number.isFinite(correctedAmount) || correctedAmount <= 0) {
      setCorrectionError("Amount must be greater than zero.");
      return;
    }

    if (!correctionDate) {
      setCorrectionError("Please select a payment date.");
      return;
    }

    if (!correctionReason.trim()) {
      setCorrectionError("A correction reason is required.");
      return;
    }

    try {
      setSubmittingCorrection(true);
      setCorrectionError(null);

      const updatedPayment = await correctPayment(payment.id, {
        amount: correctedAmount,
        paymentMethod: correctionMethod,
        reference: correctionReference.trim() || null,
        paymentDate: correctionDate,
        reason: correctionReason.trim(),
      });

      setLedger((current) =>
        current
          ? {
              ...current,
              payments: current.payments.map((item) =>
                item.id === updatedPayment.id ? updatedPayment : item,
              ),
            }
          : current,
      );

      const corrections = await getPaymentCorrections(payment.id);

      setPaymentCorrections((current) => ({
        ...current,
        [payment.id]: corrections,
      }));
      setPaymentAllocations((current) => {
        const next = { ...current };
        delete next[payment.id];
        return next;
      });

      setReversingPaymentId(null);

      setCorrectingPaymentId(null);
      setCorrectionError(null);

      if (onLedgerChanged) {
        await onLedgerChanged();
      }
    } catch (err) {
      console.error(err);

      setCorrectionError(
        err instanceof Error ? err.message : "Failed to correct payment",
      );
    } finally {
      setSubmittingCorrection(false);
    }
  }
  async function handleReversePayment(payment: Payment) {
    if (!canCorrectPayments) {
      return;
    }

    if (!reversalReason.trim()) {
      setReversalError("A reversal reason is required.");
      return;
    }

    setSubmittingReversal(true);
    setReversalError(null);

    try {
      const updatedPayment = await reversePayment(payment.id, {
        reason: reversalReason.trim(),
      });

      setLedger((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          payments: current.payments.map((item) =>
            item.id === updatedPayment.id ? updatedPayment : item,
          ),
        };
      });

      const corrections = await getPaymentCorrections(payment.id);
      setPaymentCorrections((current) => ({
        ...current,
        [payment.id]: corrections,
      }));
      setPaymentAllocations((current) => {
        const next = { ...current };
        delete next[payment.id];
        return next;
      });

      setReversingPaymentId(null);
      setReversalReason("");
      setReversalError(null);
    } catch {
      setReversalError("Failed to reverse payment");
    } finally {
      setSubmittingReversal(false);
    }
  }

  async function togglePaymentAllocations(paymentId: number) {
    const isExpanded = expandedPaymentAllocations[paymentId];

    if (isExpanded) {
      setExpandedPaymentAllocations((current) => ({
        ...current,
        [paymentId]: false,
      }));
      return;
    }

    if (paymentAllocations[paymentId]) {
      setExpandedPaymentAllocations((current) => ({
        ...current,
        [paymentId]: true,
      }));
      return;
    }

    setLoadingPaymentAllocations((current) => ({
      ...current,
      [paymentId]: true,
    }));

    try {
      const allocations = await getPaymentAllocations(paymentId);

      setPaymentAllocations((current) => ({
        ...current,
        [paymentId]: allocations,
      }));

      setExpandedPaymentAllocations((current) => ({
        ...current,
        [paymentId]: true,
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPaymentAllocations((current) => ({
        ...current,
        [paymentId]: false,
      }));
    }
  }

  async function togglePaymentCorrections(paymentId: number) {
    const isExpanded = expandedPaymentCorrections[paymentId];

    if (isExpanded) {
      setExpandedPaymentCorrections((current) => ({
        ...current,
        [paymentId]: false,
      }));
      return;
    }

    if (paymentCorrections[paymentId]) {
      setExpandedPaymentCorrections((current) => ({
        ...current,
        [paymentId]: true,
      }));
      return;
    }

    setLoadingPaymentCorrections((current) => ({
      ...current,
      [paymentId]: true,
    }));

    try {
      const corrections = await getPaymentCorrections(paymentId);

      setPaymentCorrections((current) => ({
        ...current,
        [paymentId]: corrections,
      }));

      setExpandedPaymentCorrections((current) => ({
        ...current,
        [paymentId]: true,
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPaymentCorrections((current) => ({
        ...current,
        [paymentId]: false,
      }));
    }
  }

  function buildLedgerStatement() {
    if (!ledger) {
      return "";
    }

    const chargeLines = statementCharges.map(
      (charge) =>
        `${formatDate(charge.chargeDate)} — ${getChargeLabel(charge, products)}: ${formatCurrency(charge.amount)}`,
    );
    const chargeTypeLines = Object.entries(chargesByType)
      .sort(([typeA], [typeB]) => typeA.localeCompare(typeB))
      .map(
        ([feeType, amount]) =>
          `${formatLabel(feeType)}: ${formatCurrency(amount)}`,
      );

    const chargeDateLines = Object.entries(chargesByDate)
      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
      .map(
        ([date, amount]) => `${formatDate(date)}: ${formatCurrency(amount)}`,
      );

    const paymentLines = statementPayments.map((payment) => {
      const reference = payment.reference ? ` (${payment.reference})` : "";

      return `${formatDate(payment.paymentDate)} — ${formatLabel(payment.paymentMethod)}: ${formatCurrency(payment.amount)}${reference}`;
    });

    return [
      "RALLYLEDGER",
      "",
      `Participant: ${formatFullName(participant.firstName, participant.lastName)}`,
      participant.nickname ? `Nickname: ${participant.nickname}` : null,
      `Period: ${statementPeriodLabel}`,
      "",
      `Opening Balance: ${formatCurrency(openingBalance)} (${getBalanceLabel(openingBalance)})`,
      `Charges This Period: ${formatCurrency(statementChargeTotal)}`,
      `Payments This Period: ${formatCurrency(statementPaymentTotal)}`,
      `Closing Balance: ${formatCurrency(closingBalance)} (${getBalanceLabel(closingBalance)})`,
      "",
      "CHARGES BY TYPE",
      ...(chargeTypeLines.length > 0
        ? chargeTypeLines
        : ["No charges recorded."]),
      "",
      "CHARGES BY DATE",
      ...(chargeDateLines.length > 0
        ? chargeDateLines
        : ["No charges recorded."]),
      "",
      "CHARGES",
      ...(chargeLines.length > 0 ? chargeLines : ["No charges recorded."]),
      "",
      "PAYMENTS",
      ...(paymentLines.length > 0 ? paymentLines : ["No payments recorded."]),
      "",
      `Generated: ${formatDate(getTodayDate())}`,
    ]
      .filter((line): line is string => line !== null)
      .join("\n");
  }

  async function generatePaymentReceiptPng(payment: Payment) {
    if (!paymentReceiptRef.current) {
      return null;
    }

    const blob = await toBlob(paymentReceiptRef.current, {
      cacheBust: true,
      pixelRatio: 2,
    });

    if (!blob) {
      return null;
    }

    const safeName = `${participant.firstName}-${participant.lastName}`
      .toLowerCase()
      .replaceAll(" ", "-");

    return new File(
      [blob],
      `rallyledger-payment-${payment.id}-${safeName}.png`,
      {
        type: "image/png",
      },
    );
  }

  async function generateLedgerPng() {
    if (!statementRef.current) {
      return null;
    }

    const blob = await toBlob(statementRef.current, {
      cacheBust: true,
      pixelRatio: 2,
    });

    if (!blob) {
      return null;
    }

    const safeName = `${participant.firstName}-${participant.lastName}`
      .toLowerCase()
      .replaceAll(" ", "-");

    return new File([blob], `rallyledger-${safeName}.png`, {
      type: "image/png",
    });
  }

  async function handlePaymentReceipt(payment: Payment) {
    try {
      setGeneratingReceipt(true);
      setShareMessage(null);

      const [allocations, corrections] = await Promise.all([
        getPaymentAllocations(payment.id),
        getPaymentCorrections(payment.id),
      ]);

      setReceiptPayment(payment);
      setReceiptAllocations(allocations);
      setReceiptCorrections(corrections);
      setRenderPaymentReceipt(true);

      await waitForRender();

      const pngFile = await generatePaymentReceiptPng(payment);

      if (!pngFile) {
        setShareMessage("Failed to generate payment receipt.");
        return;
      }

      if (
        navigator.share &&
        navigator.canShare?.({
          files: [pngFile],
        })
      ) {
        await navigator.share({
          title: "RallyLedger Payment Receipt",
          text: `Payment receipt for ${formatFullName(
            participant.firstName,
            participant.lastName,
          )}`,
          files: [pngFile],
        });

        return;
      }

      const url = URL.createObjectURL(pngFile);

      const link = document.createElement("a");
      link.href = url;
      link.download = pngFile.name;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      setShareMessage("Payment receipt saved.");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }

      console.error(err);
      setShareMessage("Failed to generate payment receipt.");
    } finally {
      setGeneratingReceipt(false);
      setRenderPaymentReceipt(false);
      setReceiptPayment(null);
      setReceiptAllocations([]);
      setReceiptCorrections([]);
    }
  }
  async function handleShareLedgerPng() {
    if (!ledger) {
      return;
    }

    try {
      setSharingLedger(true);
      setShareMessage(null);
      setRenderStatement(true);

      await waitForRender();

      const pngFile = await generateLedgerPng();

      if (!pngFile) {
        setShareMessage("Failed to generate ledger PNG.");
        return;
      }

      if (
        navigator.share &&
        navigator.canShare?.({
          files: [pngFile],
        })
      ) {
        await navigator.share({
          title: "RallyLedger Participant Ledger",
          text: `Ledger statement for ${formatFullName(
            participant.firstName,
            participant.lastName,
          )}`,
          files: [pngFile],
        });

        return;
      }

      const url = URL.createObjectURL(pngFile);

      const link = document.createElement("a");
      link.href = url;
      link.download = pngFile.name;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      setShareMessage("Ledger PNG saved.");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }

      console.error(err);
      setShareMessage("Failed to share ledger PNG.");
    } finally {
      setSharingLedger(false);
      setRenderStatement(false);
    }
  }

  async function handleCopyLedgerText() {
    try {
      setShareMessage(null);

      const text = buildLedgerStatement();

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);

        setShareMessage("Ledger text copied.");
        return;
      }

      const textArea = document.createElement("textarea");

      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";

      document.body.appendChild(textArea);

      textArea.focus();
      textArea.select();

      const copied = document.execCommand("copy");

      document.body.removeChild(textArea);

      if (!copied) {
        throw new Error("Clipboard copy failed");
      }

      setShareMessage("Ledger text copied.");
    } catch (err) {
      console.error(err);
      setShareMessage("Failed to copy ledger text.");
    }
  }

  if (loading) {
    return (
      <div className="mb-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <p className="text-zinc-600 dark:text-zinc-400">Loading ledger...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <p className="text-red-400">{error}</p>

        <button
          type="button"
          onClick={onClose}
          className="danger-action mt-3 text-sm text-zinc-600 dark:text-zinc-400"
        >
          Close
        </button>
      </div>
    );
  }

  if (!ledger) {
    return null;
  }

  const { startDate, endDate } = getStatementRange(statementPeriod);

  function toLocalDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function isBeforeStart(dateValue: string) {
    if (!startDate) return false;

    return dateValue.slice(0, 10) < toLocalDateKey(startDate);
  }

  function isWithinStatementPeriod(dateValue: string) {
    const dateKey = dateValue.slice(0, 10);
    const endKey = toLocalDateKey(endDate);
    const startKey = startDate ? toLocalDateKey(startDate) : null;

    return dateKey <= endKey && (!startKey || dateKey >= startKey);
  }
  const openingCharges = ledger.charges
    .filter((charge) => isBeforeStart(charge.chargeDate))
    .reduce((total, charge) => total + charge.amount, 0);

  const openingPayments = ledger.payments
    .filter((payment) => isBeforeStart(payment.paymentDate))
    .reduce((total, payment) => total + payment.amount, 0);

  const openingBalance = openingCharges - openingPayments;

  const statementCharges = ledger.charges.filter((charge) =>
    isWithinStatementPeriod(charge.chargeDate),
  );

  const statementPayments = ledger.payments
    .filter((payment) => isWithinStatementPeriod(payment.paymentDate))
    .sort((a, b) => {
      const dateComparison = b.paymentDate
        .slice(0, 10)
        .localeCompare(a.paymentDate.slice(0, 10));

      if (dateComparison !== 0) {
        return dateComparison;
      }

      return b.id - a.id;
    });

  const statementChargeTotal = statementCharges.reduce(
    (total, charge) => total + charge.amount,
    0,
  );

  const statementPaymentTotal = statementPayments.reduce(
    (total, payment) => total + payment.amount,
    0,
  );

  const closingBalance =
    openingBalance + statementChargeTotal - statementPaymentTotal;

  const chargesByType = statementCharges.reduce<Record<string, number>>(
    (totals, charge) => {
      totals[charge.feeType] = (totals[charge.feeType] ?? 0) + charge.amount;

      return totals;
    },
    {},
  );

  const chargesByDate = statementCharges.reduce<Record<string, number>>(
    (totals, charge) => {
      totals[charge.chargeDate] =
        (totals[charge.chargeDate] ?? 0) + charge.amount;

      return totals;
    },
    {},
  );

  return (
    <div className="mx-auto mb-6 max-w-6xl rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Ledger</p>

          <h2
            className="truncate text-xl font-semibold"
            title={formatFullName(participant.firstName, participant.lastName)}
          >
            {formatFullName(participant.firstName, participant.lastName)}
          </h2>

          {participant.nickname && (
            <p
              className="mt-1 truncate text-sm text-zinc-500"
              title={participant.nickname}
            >
              {participant.nickname}
            </p>
          )}

          <div className="mt-4">
            <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Period
            </label>

            <select
              value={statementPeriod}
              onChange={(event) =>
                setStatementPeriod(event.target.value as StatementPeriod)
              }
              className="mt-2 secondary-action rounded-lg px-3 py-2 text-sm"
            >
              <option value="THIS_WEEK">This Week</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
              <option value="FULL_HISTORY">Full History</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <button
            type="button"
            onClick={handleShareLedgerPng}
            disabled={sharingLedger}
            className="secondary-action rounded-lg px-3 py-2 text-sm"
          >
            {sharingLedger ? "Preparing..." : "Share as PNG"}
          </button>

          <button
            type="button"
            onClick={handleCopyLedgerText}
            className="secondary-action rounded-lg px-3 py-2 text-sm"
          >
            Copy as Text
          </button>

          <button
            type="button"
            onClick={() => setShowPaymentForm(true)}
            className="primary-action rounded-lg px-3 py-2 text-sm"
          >
            Add Payment
          </button>

          <button
            type="button"
            onClick={onClose}
            className="danger-action rounded-lg border border-red-900 px-3 py-2 text-sm text-red-400"
          >
            Close
          </button>
        </div>
      </div>
      {showPaymentForm && (
        <form
          onSubmit={handlePaymentSubmit}
          className="mt-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4"
        >
          <h3 className="mb-4 font-semibold">Record Payment</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Amount
              </span>

              <input
                type="number"
                min="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
              />
            </label>

            <label>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Payment Method
              </span>

              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
              >
                <option value="CASH">Cash</option>
                <option value="GCASH">GCash</option>
                <option value="MAYA">Maya</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </label>

            <label>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Payment Date
              </span>

              <input
                type="date"
                required
                max={getTodayDate()}
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>

            <label>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Reference
              </span>

              <input
                type="text"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
              />
            </label>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={submittingPayment}
              className="primary-action rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {submittingPayment ? "Recording..." : "Record Payment"}
            </button>

            <button
              type="button"
              onClick={() => setShowPaymentForm(false)}
              className="transition-colors rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {paymentError && (
        <p className="mt-4 text-sm text-red-400">{paymentError}</p>
      )}
      {shareMessage && (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          {shareMessage}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 p-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Opening Balance
          </p>

          <p className="mt-1 text-xl font-semibold">
            {formatCurrency(openingBalance)}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {getBalanceLabel(openingBalance)}
          </p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 p-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Charges</p>

          <p className="mt-1 text-xl font-semibold">
            {formatCurrency(statementChargeTotal)}
          </p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 p-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Payments</p>

          <p className="mt-1 text-xl font-semibold">
            {formatCurrency(statementPaymentTotal)}
          </p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 p-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Closing Balance
          </p>

          <p className="mt-1 text-xl font-semibold">
            {formatCurrency(closingBalance)}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {getBalanceLabel(closingBalance)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 p-4">
          <h3 className="font-semibold">Charges by Type</h3>
          <div className="mt-3 space-y-2">
            {Object.entries(chargesByType).length === 0 ? (
              <p className="text-sm text-zinc-500">No charges yet.</p>
            ) : (
              Object.entries(chargesByType).map(([feeType, amount]) => (
                <div
                  key={feeType}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {formatLabel(feeType)}
                  </span>

                  <span className="font-medium">{formatCurrency(amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 p-4">
          <h3 className="font-semibold">Charges by Date</h3>

          <div className="mt-3 space-y-2">
            {Object.entries(chargesByDate).length === 0 ? (
              <p className="text-sm text-zinc-500">No charges yet.</p>
            ) : (
              Object.entries(chargesByDate)
                .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                .map(([date, amount]) => {
                  const dateCharges = statementCharges.filter(
                    (charge) => charge.chargeDate === date,
                  );

                  const isExpanded = expandedChargeDate === date;

                  return (
                    <div
                      key={formatDate(date)}
                      className="rounded-lg bg-white dark:bg-zinc-900"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedChargeDate(isExpanded ? null : date)
                        }
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm"
                      >
                        <span className="text-zinc-600 dark:text-zinc-400">
                          {formatDate(date)}
                        </span>

                        <div className="flex items-center gap-3">
                          <span className="font-medium">
                            {formatCurrency(amount)}
                          </span>

                          <span className="text-xs text-zinc-500">
                            {isExpanded ? "▲" : "▼"}
                          </span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-zinc-200 dark:border-zinc-800 px-3 py-2">
                          <div className="space-y-2">
                            {dateCharges.map((charge) => (
                              <div
                                key={charge.id}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="text-zinc-500">
                                  {getChargeLabel(charge, products)}
                                </span>

                                <span>{formatCurrency(charge.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
      <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setShowChargeDetails((current) => !current)}
          className="flex w-full items-center justify-between gap-4 bg-zinc-50 px-4 py-3 text-left transition-colors hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-800"
        >
          <div>
            <p className="font-semibold">Charge Details</p>

            <p className="mt-1 text-xs text-zinc-500">
              {statementCharges.length}{" "}
              {statementCharges.length === 1 ? "charge" : "charges"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-semibold">
              {formatCurrency(statementChargeTotal)}
            </span>

            <span className="text-xs text-zinc-500">
              {showChargeDetails ? "▲" : "▼"}
            </span>
          </div>
        </button>

        {showChargeDetails && (
          <div>
            {/* DESKTOP HEADER */}
            <div className="hidden grid-cols-[minmax(0,1fr)_160px_120px] gap-4 border-t border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 md:grid">
              <span>Type</span>
              <span>Date</span>
              <span className="text-right">Amount</span>
            </div>

            {statementCharges.length === 0 ? (
              <p className="border-t border-zinc-200 px-4 py-4 text-sm text-zinc-500 dark:border-zinc-800">
                No charges recorded.
              </p>
            ) : (
              statementCharges.map((charge) => (
                <div
                  key={charge.id}
                  className="border-t border-zinc-200 bg-white px-4 py-3 text-left dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 md:grid-cols-[minmax(0,1fr)_160px_120px]">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {getChargeLabel(charge, products)}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500 md:hidden">
                        {formatDate(charge.chargeDate)}
                      </p>
                    </div>

                    <p className="hidden text-sm text-zinc-500 md:block">
                      {formatDate(charge.chargeDate)}
                    </p>

                    <p className="text-right font-semibold">
                      {formatCurrency(charge.amount)}
                    </p>
                  </div>

                  <ChargeAdjustmentHistory chargeId={charge.id} />
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setShowPaymentDetails((current) => !current)}
          className="flex w-full items-center justify-between gap-4 bg-zinc-50 px-4 py-3 text-left transition-colors hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-800"
        >
          <div>
            <p className="font-semibold">Payments</p>

            <p className="mt-1 text-xs text-zinc-500">
              {statementPayments.length}{" "}
              {statementPayments.length === 1 ? "payment" : "payments"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-semibold">
              {formatCurrency(statementPaymentTotal)}
            </span>

            <span className="text-xs text-zinc-500">
              {showPaymentDetails ? "▲" : "▼"}
            </span>
          </div>
        </button>

        {showPaymentDetails && (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {statementPayments.length === 0 ? (
              <p className="px-4 py-4 text-sm text-zinc-500">
                No payments yet.
              </p>
            ) : (
              statementPayments.map((payment) => {
                const corrections = paymentCorrections[payment.id] ?? [];
                const isCorrecting = correctingPaymentId === payment.id;
                const isCorrectionHistoryExpanded =
                  expandedPaymentCorrections[payment.id] ?? false;

                return (
                  <div
                    key={payment.id}
                    className="bg-white px-4 py-4 dark:bg-zinc-900"
                  >
                    {/* Payment summary */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 text-left">
                        <p className="font-medium">
                          {formatLabel(payment.paymentMethod)}
                        </p>

                        <p className="text-xs text-zinc-500">
                          {formatDate(payment.paymentDate)}
                        </p>

                        {payment.reference && (
                          <p className="mt-1 truncate text-xs text-zinc-500">
                            Ref: {payment.reference}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {payment.amount === 0 && (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                            REVERSED
                          </span>
                        )}

                        <p className="font-semibold">
                          {formatCurrency(payment.amount)}
                        </p>
                        {canCorrectPayments && (
                          <button
                            type="button"
                            onClick={() => {
                              setCorrectingPaymentId(payment.id);
                              setCorrectionAmount(String(payment.amount));
                              setCorrectionMethod(payment.paymentMethod);
                              setCorrectionReference(payment.reference ?? "");
                              setCorrectionDate(payment.paymentDate);
                              setCorrectionReason("");
                              setCorrectionError(null);
                            }}
                            className="secondary-action rounded-md px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
                          >
                            Correct
                          </button>
                        )}

                        {canCorrectPayments && payment.amount > 0 && (
                          <button
                            type="button"
                            className="rounded-md border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
                            onClick={() => {
                              setReversingPaymentId(payment.id);
                              setReversalReason("");
                              setReversalError(null);
                              setCorrectingPaymentId(null);
                            }}
                          >
                            Reverse
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void handlePaymentReceipt(payment)}
                          disabled={generatingReceipt}
                          className="text-xs text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white disabled:opacity-50"
                        >
                          Receipt
                        </button>

                        {canDeletePayments && (
                          <button
                            type="button"
                            onClick={() => void handleDeletePayment(payment.id)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    {(() => {
                      const allocations = paymentAllocations[payment.id] ?? [];

                      const allocatedAmount = allocations.reduce(
                        (total, allocation) =>
                          total +
                          (allocation.allocationType === "ALLOCATE"
                            ? allocation.amount
                            : -allocation.amount),
                        0,
                      );

                      const creditAmount = Math.max(
                        payment.amount - allocatedAmount,
                        0,
                      );

                      const hasAllocations = allocations.length > 0;
                      const isExpanded =
                        expandedPaymentAllocations[payment.id] ?? false;
                      const isLoading =
                        loadingPaymentAllocations[payment.id] ?? false;

                      return (
                        <div className="mt-3">
                          {hasAllocations && (
                            <div className="mt-2 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-950">
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                                <span className="text-zinc-600 dark:text-zinc-400">
                                  Applied{" "}
                                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                    {formatCurrency(allocatedAmount)}
                                  </span>
                                </span>

                                {creditAmount > 0 ? (
                                  <span className="text-zinc-600 dark:text-zinc-400">
                                    Credit{" "}
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                      {formatCurrency(creditAmount)}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                    Fully applied
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              void togglePaymentAllocations(payment.id)
                            }
                            className="mt-2 text-xs font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
                          >
                            {isLoading
                              ? "Loading allocation details..."
                              : isExpanded
                                ? "Hide allocation details ▲"
                                : "View allocation details ▼"}
                          </button>

                          {isExpanded && (
                            <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                              {allocations.length === 0 ? (
                                <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                                  <p className="text-sm font-medium text-zinc-700">
                                    Detailed allocation tracking was not
                                    available for this payment.
                                  </p>
                                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                                    This payment was recorded before detailed
                                    payment allocation tracking was introduced.
                                  </p>
                                </div>
                              ) : (
                                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                  {allocations.map((allocation) => {
                                    const isRelease =
                                      allocation.allocationType === "RELEASE";

                                    return (
                                      <div
                                        key={allocation.id}
                                        className="flex items-center justify-between gap-4 px-3 py-3"
                                      >
                                        <div className="min-w-0">
                                          <p className="text-xs font-semibold">
                                            {(() => {
                                              const charge =
                                                ledger?.charges.find(
                                                  (item) =>
                                                    item.id ===
                                                    allocation.chargeId,
                                                );

                                              return charge
                                                ? getChargeLabel(
                                                    charge,
                                                    products,
                                                  )
                                                : formatLabel(
                                                    allocation.feeType,
                                                  );
                                            })()}
                                          </p>

                                          <p className="mt-1 text-[11px] text-zinc-500">
                                            {formatDate(allocation.chargeDate)}
                                            {" · "}
                                            {isRelease
                                              ? "Released"
                                              : "Allocated"}
                                          </p>
                                        </div>

                                        <p
                                          className={`shrink-0 text-xs font-semibold ${
                                            isRelease
                                              ? "text-amber-600 dark:text-amber-400"
                                              : "text-zinc-900 dark:text-zinc-100"
                                          }`}
                                        >
                                          {isRelease ? "-" : "+"}
                                          {formatCurrency(allocation.amount)}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {hasAllocations && (
                                <div className="border-t border-zinc-200 px-3 py-3 text-xs dark:border-zinc-800">
                                  <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">
                                      Current applied
                                    </span>
                                    <span className="font-semibold">
                                      {formatCurrency(allocatedAmount)}
                                    </span>
                                  </div>

                                  {creditAmount > 0 && (
                                    <div className="mt-1 flex items-center justify-between">
                                      <span className="text-zinc-500">
                                        Remaining credit
                                      </span>
                                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(creditAmount)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    {canCorrectPayments && (
                      <button
                        type="button"
                        onClick={() =>
                          void togglePaymentCorrections(payment.id)
                        }
                        className="mt-3 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                      >
                        {loadingPaymentCorrections[payment.id]
                          ? "Loading correction history..."
                          : isCorrectionHistoryExpanded
                            ? "Hide correction history ▲"
                            : corrections.length > 0
                              ? `View correction history (${corrections.length}) ▼`
                              : "View correction history ▼"}
                      </button>
                    )}
                    {corrections.length > 0 && isCorrectionHistoryExpanded && (
                      <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Correction history
                        </p>

                        <div className="space-y-3">
                          {corrections.map((correction) => (
                            <div
                              key={correction.id}
                              className="border-b border-zinc-200 pb-3 last:border-b-0 last:pb-0 dark:border-zinc-800"
                            >
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="text-sm font-medium">
                                    {formatCurrency(correction.previousAmount)}{" "}
                                    → {formatCurrency(correction.newAmount)}
                                  </p>

                                  <p className="text-xs text-zinc-500">
                                    {new Date(
                                      correction.createdAt,
                                    ).toLocaleString()}
                                  </p>
                                </div>

                                <span className="text-xs font-medium text-zinc-500">
                                  {correction.newAmount === 0 &&
                                  correction.previousAmount > 0
                                    ? "Reversal"
                                    : "Correction"}
                                </span>
                              </div>

                              {(correction.previousPaymentMethod !==
                                correction.newPaymentMethod ||
                                correction.previousPaymentDate !==
                                  correction.newPaymentDate ||
                                correction.previousReference !==
                                  correction.newReference) && (
                                <div className="mt-2 space-y-1 text-xs text-zinc-500">
                                  {correction.previousPaymentMethod !==
                                    correction.newPaymentMethod && (
                                    <p>
                                      Method:{" "}
                                      {formatLabel(
                                        correction.previousPaymentMethod,
                                      )}{" "}
                                      →{" "}
                                      {formatLabel(correction.newPaymentMethod)}
                                    </p>
                                  )}

                                  {correction.previousPaymentDate !==
                                    correction.newPaymentDate && (
                                    <p>
                                      Date:{" "}
                                      {formatDate(
                                        correction.previousPaymentDate,
                                      )}{" "}
                                      → {formatDate(correction.newPaymentDate)}
                                    </p>
                                  )}

                                  {correction.previousReference !==
                                    correction.newReference && (
                                    <p>
                                      Reference:{" "}
                                      {correction.previousReference || "—"} →{" "}
                                      {correction.newReference || "—"}
                                    </p>
                                  )}
                                </div>
                              )}

                              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                                <span className="font-medium">Reason:</span>{" "}
                                {correction.reason}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reversal form */}
                    {canCorrectPayments &&
                      reversingPaymentId === payment.id && (
                        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-800 dark:bg-amber-950/20">
                          <p className="font-semibold text-amber-800 dark:text-amber-300">
                            Reverse Payment
                          </p>

                          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                            This will set the payment amount to zero, release
                            its allocations, and rerun FIFO allocation. This
                            action cannot be undone normally.
                          </p>

                          <div className="mt-3">
                            <label className="mb-1 block text-xs font-medium">
                              Reversal Reason
                            </label>

                            <textarea
                              value={reversalReason}
                              onChange={(event) =>
                                setReversalReason(event.target.value)
                              }
                              rows={3}
                              placeholder="Why is this payment being reversed?"
                              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                              disabled={submittingReversal}
                            />
                          </div>

                          {reversalError && (
                            <p className="mt-2 text-xs text-red-600">
                              {reversalError}
                            </p>
                          )}

                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                              disabled={submittingReversal}
                              onClick={() => void handleReversePayment(payment)}
                            >
                              {submittingReversal
                                ? "Reversing..."
                                : "Confirm Reversal"}
                            </button>

                            <button
                              type="button"
                              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                              disabled={submittingReversal}
                              onClick={() => {
                                setReversingPaymentId(null);
                                setReversalReason("");
                                setReversalError(null);
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                    {/* Correction form */}
                    {canCorrectPayments && isCorrecting && (
                      <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold">Correct Payment</p>
                            <p className="mt-1 text-xs text-zinc-500">
                              This change will be recorded in the payment
                              correction history.
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <label>
                            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                              Amount
                            </span>

                            <input
                              type="number"
                              min="1"
                              required
                              value={correctionAmount}
                              onChange={(event) =>
                                setCorrectionAmount(event.target.value)
                              }
                              className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                            />
                          </label>

                          <label>
                            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                              Payment Method
                            </span>

                            <select
                              value={correctionMethod}
                              onChange={(event) =>
                                setCorrectionMethod(event.target.value)
                              }
                              className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                            >
                              <option value="CASH">Cash</option>
                              <option value="GCASH">GCash</option>
                              <option value="MAYA">Maya</option>
                              <option value="BANK_TRANSFER">
                                Bank Transfer
                              </option>
                              <option value="CUSTOM">Custom</option>
                            </select>
                          </label>

                          <label>
                            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                              Payment Date
                            </span>

                            <input
                              type="date"
                              required
                              max={getTodayDate()}
                              value={correctionDate}
                              onChange={(event) =>
                                setCorrectionDate(event.target.value)
                              }
                              className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                            />
                          </label>

                          <label>
                            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                              Reference
                            </span>

                            <input
                              type="text"
                              value={correctionReference}
                              onChange={(event) =>
                                setCorrectionReference(event.target.value)
                              }
                              className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                            />
                          </label>

                          <label className="md:col-span-2">
                            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                              Reason
                            </span>

                            <textarea
                              required
                              rows={3}
                              value={correctionReason}
                              onChange={(event) =>
                                setCorrectionReason(event.target.value)
                              }
                              placeholder="Explain why this payment is being corrected."
                              className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                            />
                          </label>
                        </div>

                        {correctionError && (
                          <p className="mt-3 text-sm text-red-400">
                            {correctionError}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={submittingCorrection}
                            onClick={() => void handleCorrectPayment(payment)}
                            className="primary-action rounded-lg px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {submittingCorrection
                              ? "Saving..."
                              : "Save Correction"}
                          </button>

                          <button
                            type="button"
                            disabled={submittingCorrection}
                            onClick={() => {
                              setCorrectingPaymentId(null);
                              setCorrectionError(null);
                            }}
                            className="secondary-action rounded-lg px-4 py-2 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      {renderPaymentReceipt && receiptPayment && (
        <div className="fixed left-[-10000px] top-0" aria-hidden="true">
          <div ref={paymentReceiptRef}>
            <PaymentReceipt
              participant={participant}
              payment={receiptPayment}
              allocations={receiptAllocations}
              corrections={receiptCorrections}
              organizationName={organization?.name ?? "RallyLedger"}
              organizationLogo={organizationLogo}
              rallyLedgerLogo="/branding/login-light-horizontal.png"
              charges={ledger?.charges ?? []}
              products={products}
            />
          </div>
        </div>
      )}
      {renderStatement && (
        <div className="fixed left-[-10000px] top-0" aria-hidden="true">
          <div ref={statementRef}>
            <LedgerStatement
              participant={participant}
              periodLabel={statementPeriodLabel}
              openingBalance={openingBalance}
              charges={statementCharges}
              payments={statementPayments}
              chargeTotal={statementChargeTotal}
              paymentTotal={statementPaymentTotal}
              closingBalance={closingBalance}
              organizationName={organization?.name ?? "RallyLedger"}
              organizationLogo={organizationLogo}
              organizationGcashNumber={organization?.gcashNumber ?? null}
              organizationGcashQr={organizationGcashQr}
              products={products}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ParticipantLedgerPanel;
