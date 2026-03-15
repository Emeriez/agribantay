import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Search, ArrowLeftRight, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminTransactions() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [memberFilter, setMemberFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    try {
      const me = await api.auth.me();
      console.log("🔍 User data after relogging:", me);
      if (!me || !me.role) {
        console.error("❌ Invalid user data or missing role after relogging.");
        navigate("/");
        return;
      }
      if (me.role !== "admin" && me.role !== "head_admin") {
        console.error("❌ Access denied: User is not an admin. Role:", me.role);
        navigate("/MemberDashboard");
        return;
      }
      console.log("✅ User is admin. Proceeding to load transactions.");
      setUser(me);
      await loadTransactions();
    } catch (error) {
      console.error("❌ Failed to load user or transactions:", error);
      if (error.status === 401 || error.status === 403) {
        console.error("🔒 Authentication issue detected. Redirecting to login.");
        navigate("/");
      } else {
        alert("An unexpected error occurred. Please try again later.");
      }
    }
  };

  const loadTransactions = async () => {
    try {
      console.log("🔄 Fetching transactions...");
      const data = await api.entities.Transaction.list("-created_date", 200);
      console.log("✅ Transactions fetched:", data);
      setTransactions(data);
      
      const loansData = await api.entities.LoanRequest.list();
      console.log("✅ Loans fetched:", loansData);
      setLoans(loansData);
      
      setLoading(false);
    } catch (error) {
      console.error("❌ Failed to load transactions:", error);
      alert("Failed to load transactions. Please try again later.");
      setLoading(false);
    }
  };

  const filtered = transactions.filter((tx) => {
    const matchSearch =
      search === "" ||
      tx.member_name?.toLowerCase().includes(search.toLowerCase()) ||
      tx.member_email?.toLowerCase().includes(search.toLowerCase());

    const matchMember = 
      memberFilter === "all" ||
      tx.member_name?.toLowerCase().includes(memberFilter.toLowerCase()) ||
      tx.member_email?.toLowerCase().includes(memberFilter.toLowerCase());

    const matchProduct = 
      productFilter === "all" ||
      tx.product_name?.toLowerCase().includes(productFilter.toLowerCase());

    const matchType = typeFilter === "all" || tx.type === typeFilter;

    const txDate = tx.created_date ? new Date(tx.created_date) : null;
    const matchFrom = !dateFrom || (txDate && txDate >= new Date(dateFrom));
    const matchTo = !dateTo || (txDate && txDate <= new Date(dateTo + "T23:59:59"));

    return matchSearch && matchMember && matchProduct && matchType && matchFrom && matchTo;
  });

  // Group capital and seeds loan transactions
  const groupedTransactions = () => {
    const groups = [];
    const usedIndices = new Set();

    filtered.forEach((tx, idx) => {
      if (usedIndices.has(idx)) return;

      if (tx.type === "Capital Loan Approved" || tx.type === "Seeds Loan Approved") {
        const paymentType = tx.type === "Capital Loan Approved" ? "Capital Loan Payment" : "Seeds Loan Payment";
        const groupId = `${tx.type}-${tx.member_email}-${tx.amount}`;
        
        // Find corresponding payment transaction
        const paymentTx = filtered.find((t, i) => 
          !usedIndices.has(i) &&
          t.type === paymentType &&
          t.member_email === tx.member_email &&
          t.amount === tx.amount
        );

        const isSettled = !!paymentTx;
        
        groups.push({
          type: "group",
          groupId,
          parent: tx,
          child: paymentTx,
          isSettled,
          isExpanded: expandedGroups[groupId] !== false, // Default expanded
        });

        usedIndices.add(idx);
        if (paymentTx) {
          usedIndices.add(filtered.indexOf(paymentTx));
        }
      } else if (tx.type !== "Capital Loan Payment" && tx.type !== "Seeds Loan Payment") {
        groups.push({
          type: "single",
          transaction: tx,
        });
        usedIndices.add(idx);
      }
    });

    return groups;
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Get unique members and products for filter dropdowns
  const uniqueMembers = [...new Set(transactions.map(tx => tx.member_name).filter(Boolean))].sort();
  const uniqueProducts = [...new Set(transactions.map(tx => tx.product_name).filter(Boolean))].sort();

  const typeColor = {
    "Capital Loan Approved": "bg-blue-500/30 text-blue-300",
    "Capital Loan Declined": "bg-red-500/30 text-red-300",
    "Capital Loan Payment": "bg-cyan-500/30 text-cyan-300",
    "Seeds Loan Approved": "bg-emerald-500/30 text-emerald-300",
    "Seeds Loan Declined": "bg-red-500/30 text-red-300",
    "Seeds Loan Payment": "bg-green-500/30 text-green-300",
    seeds_loan: "bg-emerald-500/30 text-emerald-300",
    capital_loan: "bg-blue-500/30 text-blue-300",
    payment: "bg-purple-500/30 text-purple-300",
    return: "bg-amber-500/30 text-amber-300",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Transactions</h1>
          <p className="text-sm text-slate-400 mt-1">All cooperative transaction logs</p>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-500"
              />
            </div>
            <Select value={memberFilter} onValueChange={setMemberFilter}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Member" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Members</SelectItem>
                {uniqueMembers.map((member) => (
                  <SelectItem key={member} value={member}>
                    {member}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Product" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Products</SelectItem>
                {uniqueProducts.map((product) => (
                  <SelectItem key={product} value={product}>
                    {product}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Capital Loan Approved">Capital Loan Approved</SelectItem>
                <SelectItem value="Capital Loan Declined">Capital Loan Declined</SelectItem>
                <SelectItem value="Capital Loan Payment">Capital Loan Payment</SelectItem>
                <SelectItem value="Seeds Loan Approved">Seeds Loan Approved</SelectItem>
                <SelectItem value="Seeds Loan Declined">Seeds Loan Declined</SelectItem>
                <SelectItem value="Seeds Loan Payment">Seeds Loan Payment</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="return">Return</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 flex-col sm:flex-row lg:col-span-2">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="From" className="bg-slate-700 border-slate-600 text-white flex-1" />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="To" className="bg-slate-700 border-slate-600 text-white flex-1" />
            </div>
          </div>
        </div>

        {/* Table */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-slate-700/50 rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ArrowLeftRight className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Member</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Product</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {groupedTransactions().map((item, idx) => {
                  if (item.type === "group") {
                    return (
                      <React.Fragment key={item.groupId}>
                        <tr 
                          onClick={() => toggleGroup(item.groupId)}
                          className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors cursor-pointer"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                item.isSettled ? "bg-emerald-500" : "bg-amber-500"
                              }`} />
                              <div>
                                <p className="font-medium text-white">{item.parent.member_name || "—"}</p>
                                <p className="text-[11px] text-slate-400">{item.parent.member_email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${typeColor[item.parent.type] || "bg-slate-700 text-slate-300"}`}>
                                {item.parent.type?.replace("_", " ")}
                              </span>
                              {item.child && (
                                item.isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-slate-300">{item.parent.product_name || "—"}</td>
                          <td className="px-5 py-3.5 font-medium text-white">₱{(item.parent.amount || 0).toLocaleString()}</td>
                          <td className="px-5 py-3.5 text-slate-400">
                            {item.parent.created_date ? format(new Date(item.parent.created_date), "MMM dd, yyyy") : "—"}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                              item.isSettled 
                                ? "bg-emerald-500/30 text-emerald-300" 
                                : "bg-amber-500/30 text-amber-300"
                            }`}>
                              {item.isSettled ? "Settled" : "Pending"}
                            </span>
                          </td>
                        </tr>
                        {item.child && item.isExpanded && (
                          <tr className="border-b border-slate-700/30 bg-slate-700/10 hover:bg-slate-700/15 transition-colors">
                            <td className="px-5 py-3.5 pl-12">
                              <p className="font-medium text-slate-300">{item.child.member_name || "—"}</p>
                              <p className="text-[11px] text-slate-500">{item.child.member_email}</p>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${typeColor[item.child.type] || "bg-slate-700 text-slate-300"}`}>
                                {item.child.type?.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-slate-400">{item.child.product_name || "—"}</td>
                            <td className="px-5 py-3.5 font-medium text-emerald-400">₱{(item.child.amount || 0).toLocaleString()}</td>
                            <td className="px-5 py-3.5 text-slate-500">
                              {item.child.created_date ? format(new Date(item.child.created_date), "MMM dd, yyyy") : "—"}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300">
                                Received
                              </span>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  } else {
                    const tx = item.transaction;
                    return (
                      <tr key={tx.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-slate-600" />
                            <div>
                              <p className="font-medium text-white">{tx.member_name || "—"}</p>
                              <p className="text-[11px] text-slate-400">{tx.member_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${typeColor[tx.type] || "bg-slate-700 text-slate-300"}`}>
                            {tx.type?.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-300">{tx.product_name || "—"}</td>
                        <td className="px-5 py-3.5 font-medium text-white">₱{(tx.amount || 0).toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-slate-400">
                          {tx.created_date ? format(new Date(tx.created_date), "MMM dd, yyyy") : "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            tx.status === "completed" ? "bg-emerald-500/30 text-emerald-300" :
                            tx.status === "overdue" ? "bg-red-500/30 text-red-300" :
                            "bg-amber-500/30 text-amber-300"
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    );
                  }
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}