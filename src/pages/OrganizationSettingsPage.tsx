import { useEffect, useRef, useState } from "react";
import {
  deleteOrganizationGcashQR,
  deleteOrganizationLogo,
  getOrganizationGcashQR,
  updateOrganization,
  updateOrganizationGcashNumber,
  uploadOrganizationGcashQR,
  uploadOrganizationLogo,
} from "../api/organization";
import type { AdminUser } from "../api/auth";
import type { Organization } from "../types/organization";
import { blobToDataUrl } from "../utils/image";

type OrganizationSettingsPageProps = {
  admin: AdminUser;
  organization: Organization | null;
  organizationLogo: string | null;
  onOrganizationChanged: (organization: Organization) => void;
  onLogoChanged: () => Promise<void>;
};

function OrganizationSettingsPage({
  admin,
  organization,
  organizationLogo,
  onOrganizationChanged,
  onLogoChanged,
}: OrganizationSettingsPageProps) {
  const canEdit = admin.role === "OWNER" || admin.role === "ADMIN";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const gcashQrInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState(organization?.name ?? "");
  const [slug, setSlug] = useState(organization?.slug ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [gcashQr, setGcashQr] = useState<string | null>(null);
  const [gcashQrLoading, setGcashQrLoading] = useState(true);
  const [gcashQrUploading, setGcashQrUploading] = useState(false);
  const [gcashNumber, setGcashNumber] = useState(
    organization?.gcashNumber ?? "",
  );
  const [gcashNumberSaving, setGcashNumberSaving] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadGcashQr() {
      try {
        setGcashQrLoading(true);

        const blob = await getOrganizationGcashQR();

        if (!blob) {
          if (!ignore) {
            setGcashQr(null);
          }
          return;
        }

        const dataUrl = await blobToDataUrl(blob);

        if (!ignore) {
          setGcashQr(dataUrl);
        }
      } catch (err) {
        console.error("Failed to load GCash QR", err);

        if (!ignore) {
          setGcashQr(null);
        }
      } finally {
        if (!ignore) {
          setGcashQrLoading(false);
        }
      }
    }

    void loadGcashQr();

    return () => {
      ignore = true;
    };
  }, []);

  if (!organization) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Organization information is unavailable.
        </p>
      </div>
    );
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const updated = await updateOrganization({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
      });

      onOrganizationChanged(updated);
      setMessage("Organization settings saved.");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save organization settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    if (file.size > 1024 * 1024) {
      setError("Logo must be 1 MB or smaller.");
      return;
    }

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Logo must be PNG, JPEG, or WebP.");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setMessage(null);

      await uploadOrganizationLogo(file);
      await onLogoChanged();

      setMessage("Organization logo updated.");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload organization logo.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveLogo() {
    try {
      setUploading(true);
      setError(null);
      setMessage(null);

      await deleteOrganizationLogo();
      await onLogoChanged();

      setMessage("Organization logo removed.");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to remove organization logo.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleGcashQrChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    if (file.size > 1024 * 1024) {
      setError("GCash QR must be 1 MB or smaller.");
      return;
    }

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("GCash QR must be PNG, JPEG, or WebP.");
      return;
    }

    try {
      setGcashQrUploading(true);
      setError(null);
      setMessage(null);

      await uploadOrganizationGcashQR(file);

      const blob = await getOrganizationGcashQR();

      if (blob) {
        setGcashQr(await blobToDataUrl(blob));
      } else {
        setGcashQr(null);
      }

      setMessage("GCash QR updated.");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error ? err.message : "Failed to upload GCash QR.",
      );
    } finally {
      setGcashQrUploading(false);
    }
  }

  async function handleRemoveGcashQr() {
    try {
      setGcashQrUploading(true);
      setError(null);
      setMessage(null);

      await deleteOrganizationGcashQR();
      setGcashQr(null);

      setMessage("GCash QR removed.");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error ? err.message : "Failed to remove GCash QR.",
      );
    } finally {
      setGcashQrUploading(false);
    }
  }
  async function handleSaveGcashNumber() {
    setGcashNumberSaving(true);
    setError(null);
    setMessage(null);

    try {
      await updateOrganizationGcashNumber(gcashNumber.trim());
      setMessage("GCash number updated.");
    } catch (err) {
      console.error(err);
      setError("Failed to update GCash number.");
    } finally {
      setGcashNumberSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Organization
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            Settings
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
            Manage your club identity, organization details, and branding.
          </p>
        </div>

        <span className="inline-flex w-fit items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          {admin.role}
        </span>
      </div>

      {/* Alerts */}
      {(message || error) && (
        <div
          className={[
            "rounded-xl border px-4 py-3 text-sm",
            error
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
              : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
          ].join(" ")}
        >
          {error ?? message}
        </div>
      )}

      {/* Identity + branding */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Organization details */}
        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800 sm:px-6">
            <h2 className="font-semibold text-zinc-950 dark:text-white">
              Organization Details
            </h2>

            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              These details identify the organization throughout RallyLedger.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-5 p-5 sm:p-6">
            <div>
              <label
                htmlFor="organization-name"
                className="text-sm font-medium text-zinc-900 dark:text-zinc-200"
              >
                Organization Name
              </label>

              <input
                id="organization-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={!canEdit || saving}
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-zinc-500 dark:focus:ring-zinc-800 dark:disabled:bg-zinc-950/60"
              />
            </div>

            <div>
              <label
                htmlFor="organization-slug"
                className="text-sm font-medium text-zinc-900 dark:text-zinc-200"
              >
                Slug
              </label>

              <div className="mt-2 flex items-center overflow-hidden rounded-xl border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950">
                <span className="border-r border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
                  /
                </span>

                <input
                  id="organization-slug"
                  value={slug}
                  onChange={(event) =>
                    setSlug(
                      event.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, ""),
                    )
                  }
                  disabled={!canEdit || saving}
                  className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-sm text-zinc-950 outline-none dark:text-white"
                />
              </div>

              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Lowercase letters, numbers, and hyphens only.
              </p>
            </div>

            <div className="flex flex-col gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {canEdit
                  ? "Changes affect the current organization."
                  : "You have read-only access to these settings."}
              </div>

              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="primary-action rounded-xl px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Logo */}
        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <h2 className="font-semibold text-zinc-950 dark:text-white">
              Organization Logo
            </h2>

            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Used across the dashboard and exported PNGs.
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-950">
              {organizationLogo ? (
                <img
                  src={organizationLogo}
                  alt={`${organization.name} logo`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-zinc-300 text-center text-xs font-medium uppercase tracking-wider text-zinc-400 dark:border-zinc-700 dark:text-zinc-600">
                  No
                  <br />
                  Logo
                </div>
              )}
            </div>

            <div className="mt-5 space-y-2">
              {canEdit && (
                <>
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="primary-action w-full rounded-xl px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploading
                      ? "Uploading..."
                      : organizationLogo
                        ? "Replace Logo"
                        : "Upload Logo"}
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={uploading}
                    onChange={(event) => void handleLogoChange(event)}
                  />

                  {organizationLogo && (
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => void handleRemoveLogo()}
                      className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Remove Logo
                    </button>
                  )}
                </>
              )}

              <p className="pt-2 text-center text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                PNG, JPEG, or WebP
                <br />
                Maximum file size: 1 MB
              </p>
            </div>
          </div>
        </section>
      </div>
      {/* GCash Payment */}
      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800 sm:px-6">
          <h2 className="font-semibold text-zinc-950 dark:text-white">
            GCash Payment
          </h2>

          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Add your organization&apos;s GCash QR code for participant ledger
            payments.
          </p>
        </div>
        <div className="p-5 sm:p-6">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            GCash Number
          </label>
          <div className="mt-3 flex gap-3">
            <input
              type="text"
              value={gcashNumber}
              onChange={(event) => setGcashNumber(event.target.value)}
              disabled={!canEdit || gcashNumberSaving}
              placeholder="09XXXXXXXXX"
              className="min-w-0 flex-1 rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 disabled:bg-zinc-100"
            />

            <button
              type="button"
              onClick={handleSaveGcashNumber}
              disabled={!canEdit || gcashNumberSaving}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {gcashNumberSaving ? "Saving..." : "Save"}
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            This number will appear on participant ledger PNGs when a GCash QR
            is configured.
          </p>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-950">
            {gcashQrLoading ? (
              <p className="text-sm text-zinc-500">Loading QR code...</p>
            ) : gcashQr ? (
              <img
                src={gcashQr}
                alt="Organization GCash QR code"
                className="h-56 w-56 object-contain"
              />
            ) : (
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-500">
                  No GCash QR configured
                </p>

                <p className="mt-1 text-xs text-zinc-400">
                  It will appear on exported participant ledger PNGs once
                  uploaded.
                </p>
              </div>
            )}
          </div>

          {canEdit && (
            <div className="mt-5 space-y-2">
              <button
                type="button"
                disabled={gcashQrUploading}
                onClick={() => gcashQrInputRef.current?.click()}
                className="primary-action w-full rounded-xl px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                {gcashQrUploading
                  ? "Uploading..."
                  : gcashQr
                    ? "Replace GCash QR"
                    : "Upload GCash QR"}
              </button>

              <input
                ref={gcashQrInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={gcashQrUploading}
                onChange={(event) => void handleGcashQrChange(event)}
              />

              {gcashQr && (
                <button
                  type="button"
                  disabled={gcashQrUploading}
                  onClick={() => void handleRemoveGcashQr()}
                  className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Remove GCash QR
                </button>
              )}

              <p className="pt-2 text-center text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                PNG, JPEG, or WebP
                <br />
                Maximum file size: 1 MB
              </p>
            </div>
          )}
        </div>
      </section>
      {/* Preview */}
      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800 sm:px-6">
          <h2 className="font-semibold text-zinc-950 dark:text-white">
            Branding Preview
          </h2>

          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            This is approximately how the organization identity appears in
            exported documents.
          </p>
        </div>

        <div className="p-5 sm:p-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-white">
            <div className="flex items-center gap-4 border-b border-zinc-200 pb-5">
              {organizationLogo ? (
                <img
                  src={organizationLogo}
                  alt=""
                  className="h-14 w-14 rounded-xl object-contain"
                />
              ) : (
                <div className="h-14 w-14 rounded-xl border border-zinc-200 bg-zinc-50" />
              )}

              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                  {organization.name}
                </p>

                <p className="mt-1 text-sm text-zinc-600">RallyLedger</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Charges
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-950">
                  ₱0.00
                </p>
              </div>

              <div className="rounded-xl bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Payments
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-950">
                  ₱0.00
                </p>
              </div>

              <div className="rounded-xl bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Balance
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-950">
                  ₱0.00
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!canEdit && (
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          Organization settings are managed by an Owner or Admin.
        </p>
      )}
    </div>
  );
}

export default OrganizationSettingsPage;
