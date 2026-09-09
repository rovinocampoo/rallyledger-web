import { useEffect, useState } from "react";

import type { Participant } from "../../types/participant";
import { createPackage, getSessionPackages } from "../../api/packages";
import type { PackageBillingMode, PackageDetails } from "../../types/package";
import { formatCurrency, formatLabel } from "../../utils/format";

type SessionPackagePanelProps = {
  sessionId: number;
  checkedInParticipants: Participant[];
  packages: PackageDetails[];
  onPackagesChange: (packages: PackageDetails[]) => void;
  onPackageCreated: () => Promise<void>;
};

function splitPackageAmount(total: number, count: number): number[] {
  if (count <= 0) {
    return [];
  }

  const base = Math.floor(total / count);
  const remainder = total % count;

  return Array.from(
    { length: count },
    (_, index) => base + (index < remainder ? 1 : 0),
  );
}

function SessionPackagePanel({
  sessionId,
  checkedInParticipants,
  packages,
  onPackagesChange,
  onPackageCreated,
}: SessionPackagePanelProps) {
  const [packageParticipantIds, setPackageParticipantIds] = useState<number[]>(
    [],
  );
  const [packageAmount, setPackageAmount] = useState("");
  const [packageBillingMode, setPackageBillingMode] =
    useState<PackageBillingMode>("EQUAL");
  const [packagePayerParticipantId, setPackagePayerParticipantId] =
    useState("");
  const [creatingPackage, setCreatingPackage] = useState(false);
  const [showPackageBilling, setShowPackageBilling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const packagedParticipantIds = new Set(
    packages.flatMap((pkg) =>
      pkg.participants.map((participant) => participant.participantId),
    ),
  );

  const availablePackageParticipants = checkedInParticipants.filter(
    (participant) => !packagedParticipantIds.has(participant.id),
  );

  const packageAmountValue = Number(packageAmount);

  const validPackageAmount =
    Number.isInteger(packageAmountValue) && packageAmountValue > 0;

  const packageSelectionValid = packageParticipantIds.length >= 2;

  const packagePayerParticipant =
    packageBillingMode === "SINGLE"
      ? checkedInParticipants.find(
          (participant) => participant.id === Number(packagePayerParticipantId),
        )
      : null;

  const equalPackageShares = validPackageAmount
    ? splitPackageAmount(packageAmountValue, packageParticipantIds.length)
    : [];

  useEffect(() => {
    if (availablePackageParticipants.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowPackageBilling(false);
      setPackageParticipantIds([]);
      setPackagePayerParticipantId("");
    }
  }, [availablePackageParticipants.length]);

  function togglePackageParticipant(participantId: number) {
    setPackageParticipantIds((current) =>
      current.includes(participantId)
        ? current.filter((id) => id !== participantId)
        : [...current, participantId],
    );
  }

  async function handleCreatePackage() {
    setError(null);

    if (!validPackageAmount) {
      setError("Enter a valid package amount.");
      return;
    }

    if (!packageSelectionValid) {
      setError("Select at least two participants for a package.");
      return;
    }

    if (packageBillingMode === "SINGLE" && !packagePayerParticipantId) {
      setError("Select the participant who will pay for the package.");
      return;
    }

    if (
      packageBillingMode === "SINGLE" &&
      !packageParticipantIds.includes(Number(packagePayerParticipantId))
    ) {
      setError("The payer must be one of the package participants.");
      return;
    }

    const selectedParticipants = checkedInParticipants.filter((participant) =>
      packageParticipantIds.includes(participant.id),
    );

    const confirmed = window.confirm(
      `Create a ₱${packageAmountValue.toLocaleString()} package for ${selectedParticipants.length} participants?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setCreatingPackage(true);

      await createPackage({
        sessionId,
        participantIds: packageParticipantIds,
        amount: packageAmountValue,
        billingMode: packageBillingMode,
        payerParticipantId:
          packageBillingMode === "SINGLE"
            ? Number(packagePayerParticipantId)
            : null,
      });

      const data = await getSessionPackages(sessionId);
      onPackagesChange(data);
      await onPackageCreated();

      setPackageParticipantIds([]);
      setPackageAmount("");
      setPackageBillingMode("EQUAL");
      setPackagePayerParticipantId("");
    } catch (err) {
      console.error(err);

      setError(err instanceof Error ? err.message : "Failed to create package");
    } finally {
      setCreatingPackage(false);
    }
  }

  if (availablePackageParticipants.length < 2) {
    return null;
  }

  return (
    <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <button
        type="button"
        onClick={() => setShowPackageBilling((current) => !current)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div>
          <p className="text-sm font-medium">Package Billing</p>

          <p className="mt-1 text-xs text-zinc-500">
            Create a package for selected training participants.
          </p>
        </div>

        <span className="shrink-0 text-zinc-500">
          {showPackageBilling ? "−" : "+"}
        </span>
      </button>

      {showPackageBilling && (
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          {error && (
            <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-2">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {packages.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-left text-xs font-medium text-zinc-500">
                Existing Packages
              </p>

              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <p className="text-sm font-medium">
                    {formatCurrency(pkg.amount)} ·{" "}
                    {pkg.billingMode === "SINGLE"
                      ? "Single Payer"
                      : "Equal Split"}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    {pkg.participants.length} participants
                    {pkg.courtWaived ? " · Court waived" : ""}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-500">
                Package Participants
              </p>

              <button
                type="button"
                onClick={() =>
                  setPackageParticipantIds(
                    packageParticipantIds.length ===
                      availablePackageParticipants.length
                      ? []
                      : availablePackageParticipants.map(
                          (participant) => participant.id,
                        ),
                  )
                }
                className="text-xs text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
              >
                {packageParticipantIds.length ===
                availablePackageParticipants.length
                  ? "Clear all"
                  : "Select all"}
              </button>
            </div>

            <div className="space-y-2">
              {availablePackageParticipants.map((participant) => {
                const selected = packageParticipantIds.includes(participant.id);

                return (
                  <label
                    key={participant.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      selected
                        ? "border-zinc-400 bg-white dark:border-zinc-600 dark:bg-zinc-900"
                        : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => togglePackageParticipant(participant.id)}
                      disabled={creatingPackage}
                      className="h-4 w-4"
                    />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {participant.nickname ||
                          `${participant.firstName} ${participant.lastName}`}
                      </p>

                      <p className="text-xs text-zinc-500">
                        {participant.participantTypeName ||
                          formatLabel(participant.participantType)}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-left text-xs font-medium text-zinc-500">
              Package Amount
            </label>

            <input
              type="number"
              min="1"
              step="1"
              value={packageAmount}
              onChange={(event) => setPackageAmount(event.target.value)}
              disabled={creatingPackage}
              placeholder="800"
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          <div className="mt-4">
            <p className="mb-2 text-left text-xs font-medium text-zinc-500">
              Billing Method
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPackageBillingMode("EQUAL");
                  setPackagePayerParticipantId("");
                }}
                disabled={creatingPackage}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  packageBillingMode === "EQUAL"
                    ? "border-zinc-500 bg-white dark:border-zinc-500 dark:bg-zinc-900"
                    : "border-zinc-200 bg-transparent dark:border-zinc-800"
                }`}
              >
                Split Equally
              </button>

              <button
                type="button"
                onClick={() => setPackageBillingMode("SINGLE")}
                disabled={creatingPackage}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  packageBillingMode === "SINGLE"
                    ? "border-zinc-500 bg-white dark:border-zinc-500 dark:bg-zinc-900"
                    : "border-zinc-200 bg-transparent dark:border-zinc-800"
                }`}
              >
                Single Payer
              </button>
            </div>
          </div>

          {packageBillingMode === "SINGLE" && (
            <div className="mt-4">
              <label className="block text-left text-xs font-medium text-zinc-500">
                Payer
              </label>

              <select
                value={packagePayerParticipantId}
                onChange={(event) =>
                  setPackagePayerParticipantId(event.target.value)
                }
                disabled={creatingPackage || packageParticipantIds.length === 0}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">Select payer...</option>

                {checkedInParticipants
                  .filter((participant) =>
                    packageParticipantIds.includes(participant.id),
                  )
                  .map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {participant.nickname ||
                        `${participant.firstName} ${participant.lastName}`}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {validPackageAmount && packageSelectionValid && (
            <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs font-medium text-zinc-500">
                Charge Preview
              </p>

              <div className="mt-2 space-y-2">
                {checkedInParticipants
                  .filter((participant) =>
                    packageParticipantIds.includes(participant.id),
                  )
                  .map((participant, index) => {
                    const amount =
                      packageBillingMode === "EQUAL"
                        ? (equalPackageShares[index] ?? 0)
                        : participant.id === Number(packagePayerParticipantId)
                          ? packageAmountValue
                          : 0;

                    return (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="truncate">
                          {participant.nickname ||
                            `${participant.firstName} ${participant.lastName}`}
                        </span>

                        <span className="font-medium">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                    );
                  })}
              </div>

              {packageBillingMode === "SINGLE" && (
                <p className="mt-3 text-xs text-zinc-500">
                  {packagePayerParticipant
                    ? `${
                        packagePayerParticipant.nickname ||
                        `${packagePayerParticipant.firstName} ${packagePayerParticipant.lastName}`
                      } pays the full package amount.`
                    : "Select the payer to complete the preview."}
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleCreatePackage()}
            disabled={creatingPackage}
            className="primary-action mt-4 w-full rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {creatingPackage ? "Creating Package..." : "Create Package"}
          </button>
        </div>
      )}
    </div>
  );
}

export default SessionPackagePanel;
