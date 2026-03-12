import React, { useState, useEffect, memo } from "react";
import { Sun, Moon } from "lucide-react";
// Light/dark mode toggle icon

import { Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "@/api/apiClient";
import { createPageUrl } from "@/utils";
import { pagesConfig } from './pages.config';
import PageNotFound from './lib/PageNotFound';
import AgriCureLogo from '@/components/AgriCureLogo';
import {
  Home,
  Warehouse,
  Users,
  Layers,
  Banknote,
  Zap,
  User as UserIcon,
  LogOut,
  Menu,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";

const adminLinks = [
  { name: "Dashboard", icon: Home, page: "AdminDashboard" },
  { name: "Inventory", icon: Warehouse, page: "AdminInventory" },
  { name: "Members", icon: Users, page: "AdminMembers" },
  { name: "Transactions", icon: Layers, page: "AdminTransactions" },
  { name: "Loan Requests", icon: Banknote, page: "AdminLoanRequests" },
  { name: "Events", icon: Zap, page: "AdminEvents" },
];

const memberLinks = [
  { name: "Dashboard", icon: Home, page: "MemberDashboard" },
  { name: "Inventory", icon: Warehouse, page: "MemberInventory" },
  { name: "My Loans", icon: Banknote, page: "MemberLoans" },
  { name: "My Details", icon: UserIcon, page: "MemberDetails" },
];

// Bottom tab links for mobile (max 4)
const adminTabLinks = [
  { name: "Dashboard", icon: Home, page: "AdminDashboard" },
  { name: "Inventory", icon: Warehouse, page: "AdminInventory" },
  { name: "Loans", icon: Banknote, page: "AdminLoanRequests" },
  { name: "Events", icon: Zap, page: "AdminEvents" },
];

const memberTabLinks = [
  { name: "Home", icon: Home, page: "MemberDashboard" },
  { name: "Inventory", icon: Warehouse, page: "MemberInventory" },
  { name: "Loans", icon: Banknote, page: "MemberLoans" },
  { name: "Profile", icon: UserIcon, page: "MemberDetails" },
];

const pageTitles = {
  AdminDashboard: "Dashboard",
  AdminInventory: "Inventory",
  AdminMembers: "Members",
  AdminTransactions: "Transactions",
  AdminLoanRequests: "Loan Requests",
  AdminEvents: "Events",
  MemberDashboard: "Dashboard",
  MemberInventory: "Inventory",
  MemberLoans: "My Loans",
  MemberDetails: "My Details",
};

import PropTypes from "prop-types";

const Layout = memo(function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [loanNotificationCount, setLoanNotificationCount] = useState(0);
  const [mode, setMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('agricure_mode') || 'dark';
    }
    return 'dark';
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('dark', 'light');
      document.documentElement.classList.remove('dark', 'light');
      document.body.classList.add(mode);
      document.documentElement.classList.add(mode);
    }
    localStorage.setItem('agricure_mode', mode);
  }, [mode]);

  // Clear loan notifications when viewing loan pages
  useEffect(() => {
    const currentPage = location.pathname.substring(1) || currentPageName;
    if (currentPage === 'MemberLoans' || currentPage === 'AdminLoanRequests') {
      setLoanNotificationCount(0);
    }
  }, [location.pathname, currentPageName]);

  const toggleMode = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'));

  const clearLoanNotifications = () => {
    setLoanNotificationCount(0);
  };

  const loadLoanNotifications = async (userEmail, userRole) => {
    try {
      if (userRole === 'member') {
        // For members: show count of newly actioned loans (not yet seen)
        const loans = await api.entities.LoanRequest.filter({ member_email: userEmail });
        const newlyActionedLoans = loans.filter((loan) => {
          // Show only if: status is approved/declined AND not yet marked as notified
          return loan.status !== 'pending' && (!loan.member_notified_at);
        });
        setLoanNotificationCount(newlyActionedLoans.length);
      } else if (userRole === 'admin' || userRole === 'head_admin') {
        // For admins: show count of pending loans
        const allLoans = await api.entities.LoanRequest.list();
        const pendingLoans = allLoans.filter((loan) => loan.status === 'pending');
        setLoanNotificationCount(pendingLoans.length);
      }
    } catch (error) {
      console.error('Error loading loan notifications:', error);
    }
  };

  const loadUser = async () => {
    const isAuth = await api.auth.isAuthenticated();
    if (!isAuth) {
      setLoading(false);
      return;
    }
    const me = await api.auth.me();
    console.log('👤 Layout loaded user:', me);
    setUser(me);
    
    // Load loan notifications (persist until user views the page)
    await loadLoanNotifications(me.email, me.role);
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-3">
          <Sprout className="w-10 h-10 text-emerald-600 animate-pulse" />
          <p className="text-stone-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Determine current page from URL
  const currentPage = location.pathname.substring(1) || currentPageName;
  const CurrentPage = pagesConfig.Pages[currentPage];

  // Public pages — no sidebar
  if (currentPage === "Landing") {
    return <>{CurrentPage ? <CurrentPage /> : children}</>;
  }

  const isAdmin = user?.role === "admin" || user?.role === "head_admin";
  const isPendingAdmin = user?.role === "pending_admin";
  const links = isAdmin ? adminLinks : memberLinks;

  console.log('🔑 Role check:', { isAdmin, role: user?.role, isPendingAdmin });

  if (isPendingAdmin) {
    return (
      <div className="h-screen flex items-center justify-center bg-transparent">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-10 max-w-md text-center">
          <Sprout className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-800 mb-2">Pending Approval</h2>
          <p className="text-stone-500 text-sm mb-6">
            Your admin registration is pending approval from the head administrator. You'll be notified once approved.
          </p>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                console.log("🔒 Logging out (pending admin)...");
                await api.auth.logout();
                console.log("✅ Logout completed. Redirecting...");
                // Redirect to login
                window.location.href = '/';
              } catch (error) {
                console.error("❌ Logout failed:", error);
                alert("Failed to log out. Please try again.");
              }
            }}
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </div>
    );
  }

  const tabLinks = isAdmin ? adminTabLinks : memberTabLinks;
  const pageTitle = pageTitles[currentPage] || currentPage.replace(/-/g, ' ');

  return (
    <div className="flex h-screen bg-transparent overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (desktop only) */}
      <aside
        className={`hidden lg:flex fixed lg:static inset-y-0 left-0 z-50 bg-teal-700 text-white transition-all duration-300 ease-in-out ${
          sidebarExpanded ? "w-64" : "w-20"
        } flex flex-col overflow-hidden`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {/* Logo */}
        <div className="px-3 py-5 border-b border-teal-600/40 flex-shrink-0">
          <div className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-300 to-cyan-400 rounded-lg flex items-center justify-center flex-shrink-0">
              <AgriCureLogo className="w-6 h-6" />
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${sidebarExpanded ? "opacity-100" : "opacity-0 hidden"}`}>
              <h1 className="text-lg font-bold tracking-tight whitespace-nowrap" style={{fontFamily: 'Segoe UI, Arial, sans-serif'}}>AGRICURE</h1>
              <p className="text-teal-100 text-[10px] uppercase tracking-widest" style={{fontFamily: 'Segoe UI, Arial, sans-serif'}}>
                {isAdmin ? "Admin Portal" : "Member Portal"}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const isActive = currentPage === link.page;
            const hasLoanNotification = (link.page === "MemberLoans" || link.page === "AdminLoanRequests") && loanNotificationCount > 0;
            return (
              <Link
                key={link.page}
                to={createPageUrl(link.page)}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 group/link h-12 relative ${
                  isActive
                    ? "bg-teal-600 text-white shadow-lg"
                    : "text-teal-100 hover:text-white hover:bg-teal-600/50"
                }`}
                title={!sidebarExpanded ? link.name : ""}
                style={{fontFamily: 'Segoe UI, Arial, sans-serif', fontSize: '15px'}}
              >
                <link.icon className={`w-6 h-6 flex-shrink-0 transition-all duration-200 will-change-transform ${
                  isActive ? "text-white" : "text-teal-200 group-hover/link:text-teal-300"
                }`} />
                <span className={`transition-all duration-300 whitespace-nowrap ${sidebarExpanded ? "opacity-100" : "opacity-0 hidden"}`}>
                  {link.name}
                </span>
                {hasLoanNotification && (
                  <div className={`absolute ${sidebarExpanded ? "right-3" : "top-1 right-1"} bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse`}>
                    {loanNotificationCount}
                  </div>
                )}
                {isActive && sidebarExpanded && <ChevronRight className="w-4 h-4 ml-auto text-teal-200" />}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-2 py-4 border-t border-teal-600/40 flex-shrink-0">
          <div className="flex items-center justify-center lg:justify-start gap-3 px-3 py-2 h-12">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-teal-400 flex items-center justify-center text-xs font-bold text-teal-900 flex-shrink-0">
              {user?.full_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className={`flex-1 min-w-0 transition-all duration-300 overflow-hidden ${sidebarExpanded ? "opacity-100" : "opacity-0 hidden"}`}>
              <p className="text-sm font-semibold text-white truncate" style={{fontFamily: 'Segoe UI, Arial, sans-serif'}}>{user?.full_name || "User"}</p>
              <p className="text-[12px] text-teal-100 truncate" style={{fontFamily: 'Segoe UI, Arial, sans-serif'}}>{user?.email}</p>
            </div>
            <button
              onClick={async () => {
                try {
                  console.log("🔒 Logging out (sidebar)...");
                  await api.auth.logout();
                  console.log("✅ Logout completed. Redirecting...");
                  // Redirect to login
                  window.location.href = '/';
                } catch (error) {
                  console.error("❌ Logout failed:", error);
                  alert("Failed to log out. Please try again.");
                }
              }}
              className="p-1.5 rounded-lg hover:bg-teal-600 text-teal-100 hover:text-white transition-all duration-200 flex-shrink-0 will-change-transform"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-teal-700 text-white transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col`}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-teal-600/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-300 to-cyan-400 rounded-lg flex items-center justify-center">
              <Sprout className="w-6 h-6 text-teal-900 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight" style={{fontFamily: 'Segoe UI, Arial, sans-serif'}}>AGRICURE</h1>
              <p className="text-teal-100 text-[10px] uppercase tracking-widest" style={{fontFamily: 'Segoe UI, Arial, sans-serif'}}>
                {isAdmin ? "Admin Portal" : "Member Portal"}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const isActive = currentPage === link.page;
            const hasLoanNotification = (link.page === "MemberLoans" || link.page === "AdminLoanRequests") && loanNotificationCount > 0;
            return (
              <Link
                key={link.page}
                to={createPageUrl(link.page)}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 group/link relative ${
                  isActive
                    ? "bg-teal-600 text-white shadow-lg"
                    : "text-teal-100 hover:text-white hover:bg-teal-600/50"
                }`}
                style={{fontFamily: 'Segoe UI, Arial, sans-serif', fontSize: '15px'}}
              >
                <link.icon className={`w-6 h-6 transition-all duration-200 ${
                  isActive ? "text-white" : "text-teal-200 group-hover/link:text-teal-300"
                }`} />
                <span>{link.name}</span>
                {hasLoanNotification && (
                  <div className="absolute right-3 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {loanNotificationCount}
                  </div>
                )}
                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-teal-200" />}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-teal-600/40">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-teal-400 flex items-center justify-center text-xs font-bold text-teal-900">
              {user?.full_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate" style={{fontFamily: 'Segoe UI, Arial, sans-serif'}}>{user?.full_name || "User"}</p>
              <p className="text-[12px] text-teal-100 truncate" style={{fontFamily: 'Segoe UI, Arial, sans-serif'}}>{user?.email}</p>
            </div>
            <button
              onClick={async () => {
                try {
                  console.log("🔒 Logging out (sidebar)...");
                  await api.auth.logout();
                  console.log("✅ Logout completed. Redirecting...");
                  // Redirect to login
                  window.location.href = '/';
                } catch (error) {
                  console.error("❌ Logout failed:", error);
                  alert("Failed to log out. Please try again.");
                }
              }}
              className="p-1.5 rounded-lg hover:bg-teal-600 text-teal-100 hover:text-white transition-all duration-200 will-change-transform"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile sticky top header */}
        <header
          className="lg:hidden bg-transparent border-b border-teal-200 flex items-center gap-3 px-4 z-30 sticky top-0"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 10px)", paddingBottom: "10px" }}
        >
          <button onClick={() => setSidebarOpen(true)} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-teal-100 text-teal-600">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-teal-800 text-base flex-1" style={{fontFamily: 'Segoe UI, Arial, sans-serif'}}>Mobile Settings</span>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-400 flex items-center justify-center text-xs font-bold text-teal-900">
            {user?.full_name?.[0]?.toUpperCase() || "?"}
          </div>
        </header>

        <div
          className="flex-1 overflow-hidden relative"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom) + 64px)",
            background: mode === 'dark'
              ? 'linear-gradient(to bottom right, #0f172a, #1e293b)'
              : 'linear-gradient(to bottom right, #e6f9f0, #d1fae5 60%, #f0fdf4 100%)'
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="absolute inset-0 overflow-y-auto lg:pb-0"
              style={{ background: "transparent" }}
            >
              {CurrentPage ? <CurrentPage /> : <PageNotFound />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile bottom tab bar */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-teal-700/95 to-teal-700 border-t border-teal-600/40 z-30 flex"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {tabLinks.map((link) => {
            const isActive = currentPage === link.page;
            const hasLoanNotification = (link.page === "MemberLoans" || link.page === "AdminLoanRequests") && loanNotificationCount > 0;
            return (
              <Link
                key={link.page}
                to={createPageUrl(link.page)}
                className={`flex-1 flex flex-col items-center justify-center min-h-[50px] py-2 gap-1 transition-all duration-200 relative ${
                  isActive ? "text-white bg-teal-600/40" : "text-teal-100 hover:text-white"
                }`}
                style={{fontFamily: 'Segoe UI, Arial, sans-serif'}}
              >
                <div className="relative">
                  <link.icon className={`w-6 h-6 transition-all duration-200 ${isActive ? 'scale-110' : ''}`} />
                  {hasLoanNotification && (
                    <div className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                      {loanNotificationCount}
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-semibold">{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
});


Layout.propTypes = {
  children: PropTypes.node,
  currentPageName: PropTypes.string
};

export default Layout;