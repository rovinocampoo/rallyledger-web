import { useEffect, useState } from "react";
import type { AdminUser } from "../api/auth";
import {
  chargeProductParticipant,
  deleteProduct,
  getProducts,
} from "../api/products";
import { getParticipants } from "../api/participants";
import type { Participant } from "../types/participant";
import type { Product } from "../types/product";
import ProductCard from "../components/ui/ProductCard";
import ProductForm from "../components/ui/ProductForm";
import ProductChargeModal from "../components/ui/ProductChargeModal";
import { formatCurrency, formatFullName } from "../utils/format";

type ProductsPageProps = {
  admin: AdminUser;
};

function ProductsPage({ admin }: ProductsPageProps) {
  const canManageProducts = admin.role === "OWNER" || admin.role === "ADMIN";

  const [products, setProducts] = useState<Product[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [chargeProduct, setChargeProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [charging, setCharging] = useState(false);

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

  useEffect(() => {
    if (!canManageProducts) {
      return;
    }

    let ignore = false;

    getParticipants()
      .then((data) => {
        if (!ignore) {
          setParticipants(data);
        }
      })
      .catch((err) => {
        console.error(err);
      });

    return () => {
      ignore = true;
    };
  }, [canManageProducts]);

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

  async function handleProductCharge(participantId: number) {
    if (!chargeProduct) {
      return;
    }

    const participant = participants.find((item) => item.id === participantId);

    try {
      setCharging(true);
      setActionError(null);

      await chargeProductParticipant(chargeProduct.id, participantId);

      setChargeProduct(null);

      setSuccessMessage(
        `${chargeProduct.name} (${formatCurrency(
          chargeProduct.price,
        )}) charged to ${
          participant
            ? formatFullName(participant.firstName, participant.lastName)
            : `Participant #${participantId}`
        }.`,
      );
    } catch (err) {
      console.error(err);

      setActionError(
        err instanceof Error ? err.message : "Failed to charge product",
      );
    } finally {
      setCharging(false);
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
            Manage products and charge them to participants.
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
                onCharge={(selectedProduct) => {
                  setChargeProduct(selectedProduct);
                  setActionError(null);
                  setSuccessMessage(null);
                }}
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

      {chargeProduct && (
        <ProductChargeModal
          product={chargeProduct}
          participants={participants}
          submitting={charging}
          error={actionError}
          onCancel={() => {
            if (charging) {
              return;
            }

            setChargeProduct(null);
            setActionError(null);
          }}
          onConfirm={handleProductCharge}
        />
      )}
    </div>
  );
}

export default ProductsPage;
