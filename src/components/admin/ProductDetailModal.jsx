import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { format, isBefore, addDays } from "date-fns";
import { Pencil, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ProductDetailModal({ product, open, onClose, onUpdate }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [reduceQty, setReduceQty] = useState(0);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (product && open) {
      loadTransactions();
    }
  }, [product, open]);

  const loadTransactions = async () => {
    setLoading(true);
    const txs = await api.entities.Transaction.filter({ product_id: product.id });
    setTransactions(txs);
    setLoading(false);
  };

  const handleReduceQuantity = async () => {
    if (reduceQty <= 0 || reduceQty > product.quantity || updating) return;
    setUpdating(true);
    try {
      await api.entities.Product.update(product.id, {
        quantity: product.quantity - reduceQty,
      });
      setReduceQty(0);
      setEditing(false);
      onUpdate();
      // Reload transactions in case the update affects them
      await loadTransactions();
    } catch (error) {
      console.error('Failed to update quantity:', error);
      // Optionally show error toast
    } finally {
      setUpdating(false);
    }
  };

  const getDeadlineStatus = (deadline) => {
    if (!deadline) return null;
    const d = new Date(deadline);
    const now = new Date();
    if (isBefore(d, now)) return "red";
    if (isBefore(d, addDays(now, 7))) return "orange";
    return "green";
  };

  const dotColor = {
    green: "bg-emerald-400",
    orange: "bg-amber-400",
    red: "bg-red-400",
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-stone-400 text-xs">Category</p>
              <p className="font-medium text-stone-700 capitalize">{product.category || "—"}</p>
            </div>
            <div>
              <p className="text-stone-400 text-xs">Quantity</p>
              <p className="font-medium text-stone-700">{product.quantity} {product.unit}</p>
            </div>
            <div>
              <p className="text-stone-400 text-xs">Price/Unit</p>
              <p className="font-medium text-stone-700">₱{product.price_per_unit?.toLocaleString() || "0"}</p>
            </div>
          </div>

          {/* Edit Quantity */}
          <div className="bg-stone-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-stone-700">Adjust Quantity</h4>
              {!editing && (
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                  <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
                </Button>
              )}
            </div>
            {editing && (
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Label className="text-xs text-stone-400">Reduce by</Label>
                  <Input
                    type="number"
                    min={0}
                    max={product.quantity}
                    value={reduceQty}
                    onChange={(e) => setReduceQty(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
                <Button size="sm" onClick={handleReduceQuantity} disabled={updating} className="bg-emerald-600 hover:bg-emerald-700">
                  <Save className="w-3.5 h-3.5 mr-1.5" /> {updating ? 'Saving...' : 'Save'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setEditing(false); setReduceQty(0); }}>
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Transaction Logs */}
          <div>
            <h4 className="text-sm font-semibold text-stone-700 mb-3">Transaction Logs</h4>
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-stone-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-6">No transactions yet</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {transactions.map((tx) => {
                  const status = getDeadlineStatus(tx.deadline);
                  return (
                    <div key={tx.id} className="flex items-center justify-between bg-stone-50 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-3">
                        {status && <div className={`w-2.5 h-2.5 rounded-full ${dotColor[status]}`} />}
                        <div>
                          <p className="text-sm font-medium text-stone-700">{tx.member_name || tx.member_email}</p>
                          <p className="text-[11px] text-stone-400">
                            {tx.type?.replace("_", " ")} • {tx.quantity} {product.unit}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-stone-500">{format(new Date(tx.created_date), "MMM dd, yyyy")}</p>
                        {tx.deadline && (
                          <p className="text-[11px] text-stone-400">
                            Due: {format(new Date(tx.deadline), "MMM dd, yyyy")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}