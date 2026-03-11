import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useNavigate } from "react-router-dom";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function MemberDetails() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    address: "",
    date_of_birth: "",
    phone: "",
    barangay: "",
  });

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    try {
      const me = await api.auth.me();
      setUser(me);
      setForm({
        full_name: me.full_name || "",
        address: me.address || "",
        date_of_birth: me.date_of_birth || "",
        phone: me.phone || "",
        barangay: me.barangay || "",
      });
      setLoading(false);
    } catch (error) {
      navigate("/");
    }
  };


  const handleSave = async () => {
    setSaving(true);
    // Optimistic update
    setUser((prev) => ({ ...prev, ...form }));
    toast.success("Details updated successfully!");
    await api.auth.updateMe(form);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-10">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-stone-200 rounded w-48" />
          <div className="h-64 bg-stone-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      <div className="p-6 lg:p-10 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Personal Details</h1>
          <p className="text-sm text-slate-400 mt-1">Update your personal information</p>
        </div>

        {/* Profile Header */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 mb-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-2xl font-bold text-emerald-400">
              {user?.full_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{user?.full_name}</h2>
              <p className="text-sm text-slate-400">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 text-white">
          <div className="space-y-5">
            <div>
              <Label>Full Name</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Your full name"
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="09xxxxxxxxx"
              />
            </div>
            <div>
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Your full address"
              />
            </div>
            <div>
              <Label>Barangay</Label>
              <Input
                value={form.barangay}
                onChange={(e) => setForm({ ...form, barangay: e.target.value })}
                placeholder="Your barangay"
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-500 mt-4 text-white">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>


      </div>
    </div>
  );
}