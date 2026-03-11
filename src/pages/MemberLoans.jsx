import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays, isAfter, parseISO } from "date-fns";
import { Plus, FileText, Sprout, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function MemberLoans() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState("all");
  const [saving, setSaving] = useState(false);
  const [loanType, setLoanType] = useState("seeds");
  const [form, setForm] = useState({
    product_id: "",
    product_name: "",
    quantity: 0,
    amount: 0,
    purpose: "",
  });

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    try {
      const me = await api.auth.me();
      setUser(me);
      await loadData(me);
    } catch (error) {
      console.error('Failed to load:', error);
      navigate("/");
    }
  };

  const loadData = async (me) => {
    const [reqs, prods] = await Promise.all([
      api.entities.LoanRequest.filter({ member_email: me.email }),
      api.entities.Product.list(),
    ]);
    setRequests(reqs);
    setProducts(prods.filter((p) => p.quantity > 0));
    setLoading(false);
  };

  const getSettlementStatus = (req) => {
    if (req.settlement_status === "paid") return "paid";
    if (!req.deadline) return null;
    
    const today = new Date();
    const deadlineDate = new Date(req.deadline);
    const daysUntilDeadline = differenceInDays(deadlineDate, today);
    
    if (daysUntilDeadline < 0) return "late";
    if (daysUntilDeadline <= 7) return "near";
    return null;
  };

  const getSettlementColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-emerald-500";
      case "late":
        return "bg-red-500";
      case "near":
        return "bg-yellow-500";
      default:
        return "";
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      
      // Validate input
      if (loanType === "seeds" && (!form.product_id || form.quantity <= 0)) {
        alert("Please select a product and enter quantity");
        setSaving(false);
        return;
      }
      if (loanType === "capital" && form.amount <= 0) {
        alert("Please enter an amount");
        setSaving(false);
        return;
      }
      // Purpose is now optional

      const data = {
        member_email: user.email,
        member_name: user.full_name,
        type: loanType,
        purpose: form.purpose || null, // Allow blank purpose
      };

      if (loanType === "seeds") {
        data.product_id = parseInt(form.product_id);
        data.product_name = form.product_name;
        data.quantity = parseInt(form.quantity);
      } else {
        data.amount = parseFloat(form.amount);
      }

      console.log("📋 Submitting loan request:", data);
      await api.entities.LoanRequest.create(data);
      console.log("✅ Loan request created successfully");
      
      setSaving(false);
      setShowForm(false);
      setForm({ product_id: "", product_name: "", quantity: 0, amount: 0, purpose: "" });
      
      // Reload data
      const [reqs, prods] = await Promise.all([
        api.entities.LoanRequest.filter({ member_email: user.email }),
        api.entities.Product.list(),
      ]);
      setRequests(reqs);
      setProducts(prods.filter((p) => p.quantity > 0));
    } catch (error) {
      console.error("❌ Error submitting loan request:", error);
      alert("Failed to submit loan request: " + error.message);
      setSaving(false);
    }
  };

  const filtered = tab === "all" ? requests : requests.filter((r) => r.status === tab);

  const statusColor = {
    pending: "bg-cyan-500/30 text-cyan-300",
    approved: "bg-emerald-500/30 text-emerald-300",
    declined: "bg-red-500/30 text-red-300",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      <div className="p-6 lg:p-10 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">My Loan Requests</h1>
            <p className="text-sm text-slate-400 mt-1">Request and track your loans</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white">
            <Plus className="w-4 h-4 mr-2" /> New Request
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mb-6">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="declined">Declined</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-slate-700/50 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No loan requests found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((req) => (
              <div key={req.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      req.type === "seeds" ? "bg-emerald-500/20" : "bg-blue-500/20"
                    }`}>
                      {req.type === "seeds" ? (
                        <Sprout className="w-5 h-5 text-cyan-300" />
                      ) : (
                        <Banknote className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-white capitalize">
                        {req.type} Loan
                      </p>
                      <p className="text-sm text-slate-400 mt-0.5">
                        {req.type === "seeds"
                          ? `${req.product_name} — ${req.quantity} units`
                          : `₱${(req.amount || 0).toLocaleString()}`}
                      </p>
                      {req.purpose && <p className="text-xs text-slate-400 mt-1">{req.purpose}</p>}
                      {req.status === "approved" && req.pickup_date && (
                        <p className="text-xs text-cyan-300 mt-2">
                          📅 Pickup: {format(new Date(req.pickup_date), "MMM dd, yyyy")}
                        </p>
                      )}
                      {req.status === "approved" && req.deadline && (
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-slate-400">
                            Deadline: {format(new Date(req.deadline), "MMM dd, yyyy")}
                          </p>
                          {getSettlementStatus(req) && (
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${getSettlementColor(getSettlementStatus(req))}`} />
                              <span className="text-xs text-slate-300 capitalize">{getSettlementStatus(req)}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {req.status === "declined" && req.decline_reason && (
                        <p className="text-xs text-red-400 mt-2">Reason: {req.decline_reason}</p>
                      )}
                    </div>
                  </div>
                  <Badge className={statusColor[req.status]}>{req.status}</Badge>
                </div>
                <p className="text-[11px] text-slate-400 mt-3">
                  {req.created_date ? format(new Date(req.created_date), "MMM dd, yyyy 'at' h:mm a") : ""}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* New Loan Request Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">New Loan Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Loan Type</Label>
                <Select value={loanType} onValueChange={setLoanType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seeds">Seeds Loan</SelectItem>
                    <SelectItem value="capital">Capital Loan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loanType === "seeds" ? (
                <>
                  <div>
                    <Label>Select Product</Label>
                    <Select
                      value={form.product_id}
                      onValueChange={(v) => {
                        const prod = products.find((p) => p.id === v);
                        setForm({ ...form, product_id: v, product_name: prod?.name || "" });
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Choose a product" /></SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.quantity} {p.unit} available)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                    />
                  </div>
                </>
              ) : (
                <div>
                  <Label>Amount (₱)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  />
                </div>
              )}

              <div>
                <Label>Purpose</Label>
                <Textarea
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  placeholder="Explain why you need this loan..."
                />
              </div>
            </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || (loanType === "seeds" ? !form.product_id || !form.quantity : !form.amount)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}