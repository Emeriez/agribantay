import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/apiClient";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import ProductDetailModal from "../components/admin/ProductDetailModal";
import PullToRefresh from "../components/PullToRefresh";

const CATEGORIES = ["seeds", "fertilizer", "tools", "equipment", "pesticide", "other"];

const emptyProduct = {
  name: "",
  description: "",
  category: "seeds",
  quantity: 0,
  unit: "pcs",
  price_per_unit: 0,
  image_url: "",
};

export default function AdminInventory() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    try {
      const me = await api.auth.me();
      setUser(me);
      await loadProducts();
    } catch (error) {
      console.error('Failed to load:', error);
      navigate("/");
    }
  };

  const loadProducts = useCallback(async () => {
    const data = await api.entities.Product.list("-created_date");
    setProducts(data);
    setLoading(false);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    // Optimistic update
    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) => p.id === editingProduct.id ? { ...p, ...form } : p)
      );
    } else {
      setProducts((prev) => [{ id: `temp-${Date.now()}`, ...form }, ...prev]);
    }
    setShowForm(false);
    setEditingProduct(null);
    setForm(emptyProduct);
    // Sync with server
    if (editingProduct) {
      await api.entities.Product.update(editingProduct.id, form);
    } else {
      await api.entities.Product.create(form);
    }
    setSaving(false);
    loadProducts();
  };

  const handleDelete = async (id) => {
    await api.entities.Product.delete(id);
    loadProducts();
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || "",
      category: product.category || "seeds",
      quantity: product.quantity,
      unit: product.unit,
      price_per_unit: product.price_per_unit || 0,
      image_url: product.image_url || "",
    });
    setShowForm(true);
  };

  const filtered = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PullToRefresh onRefresh={loadProducts}>
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Inventory</h1>
            <p className="text-sm text-slate-400 mt-1">Manage cooperative products</p>
          </div>
          <Button
            onClick={() => {
              setEditingProduct(null);
              setForm(emptyProduct);
              setShowForm(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-500"
          />
        </div>

        {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-stone-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-400">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-5 hover:shadow-emerald-500/20 hover:shadow-lg transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(product);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-emerald-300"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(product.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-white mb-1">{product.name}</h3>
              <p className="text-xs text-slate-400 capitalize mb-3">{product.category}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">
                  {product.quantity} {product.unit}
                </span>
                <span className="text-sm font-semibold text-emerald-400">
                  ₱{product.price_per_unit?.toLocaleString() || "0"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={() => { setShowForm(false); setEditingProduct(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unit</Label>
                <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity</Label>
                <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Price per Unit (₱)</Label>
                <Input type="number" value={form.price_per_unit} onChange={(e) => setForm({ ...form, price_per_unit: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingProduct(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Saving..." : editingProduct ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onUpdate={() => {
          loadProducts();
          setSelectedProduct(null);
        }}
      />
    </div>
    </div>
    </PullToRefresh>
  );
}