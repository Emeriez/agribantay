import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Users, Package, FileText, CalendarDays, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatCard from "../components/admin/StatCard";
import EventCard from "../components/admin/EventCard";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ members: 0, products: 0, pendingLoans: 0, events: 0 });
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    try {
      setAuthChecking(true); // Show blank loading state
      setLoading(true);
      
      // Try to get fresh user data from localStorage first
      let user = await api.auth.me();
      
      // If no user or user is not admin, redirect
      if (!user) {
        console.log('❌ AdminDashboard - No user found');
        navigate("/");
        return;
      }
      
      console.log('📊 AdminDashboard - User data:', { email: user.email, role: user.role, id: user.id });
      
      // Check if user is admin
      const isAdmin = user.role === "admin" || user.role === "head_admin";
      console.log('📊 AdminDashboard - Role check:', { role: user.role, isAdmin, equals_admin: user.role === "admin", equals_head_admin: user.role === "head_admin" });
      
      if (!isAdmin) {
        console.log('⚠️ AdminDashboard - User is NOT admin, role is:', user.role, '- Redirecting to MemberDashboard');
        navigate("/MemberDashboard");
        return;
      }
      
      console.log('✅ AdminDashboard - User is confirmed admin, loading data...');
      setUser(user); // Set user in state
      await loadData(); // Load data first
      setAuthChecking(false); // Only show content after data is loaded
    } catch (error) {
      console.error('❌ AdminDashboard - Error:', error);
      navigate("/");
    }
  };

  const loadData = async () => {
    const [users, productsData, loansData, allEvents] = await Promise.all([
      api.entities.User.list(),
      api.entities.Product.list(),
      api.entities.LoanRequest.filter({ status: "pending" }),
      api.entities.Event.list("-event_date", 10),
    ]);

    const memberList = users.filter(u => u.role === "member");
    setMembers(memberList);
    setProducts(productsData);
    setLoans(loansData);
    setStats({
      members: memberList.length,
      products: productsData.length,
      pendingLoans: loansData.length,
      events: allEvents.length,
    });
    setEvents(allEvents);
    setLoading(false);
  };

  const handleReset = async () => {
    if (!confirm('⚠️ This will clear ALL data (loans, transactions, users, products) and reset to demo data. Continue?')) {
      return;
    }
    
    setResetting(true);
    try {
      const response = await fetch('/api/admin/seed', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      alert('✅ Database reset successfully! Reloading...');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Reset error:', error);
      alert(`❌ Reset failed: ${error.message}`);
      setResetting(false);
    }
  };

  // Show blank screen during auth checking to prevent showing stale member dashboard content
  if (authChecking) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-200/30 border-t-emerald-400 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-6 lg:p-10">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-slate-700/50 rounded w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-700/50 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent mb-2">Dashboard</h1>
            <p className="text-slate-400">Welcome back, {user?.full_name?.split(" ")[0] || "Admin"}</p>
          </div>
          <Button
            onClick={handleReset}
            disabled={resetting}
            variant="outline"
            className="text-xs border-slate-600 text-slate-400 hover:text-red-400 hover:border-red-400/50"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            {resetting ? "Resetting..." : "Reset for Pilot"}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard 
            title="Total Members" 
            value={stats.members} 
            icon={Users} 
            color="emerald"
            items={members}
            renderItem={(member) => member.full_name || member.name || member.email}
          />
          <StatCard 
            title="Inventory Items" 
            value={stats.products} 
            icon={Package} 
            color="blue"
            items={products}
            renderItem={(product) => product.name}
          />
          <StatCard 
            title="Pending Loans" 
            value={stats.pendingLoans} 
            icon={FileText} 
            color="amber"
            items={loans}
            renderItem={(loan) => `Loan #${loan.id} - ${loan.amount || 0} units`}
          />
          <StatCard 
            title="Events" 
            value={stats.events} 
            icon={CalendarDays} 
            color="rose"
            items={events}
            renderItem={(event) => event.title || event.name}
          />
        </div>

        {/* Recent Events */}
        <div className="bg-emerald-950/40 backdrop-blur-md rounded-3xl border border-emerald-700/40 overflow-hidden shadow-2xl">
          <div className="px-8 py-6 border-b border-emerald-700/40 flex items-center justify-between bg-emerald-900/30">
            <div>
              <h2 className="text-xl font-bold text-white">Recent Events</h2>
              <p className="text-sm text-slate-300 mt-1">Latest announcements & activities</p>
            </div>
            <button
              onClick={() => navigate(createPageUrl("AdminEvents"))}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:shadow-emerald-500/40 transition-all duration-300"
            >
              View All →
            </button>
          </div>
          <div className="px-8 py-4">
            {events.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">No events yet</div>
            ) : (
              events.slice(0, 6).map((event) => (
                <EventCard key={event.id} event={event} compact />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}