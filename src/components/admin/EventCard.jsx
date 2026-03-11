import React from "react";
import { format, isFuture, isToday } from "date-fns";
import { MapPin, Calendar } from "lucide-react";

export default function EventCard({ event, compact = false }) {
  const eventDate = new Date(event.event_date);
  const isUpcoming = isFuture(eventDate);
  const isOngoing = isToday(eventDate);

  const statusColor = isOngoing
    ? "bg-emerald-500/30 text-emerald-300"
    : isUpcoming
    ? "bg-blue-500/30 text-blue-300"
    : "bg-slate-500/30 text-slate-300";

  const statusText = isOngoing ? "Today" : isUpcoming ? "Upcoming" : "Past";

  if (compact) {
    return (
      <div className="flex items-center gap-4 py-3 border-b border-slate-600/30 last:border-0 hover:bg-slate-600/10 transition-colors">
        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-emerald-400 uppercase">
            {format(eventDate, "MMM")}
          </span>
          <span className="text-lg font-bold text-emerald-300 leading-none">
            {format(eventDate, "dd")}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">{event.title}</p>
          <p className="text-xs text-slate-400 truncate">{event.location || "No location set"}</p>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${statusColor}`}>
          {statusText}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden hover:shadow-emerald-500/20 hover:shadow-lg transition-all duration-300">
      {event.image_url && (
        <img src={event.image_url} alt={event.title} className="w-full h-40 object-cover" />
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${statusColor}`}>
            {statusText}
          </span>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{event.title}</h3>
        {event.description && (
          <p className="text-sm text-slate-400 mb-3 line-clamp-2">{event.description}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {format(eventDate, "MMM dd, yyyy 'at' h:mm a")}
          </span>
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {event.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}