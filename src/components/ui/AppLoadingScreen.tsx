function BrandLoader() {
  return (
    <div className="relative flex h-50 w-50 items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-[#dfff28]/25 blur-2xl dark:bg-[#dfff28]/10" />

      <img
        src="/branding/rallyledger-icon.png"
        alt="RallyLedger"
        className="relative h-50 w-50 object-contain animate-[brandLoader_1.4s_ease-in-out_infinite] motion-reduce:animate-none"
      />
    </div>
  );
}

export default function AppLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-[#f1eee5] text-[#103f25] dark:bg-zinc-950 dark:text-zinc-100">
      <BrandLoader />
    </div>
  );
}
