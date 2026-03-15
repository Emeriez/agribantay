import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useNavigate } from "react-router-dom";
import { Search, Users, Eye, ShieldCheck, ShieldAlert, UserCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminMembers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userTransactions, setUserTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    try {
      const me = await api.auth.me();
      setCurrentUser(me);
      await loadData(me);
    } catch (error) {
      console.error('Failed to load:', error);
      navigate("/");
    }
  };

  const loadData = async (me) => {
    const allUsers = await api.entities.User.list();
    setUsers(allUsers);
    setLoading(false);
  };

  const viewMember = async (user) => {
    setSelectedUser(user);
    setTxLoading(true);
    const txs = await api.entities.Transaction.filter({ member_email: user.email });
    setUserTransactions(txs);
    setTxLoading(false);
  };

  const approveAdmin = async (user) => {
    await api.entities.User.update(user.id, { role: "admin" });
    loadData();
  };

  const roleColor = {
    head_admin: "bg-purple-500/30 text-purple-300",
    admin: "bg-blue-500/30 text-blue-300",
    member: "bg-emerald-500/30 text-emerald-300",
    pending_admin: "bg-amber-500/30 text-amber-300",
  };

  const filtered = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const members = filtered.filter((u) => u.role === "member");
  const admins = filtered.filter((u) => u.role === "admin" || u.role === "head_admin");
  const pending = filtered.filter((u) => u.role === "pending_admin");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Members</h1>
          <p className="text-sm text-slate-400 mt-1">Manage cooperative members & admins</p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-500" />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-700/50 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending Admins */}
            {pending.length > 0 && currentUser?.role === "head_admin" && (
              <div>
                <h2 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Pending Admin Approvals
                </h2>
                <div className="space-y-2">
                  {pending.map((user) => (
                    <div key={user.id} className="bg-amber-950/30 border border-amber-700/40 rounded-xl px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-300">
                          {user.full_name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{user.full_name}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                    </div>
                    <Button size="sm" onClick={() => approveAdmin(user)} className="bg-emerald-600 hover:bg-emerald-700">
                      <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Approve
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admins */}
          {admins.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Admins ({admins.length})
              </h2>
              <div className="space-y-2">
                {admins.map((user) => (
                  <div key={user.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                        {user.full_name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.full_name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <Badge className={roleColor[user.role]}>{user.role === "head_admin" ? "Head Admin" : "Admin"}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members */}
          <div>
            <h2 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" /> Members ({members.length})
            </h2>
            {members.length === 0 ? (
              <div className="text-center py-12 text-stone-400 text-sm">No members found</div>
            ) : (
              <div className="space-y-2">
                {members.map((user) => (
                  <div
                    key={user.id}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-5 py-4 flex items-center justify-between hover:shadow-emerald-500/10 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => viewMember(user)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                        {user.full_name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.full_name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-semibold ${(user.balance || 0) > 0 ? "text-red-400" : "text-emerald-400"}`}>
                        {(user.balance || 0) > 0 ? '-' : ''}₱{Math.abs(user.balance || 0).toLocaleString()}
                      </span>
                      <Eye className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Member Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Member Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-lg font-bold text-emerald-600">
                  {selectedUser.full_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-semibold text-stone-800">{selectedUser.full_name}</p>
                  <p className="text-sm text-stone-400">{selectedUser.email}</p>
                  <p className="text-sm text-stone-400">{selectedUser.phone || "No phone"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-stone-50 rounded-lg p-3">
                  <p className="text-xs text-stone-400">Balance</p>
                  <p className={`font-bold ${(selectedUser.balance || 0) > 0 ? "text-red-500" : "text-emerald-600"}`}>
                    {(selectedUser.balance || 0) > 0 ? '-' : ''}₱{Math.abs(selectedUser.balance || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-stone-50 rounded-lg p-3">
                  <p className="text-xs text-stone-400">Address</p>
                  <p className="font-medium text-stone-700">{selectedUser.address || "—"}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-stone-700 mb-3">Transaction History</h4>
                {txLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-stone-100 rounded-lg animate-pulse" />)}
                  </div>
                ) : userTransactions.length === 0 ? (
                  <p className="text-sm text-stone-400 text-center py-6">No transactions</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {userTransactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2.5 text-sm">
                        <div>
                          <p className="font-medium text-stone-700 capitalize">{tx.type?.replace("_", " ")}</p>
                          <p className="text-[11px] text-stone-400">{tx.product_name}</p>
                        </div>
                        <span className="font-medium text-stone-600">₱{(tx.amount || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}