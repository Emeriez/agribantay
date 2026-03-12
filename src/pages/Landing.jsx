import React, { useEffect, useState } from "react";
import { api } from "@/api/apiClient";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { AlertCircle, Sprout } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await api.auth.isAuthenticated();
      if (isAuth) {
        const user = await api.auth.me();
        console.log('🔍 checkAuth - Found authenticated user:', { email: user?.email, role: user?.role, isAdmin: user?.role === "admin" || user?.role === "head_admin" });
        
        // Defensive check: ensure role exists
        if (!user?.role) {
          console.error('❌ checkAuth - User missing role field!');
          localStorage.clear();
          window.location.reload();
          return;
        }
        
        const isAdmin = user.role === "admin" || user.role === "head_admin";
        const destination = isAdmin ? "AdminDashboard" : "MemberDashboard";
        console.log('🚀 checkAuth - Redirecting to:', destination, 'with role:', user.role);
        navigate(createPageUrl(destination));
      } else {
        setChecking(false);
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      setChecking(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await api.auth.login(email, password);
      
      console.log('='.repeat(50));
      console.log('🔐 LOGIN RETURNED TO Landing.jsx');
      console.log('='.repeat(50));
      console.log('user object:', user);
      console.log('user.email:', user.email);
      console.log('user.id:', user.id);
      console.log('user.role:', user.role);
      console.log('typeof user.role:', typeof user.role);
      console.log('-'.repeat(50));
      
      // Test each condition explicitly
      const checkAdmin = user.role === "admin";
      const checkHeadAdmin = user.role === "head_admin";
      const isAdmin = checkAdmin || checkHeadAdmin;
      
      console.log('🔐 Role condition checks:');
      console.log('  user.role === "admin":', checkAdmin);
      console.log('  user.role === "head_admin":', checkHeadAdmin);
      console.log('  isAdmin (OR result):', isAdmin);
      console.log('-'.repeat(50));
      
      // Defensive check: validate user object
      if (!user || !user.role || !user.email || !user.id) {
        console.error('❌ Login response missing required fields:', { hasUser: !!user, hasRole: !!user?.role, hasEmail: !!user?.email, hasId: !!user?.id });
        setError('Invalid login response from server');
        setLoading(false);
        return;
      }
      
      // Make redirection decision based on role
      let destination = isAdmin ? "AdminDashboard" : "MemberDashboard";
      
      console.log('🚀 REDIRECT DECISION FINAL:');
      console.log('  isAdmin:', isAdmin);
      console.log('  destination:', destination);
      console.log('  user.role:', user.role);
      console.log('='.repeat(50));
      
      // SAFEGUARD: If role is "admin" but destination is not AdminDashboard, force correct destination
      if ((user.role === "admin" || user.role === "head_admin") && destination !== "AdminDashboard") {
        console.error('❌ ERROR: Detected role/destination mismatch! Admin user going to:', destination);
        console.error('  FORCE CORRECTING to: AdminDashboard');
        destination = "AdminDashboard";
        navigate(createPageUrl("AdminDashboard"));
        return;
      }
      
      // Use hard redirect (like logout does) to ensure fresh page load and state
      console.log('🚀 REDIRECTING TO:', createPageUrl(destination));
      window.location.href = createPageUrl(destination);
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.message || "Invalid email or password");
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50">
        <Sprout className="w-10 h-10 text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-400 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-300 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-emerald-400/20">
            <Sprout className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight mb-2">
            AgriCure
          </h1>
          <p className="text-emerald-300/70 text-lg font-light">
            Agricultural Cooperative Management System
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-emerald-400/20 p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-emerald-200 text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full bg-white/5 border border-emerald-400/30 rounded-lg px-4 py-3 text-white placeholder-emerald-300/50 focus:outline-none focus:border-emerald-400 transition-colors"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-emerald-200 text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-emerald-400/30 rounded-lg px-4 py-3 text-white placeholder-emerald-300/50 focus:outline-none focus:border-emerald-400 transition-colors"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/20 border border-red-400/50 rounded-lg p-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/30 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Test Credentials */}
          <div className="mt-8 pt-8 border-t border-emerald-400/20">
            <p className="text-emerald-300/60 text-xs font-semibold mb-3 uppercase tracking-wider">
              Test Credentials
            </p>
            <div className="space-y-2 text-xs text-emerald-300/50">
              <div className="flex justify-between">
                <span>Admin:</span>
                <span className="font-mono">admin@example.com / admin123</span>
              </div>
              <div className="flex justify-between">
                <span>Member 1:</span>
                <span className="font-mono">member1@example.com / member123</span>
              </div>
              <div className="flex justify-between">
                <span>Member 2:</span>
                <span className="font-mono">member2@example.com / member123</span>
              </div>
              <div className="flex justify-between">
                <span>Member 3:</span>
                <span className="font-mono">member3@example.com / member123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}