import { useState, type SubmitEvent } from "react";
import { createProduct, updateProduct } from "../../api/products";
import type { Product, ProductInput } from "../../types/product";
import { formatCurrency } from "../../utils/format";

type ProductFormProps = {
  product?: Product;
  onSaved: (product: Product) => void;
  onCancel: () => void;
};

function ProductForm({ product, onSaved, onCancel }: ProductFormProps) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const parsedPrice = Number(price);

    if (!trimmedName) {
      setError("Product name is required.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError("Product price must be 0 or greater.");
      return;
    }

    const data: ProductInput = {
      name: trimmedName,
      description: trimmedDescription || null,
      price: Math.trunc(parsedPrice),
      isActive,
    };

    try {
      setSubmitting(true);
      setError(null);

      const savedProduct = product
        ? await updateProduct(product.id, data)
        : await createProduct(data);

      onSaved(savedProduct);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="grid gap-4">
        <label className="block">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Product Name
          </span>

          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Coffee"
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
            disabled={submitting}
          />
        </label>

        <label className="block">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Description
          </span>

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional description"
            rows={3}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
            disabled={submitting}
          />
        </label>

        <label className="block">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Price (PHP)
          </span>

          <input
            type="number"
            min="0"
            step="1"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="0"
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
            disabled={submitting}
          />

          {price !== "" && Number.isFinite(Number(price)) && (
            <p className="mt-1 text-xs text-zinc-500">
              {formatCurrency(Math.max(0, Math.trunc(Number(price))))}
            </p>
          )}
        </label>

        {product && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              disabled={submitting}
              className="h-4 w-4 rounded"
            />

            <span>Active</span>
          </label>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

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
          disabled={submitting}
          className="primary-action rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {submitting ? "Saving..." : product ? "Save Changes" : "Add Product"}
        </button>
      </div>
    </form>
  );
}

export default ProductForm;
