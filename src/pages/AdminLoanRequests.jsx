import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays, isAfter, parseISO } from "date-fns";
import { FileText, Check, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

export default function AdminLoanRequests() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' or 'decline'
  const [pickupDate, setPickupDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [markingPaidId, setMarkingPaidId] = useState(null);

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

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

  const checkAuthAndLoad = async () => {
    try {
      const me = await api.auth.me();
      setUser(me);
      await loadRequests();
    } catch (error) {
      console.error('Failed to load:', error);
      navigate("/");
    }
  };

  const loadRequests = async () => {
    const data = await api.entities.LoanRequest.list("-created_date", 200);
    setRequests(data);
    setLoading(false);
  };

  const handleApprove = async () => {
    if (!pickupDate || !deadline) return;
    setProcessing(true);

    // Optimistic update
    const reqId = selectedRequest.id;
    setRequests((prev) =>
      prev.map((r) =>
        r.id === reqId ? { ...r, status: "approved", pickup_date: pickupDate, deadline } : r
      )
    );
    closeDialog();

    await api.entities.LoanRequest.update(reqId, {
      status: "approved",
      pickup_date: pickupDate,
      deadline: deadline,
    });

    // Create transaction
    await api.entities.Transaction.create({
      member_email: selectedRequest.member_email,
      member_name: selectedRequest.member_name,
      product_id: selectedRequest.product_id || "",
      product_name: selectedRequest.product_name || "",
      type: selectedRequest.type === "seeds" ? "seeds_loan" : "capital_loan",
      quantity: selectedRequest.quantity || 0,
      amount: selectedRequest.amount || 0,
      deadline: deadline,
      status: "active",
      loan_request_id: selectedRequest.id,
    });

    // If seeds loan, reduce product quantity
    if (selectedRequest.type === "seeds" && selectedRequest.product_id && selectedRequest.quantity) {
      const products = await api.entities.Product.filter({ id: selectedRequest.product_id });
      if (products.length > 0) {
        const product = products[0];
        await api.entities.Product.update(product.id, {
          quantity: Math.max(0, product.quantity - selectedRequest.quantity),
        });
      }
    }

    setProcessing(false);
    loadRequests();
  };

  const handleDecline = async () => {
    if (!declineReason) return;
    setProcessing(true);

    // Optimistic update
    const reqId = selectedRequest.id;
    const reason = declineReason;
    setRequests((prev) =>
      prev.map((r) =>
        r.id === reqId ? { ...r, status: "declined", decline_reason: reason } : r
      )
    );
    closeDialog();

    await api.entities.LoanRequest.update(reqId, {
      status: "declined",
      decline_reason: reason,
    });
    setProcessing(false);
    loadRequests();
  };

  const handleMarkPaid = async () => {
    if (!markingPaidId) return;
    setProcessing(true);

    // Optimistic update
    setRequests((prev) =>
      prev.map((r) =>
        r.id === markingPaidId ? { ...r, settlement_status: "paid" } : r
      )
    );
    setMarkingPaidId(null);

    await api.entities.LoanRequest.update(markingPaidId, {
      settlement_status: "paid",
    });
    setProcessing(false);
    loadRequests();
  };

  const closeDialog = () => {
    setSelectedRequest(null);
    setActionType(null);
    setPickupDate("");
    setDeadline("");
    setDeclineReason("");
    setMarkingPaidId(null);
  };

  const filtered = requests.filter((r) => r.status === tab);

  const statusColor = {
    pending: "bg-amber-500/30 text-amber-300",
    approved: "bg-emerald-500/30 text-emerald-300",
    declined: "bg-red-500/30 text-red-300",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Loan Requests</h1>
          <p className="text-sm text-slate-400 mt-1">Review and manage loan applications</p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mb-6">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="pending" className="gap-1.5 data-[state=active]:bg-emerald-600 text-slate-300 data-[state=active]:text-white">
              <Clock className="w-3.5 h-3.5" /> Pending
              <Badge variant="secondary" className="ml-1 h-5 text-[10px] bg-emerald-500/30 text-emerald-300">
                {requests.filter((r) => r.status === "pending").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:bg-emerald-600 text-slate-300 data-[state=active]:text-white">Approved</TabsTrigger>
            <TabsTrigger value="declined" className="data-[state=active]:bg-emerald-600 text-slate-300 data-[state=active]:text-white">Declined</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-slate-700/50 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No {tab} requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <div key={req.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:shadow-emerald-500/10 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    req.type === "seeds" ? "bg-emerald-500/20" : "bg-blue-500/20"
                  }`}>
                    <FileText className={`w-5 h-5 ${req.type === "seeds" ? "text-emerald-400" : "text-blue-400"}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{req.member_name || req.member_email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={req.type === "seeds" ? "bg-emerald-500/30 text-emerald-300" : "bg-blue-500/30 text-blue-300"}>
                        {req.type === "seeds" ? "Seeds Loan" : "Capital Loan"}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {req.created_date ? format(new Date(req.created_date), "MMM dd, yyyy") : ""}
                      </span>
                      {req.status === "approved" && getSettlementStatus(req) && (
                        <div className="flex items-center gap-1.5 ml-1">
                          <div className={`w-2.5 h-2.5 rounded-full ${getSettlementColor(getSettlementStatus(req))}`} />
                          <span className="text-xs text-slate-300 capitalize">{getSettlementStatus(req)}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">
                      {req.type === "seeds"
                        ? `${req.product_name} — ${req.quantity} units`
                        : `₱${(req.amount || 0).toLocaleString()}`}
                    </p>
                    {req.purpose && <p className="text-xs text-slate-400 mt-1">Purpose: {req.purpose}</p>}
                    {req.status === "approved" && req.pickup_date && (
                      <p className="text-xs text-emerald-400 mt-1">Pickup: {format(new Date(req.pickup_date), "MMM dd, yyyy")}</p>
                    )}
                    {req.status === "declined" && req.decline_reason && (
                      <p className="text-xs text-red-500 mt-1">Reason: {req.decline_reason}</p>
                    )}
                  </div>
                </div>

                {req.status === "approved" && req.settlement_status !== "paid" && (
                  <div className="flex gap-2 self-start">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setMarkingPaidId(req.id)}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Mark as Paid
                    </Button>
                  </div>
                )}

                {req.status === "pending" && (
                  <div className="flex gap-2 self-start">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        setSelectedRequest(req);
                        setActionType("approve");
                      }}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => {
                        setSelectedRequest(req);
                        setActionType("decline");
                      }}
                    >
                      <X className="w-3.5 h-3.5 mr-1" /> Decline
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={actionType === "approve"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Loan Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Pickup Date</Label>
              <Input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
            </div>
            <div>
              <Label>Payment/Return Deadline</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleApprove} disabled={processing || !pickupDate || !deadline} className="bg-emerald-600 hover:bg-emerald-700">
              {processing ? "Processing..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog open={actionType === "decline"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Loan Request</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Reason for Declining</Label>
            <Textarea value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} placeholder="Provide a reason..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleDecline} disabled={processing || !declineReason} variant="destructive">
              {processing ? "Processing..." : "Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Dialog */}
      <Dialog open={!!markingPaidId} onOpenChange={() => setMarkingPaidId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Loan as Paid</DialogTitle>
          </DialogHeader>
          <div>
            <p className="text-slate-400">Are you sure you want to mark this loan as fully paid?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkingPaidId(null)}>Cancel</Button>
            <Button onClick={handleMarkPaid} disabled={processing} className="bg-emerald-600 hover:bg-emerald-700">
              {processing ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}