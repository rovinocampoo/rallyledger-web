import type { Product } from "../../types/product";
import { formatCurrency } from "../../utils/format";

type ProductCardProps = {
  product: Product;
  canManage: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
};

function ProductCard({
  product,
  canManage,
  onEdit,
  onDelete,
}: ProductCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold">{product.name}</h3>

          {product.description && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {product.description}
            </p>
          )}
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${
            product.isActive
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
          }`}
        >
          {product.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <p className="mt-4 text-2xl font-bold">{formatCurrency(product.price)}</p>

      {canManage && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">

          <button
            type="button"
            onClick={() => onEdit(product)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(product)}
            className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductCard;
