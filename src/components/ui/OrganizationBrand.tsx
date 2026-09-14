type OrganizationBrandProps = {
  name: string;
  logoDataUrl: string | null;
  compact?: boolean;
};

export default function OrganizationBrand({
  name,
  logoDataUrl,
  compact = false,
}: OrganizationBrandProps) {
  return (
    <div className="flex items-center gap-3">
      {logoDataUrl ? (
        <img
          src={logoDataUrl}
          alt={`${name} logo`}
          className={
            compact
              ? "h-9 w-9 rounded-lg object-contain"
              : "h-14 w-14 rounded-xl object-contain"
          }
        />
      ) : (
        <div
          className={
            compact
              ? "h-9 w-9 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
              : "h-14 w-14 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
          }
        />
      )}

      <div className="min-w-0">
        <p
          className={
            compact
              ? "truncate text-sm font-semibold text-zinc-900 dark:text-white"
              : "truncate text-sm font-bold uppercase tracking-[0.14em] text-zinc-500"
          }
        >
          {name}
        </p>

        {!compact && (
          <p className="mt-1 text-xs text-zinc-500">
            RallyLedger
          </p>
        )}
      </div>
    </div>
  );
}