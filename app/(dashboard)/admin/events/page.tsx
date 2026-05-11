"use client";

import { useState, useEffect } from "react";
import Header from "@/components/dashboard/Header";
import { Plus, Loader2, X, Calendar, MapPin, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Event { id: string; title: string; description: string | null; date: string; endDate: string | null; venue: string | null; organizer: string | null }

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", date: "", endDate: "", venue: "", organizer: "" });

  const fetchEvents = async () => {
    setLoading(true);
    const res = await fetch("/api/events");
    setEvents(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    setShowModal(false);
    setForm({ title: "", description: "", date: "", endDate: "", venue: "", organizer: "" });
    fetchEvents();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this event?")) return;
    await fetch("/api/events", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    fetchEvents();
  }

  return (
    <div>
      <Header title="Events" />
      <div className="p-6 space-y-5">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">{events.length} events</p>
          <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Event</button>
        </div>

        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((e) => {
              const isPast = new Date(e.date) < new Date();
              return (
                <div key={e.id} className="card p-5 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold ${isPast ? "bg-gray-400" : "bg-blue-600"}`}>
                        <div className="text-center">
                          <div>{new Date(e.date).toLocaleDateString("en-US", { month: "short" })}</div>
                          <div className="text-sm font-extrabold leading-none">{new Date(e.date).getDate()}</div>
                        </div>
                      </div>
                      <span className={`badge ${isPast ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"}`}>{isPast ? "Past" : "Upcoming"}</span>
                    </div>
                    <button onClick={() => handleDelete(e.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">{e.title}</h3>
                  {e.description && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{e.description}</p>}
                  <div className="flex flex-col gap-1 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDate(e.date)}{e.endDate ? ` – ${formatDate(e.endDate)}` : ""}</div>
                    {e.venue && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{e.venue}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">Add Event</h2><button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="label">Event Title *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" required /></div>
              <div><label className="label">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input h-20 resize-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Start Date *</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" required /></div>
                <div><label className="label">End Date</label><input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input" /></div>
                <div><label className="label">Venue</label><input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="input" /></div>
                <div><label className="label">Organizer</label><input value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} className="input" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Event"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
