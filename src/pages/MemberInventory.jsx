import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useNavigate } from "react-router-dom";
import { Search, Package, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function MemberInventory() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

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

  const loadProducts = async () => {
    const data = await api.entities.Product.list("-created_date");
    setProducts(data);
    setLoading(false);
  };

  const filtered = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Available Inventory</h1>
          <p className="text-sm text-slate-400 mt-1">Browse available products from the cooperative</p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-500" />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-stone-100 rounded-2xl animate-pulse" />)}
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
                onClick={() => setSelected(product)}
                className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-5 hover:shadow-emerald-500/20 hover:shadow-lg transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-emerald-400" />
                  </div>
                  <Badge className={product.quantity > 10 ? "bg-emerald-100 text-emerald-700" : product.quantity > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}>
                    {product.quantity > 0 ? `${product.quantity} ${product.unit}` : "Out of Stock"}
                  </Badge>
                </div>
                <h3 className="font-semibold text-white mb-1">{product.name}</h3>
                <p className="text-xs text-slate-400 capitalize mb-3">{product.category}</p>
                {product.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">{product.description}</p>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
                  <span className="text-sm font-medium text-slate-400">
                    {product.quantity} {product.unit}
                  </span>
                  <span className="text-sm font-semibold text-emerald-400">
                    ₱{product.price_per_unit?.toLocaleString() || "0"}
                  </span>
                  <Eye className="w-4 h-4 text-slate-400 ml-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{selected?.name}</DialogTitle>
            </DialogHeader>
            {selected && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-xs text-slate-400">Category</p>
                    <p className="font-medium text-white capitalize">{selected.category}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-xs text-slate-400">Available</p>
                    <p className="font-medium text-white">{selected.quantity} {selected.unit}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-xs text-slate-400">Price per Unit</p>
                    <p className="font-medium text-emerald-400">₱{selected.price_per_unit?.toLocaleString() || "0"}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-xs text-slate-400">Status</p>
                    <p className="font-medium text-white capitalize">{selected.status?.replace("_", " ")}</p>
                  </div>
                </div>
                {selected.description && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Description</p>
                    <p className="text-sm text-slate-400">{selected.description}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}