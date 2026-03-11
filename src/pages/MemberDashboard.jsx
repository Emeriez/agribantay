import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/apiClient";
import { useNavigate } from "react-router-dom";
import { Wallet, TrendingDown, TrendingUp, CalendarDays } from "lucide-react";
import EventCarousel from "../components/member/EventCarousel";
import PullToRefresh from "../components/PullToRefresh";

export default function MemberDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    try {
      setAuthChecking(true); // Show blank loading state
      setLoading(true);
      
      // Get fresh user data from localStorage
      let user = await api.auth.me();
      
      // If no user found, redirect to login
      if (!user) {
        console.log('❌ MemberDashboard - No user found');
        navigate("/");
        return;
      }
      
      console.log('👥 MemberDashboard - User data:', { email: user.email, role: user.role, id: user.id });
      
      // Check if user is admin - if so, redirect them
      const isAdmin = user.role === "admin" || user.role === "head_admin";
      console.log('👥 MemberDashboard - Role check:', { role: user.role, isAdmin, equals_admin: user.role === "admin", equals_head_admin: user.role === "head_admin" });
      
      if (isAdmin) {
        console.log('⚠️ ADMIN DETECTED IN MEMBER DASHBOARD - User is admin, role is:', user.role, '- FORCE REDIRECTING to AdminDashboard');
        // Force redirect admin users away from member dashboard
        navigate("/AdminDashboard");
        return;
      }
      
      console.log('✅ MemberDashboard - User is confirmed member, loading data...');
      setUser(user); // Set user in state
      await loadData();
      setAuthChecking(false); // Auth verified, show content
    } catch (error) {
      console.error('❌ MemberDashboard - Error:', error);
      navigate("/");
      setAuthChecking(false); // Stop checking even on error
    }
  };

  const loadData = useCallback(async () => {
    const [me, allEvents] = await Promise.all([
      api.auth.me(),
      api.entities.Event.list("-event_date", 20),
    ]);
    setUser(me);
    setEvents(allEvents);
    setLoading(false);
  }, []);

  if (authChecking) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-10">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-teal-200 rounded w-48" />
          <div className="h-32 bg-teal-200 rounded-2xl" />
          <div className="h-48 bg-teal-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const balance = user?.balance || 0;
  const isNegative = balance < 0;

  return (
    <PullToRefresh onRefresh={loadData}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
        <div className="p-6 lg:p-10 max-w-5xl mx-auto">
          {/* Greeting */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Welcome, {user?.full_name?.split(" ")[0] || "Member"}
            </h1>
            <p className="text-sm text-slate-400 mt-1">Here's your cooperative overview</p>
          </div>

          {/* Balance Card */}
          <div className={`rounded-2xl p-6 mb-8 shadow-lg ${
            isNegative
              ? "bg-gradient-to-br from-red-900/80 to-red-700/60 border border-red-700/60"
              : "bg-gradient-to-br from-emerald-900/80 to-emerald-700/60 border border-emerald-700/60"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">Your Balance</p>
                <p className="text-4xl font-bold text-white">
                  {isNegative ? '-' : ''}₱{Math.abs(balance).toLocaleString()}
                </p>
                <p className={`text-xs mt-1 flex items-center gap-1 ${isNegative ? "text-red-200" : "text-emerald-200"}`}>
                  {isNegative ? (
                    <><TrendingDown className="w-3.5 h-3.5" /> You owe the cooperative</>
                  ) : (
                    <><TrendingUp className="w-3.5 h-3.5" /> Good standing</>
                  )}
                </p>
              </div>
              <div className={`p-4 rounded-2xl ${isNegative ? "bg-red-800/60" : "bg-emerald-800/60"}`}>
                <Wallet className={`w-8 h-8 ${isNegative ? "text-red-300" : "text-emerald-300"}`} />
              </div>
            </div>
          </div>

          {/* Events Section */}
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="w-5 h-5 text-cyan-300" />
              <h2 className="text-lg font-bold bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">Events & Announcements</h2>
            </div>
            <EventCarousel events={events} />
          </div>
        </div>
      </div>
    </PullToRefresh>
  );
}