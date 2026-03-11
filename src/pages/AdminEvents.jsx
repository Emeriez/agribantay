import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useNavigate } from "react-router-dom";
import { Plus, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import EventCard from "../components/admin/EventCard";

export default function AdminEvents() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_date: "",
    location: "",
    image_url: "",
  });

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    try {
      const me = await api.auth.me();
      setUser(me);
      await loadEvents();
    } catch (error) {
      console.error('Failed to load:', error);
      navigate("/");
    }
  };

  const loadEvents = async () => {
    const data = await api.entities.Event.list("-event_date");
    setEvents(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    setSaving(true);
    const user = await api.auth.me();
    await api.entities.Event.create({
      ...form,
      author_name: user.full_name,
      author_email: user.email,
      status: "upcoming",
    });
    setSaving(false);
    setShowForm(false);
    setForm({ title: "", description: "", event_date: "", location: "", image_url: "" });
    loadEvents();
  };

  const handleDelete = async (id) => {
    await api.entities.Event.delete(id);
    loadEvents();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Events</h1>
            <p className="text-sm text-slate-400 mt-1">Manage cooperative events & announcements</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white">
            <Plus className="w-4 h-4 mr-2" /> Create Event
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-slate-700/50 rounded-2xl animate-pulse" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <CalendarDays className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-400">No events yet. Create your first event!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((event) => (
              <div key={event.id} className="relative group">
                <EventCard event={event} />
              <button
                onClick={() => handleDelete(event.id)}
                className="absolute top-3 right-3 bg-white/90 text-red-500 text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Event Modal (Facebook-style post) */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-emerald-600" />
              Create Event
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Event Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="What's happening?"
                className="text-lg font-medium"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Tell everyone about the event..."
                className="min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={form.event_date}
                  onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Where?"
                />
              </div>
            </div>
            <div>
              <Label>Image URL (optional)</Label>
              <Input
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.title || !form.event_date} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Posting..." : "Post Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}