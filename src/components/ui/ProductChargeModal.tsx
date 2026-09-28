import { useEffect, useState } from "react";
import type { Participant } from "../../types/participant";
import type { Product } from "../../types/product";
import { formatCurrency } from "../../utils/format";
import ParticipantPicker from "./ParticipantPicker";

type ProductChargeModalProps = {
  product: Product;
  participants: Participant[];
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (participantId: number) => void;
};

function ProductChargeModal({
  product,
  participants,
  submitting,
  error,
  onCancel,
  onConfirm,
}: ProductChargeModalProps) {
  const [participantId, setParticipantId] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParticipantId("");
  }, [product.id]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedParticipantID = Number(participantId);

    if (!Number.isInteger(parsedParticipantID) || parsedParticipantID <= 0) {
      return;
    }

    onConfirm(parsedParticipantID);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl dark:bg-zinc-900">
        <div>
          <p className="text-sm text-zinc-500">Charge Product</p>

          <h2 className="mt-1 text-xl font-semibold">{product.name}</h2>

          <p className="mt-1 text-lg font-semibold">
            {formatCurrency(product.price)}
          </p>

          {product.description && (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {product.description}
            </p>
          )}
        </div>

        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
          The current product price will be recorded as the charge amount.
        </div>

        <form onSubmit={handleSubmit} className="mt-5">
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

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="secondary-action rounded-lg px-4 py-2 text-sm disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || participantId === ""}
              className="primary-action rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {submitting
                ? "Charging..."
                : `Charge ${formatCurrency(product.price)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductChargeModal;
