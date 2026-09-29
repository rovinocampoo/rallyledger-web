import { useEffect, useState } from "react";
import type { AdminUser } from "../api/auth";
import {
  deleteProduct,
  getProducts,
} from "../api/products";
import type { Product } from "../types/product";
import ProductCard from "../components/ui/ProductCard";
import ProductForm from "../components/ui/ProductForm";

type ProductsPageProps = {
  admin: AdminUser;
};

function ProductsPage({ admin }: ProductsPageProps) {
  const canManageProducts = admin.role === "OWNER" || admin.role === "ADMIN";

  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadProducts() {
      try {
        const productData = await getProducts();

        if (!ignore) {
          setProducts(productData);
        }
      } catch (err) {
        if (!ignore) {
          console.error(err);
          setError("Failed to load products");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      ignore = true;
    };
  }, []);

  function handleProductSaved(savedProduct: Product) {
    setProducts((current) => {
      const exists = current.some((product) => product.id === savedProduct.id);

      if (exists) {
        return current.map((product) =>
          product.id === savedProduct.id ? savedProduct : product,
        );
      }

      return [...current, savedProduct];
    });

    setEditingProduct(null);
    setShowForm(false);
    setActionError(null);
    setSuccessMessage(
      `${savedProduct.name} ${editingProduct ? "updated" : "created"}.`,
    );
  }

  async function handleProductDelete(product: Product) {
    const confirmed = window.confirm(`Delete ${product.name}?`);

    if (!confirmed) {
      return;
    }

    try {
      setActionError(null);
      setSuccessMessage(null);

      await deleteProduct(product.id);

      setProducts((current) =>
        current.filter((item) => item.id !== product.id),
      );

      if (editingProduct?.id === product.id) {
        setEditingProduct(null);
        setShowForm(false);
      }

      setSuccessMessage(`${product.name} deleted.`);
    } catch (err) {
      console.error(err);

      setActionError(
        err instanceof Error ? err.message : `Failed to delete ${product.name}`,
      );
    }
  }

  if (loading) {
    return <div className="p-4 text-sm text-zinc-500">Loading products...</div>;
  }

  if (error) {
    return <div className="p-4 text-sm text-red-400">{error}</div>;
  }

  return (
    <div className="p-4">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>

          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Manage the products available for sale.
          </p>
        </div>

        {canManageProducts && (
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setShowForm(true);
              setActionError(null);
              setSuccessMessage(null);
            }}
            className="primary-action w-full rounded-lg px-4 py-3 text-sm font-medium sm:w-auto sm:py-2"
          >
            Add Product
          </button>
        )}
      </div>

      {actionError && (
        <p className="mb-4 text-sm text-red-400">{actionError}</p>
      )}

      {successMessage && (
        <p className="mb-4 text-sm text-emerald-600 dark:text-emerald-400">
          {successMessage}
        </p>
      )}

      {showForm && editingProduct === null && (
        <div className="mb-5">
          <ProductForm
            onSaved={handleProductSaved}
            onCancel={() => {
              setShowForm(false);
              setEditingProduct(null);
            }}
          />
        </div>
      )}

      <div className="space-y-3">
        {products.length === 0 ? (
          <p className="text-sm text-zinc-500">No products yet.</p>
        ) : (
          products.map((product) => (
            <div key={product.id}>
              <ProductCard
                product={product}
                canManage={canManageProducts}
                onEdit={(selectedProduct) => {
                  setEditingProduct(selectedProduct);
                  setShowForm(true);
                  setActionError(null);
                  setSuccessMessage(null);
                }}
                onDelete={handleProductDelete}
              />

              {showForm && editingProduct?.id === product.id && (
                <div className="mt-2">
                  <ProductForm
                    product={editingProduct}
                    onSaved={handleProductSaved}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingProduct(null);
                    }}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ProductsPage;
