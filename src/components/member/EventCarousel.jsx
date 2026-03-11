import React, { useState, useRef } from "react";
import { format, isFuture, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, MapPin, Calendar } from "lucide-react";

export default function EventCarousel({ events }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);

  const scrollTo = (index) => {
    setCurrentIndex(index);
    const el = scrollRef.current;
    if (el) {
      const cardWidth = el.children[0]?.offsetWidth || 300;
      el.scrollTo({ left: index * (cardWidth + 16), behavior: "smooth" });
    }
  };

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 text-sm">No events to show</div>
    );
  }

  return (
    <div className="relative">
      {/* Navigation */}
      {events.length > 1 && (
        <>
          <button
            onClick={() => scrollTo(Math.max(0, currentIndex - 1))}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-slate-800 shadow-lg rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors text-white"
          >
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          </button>
          <button
            onClick={() => scrollTo(Math.min(events.length - 1, currentIndex + 1))}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-slate-800 shadow-lg rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors text-white"
          >
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </>
      )}

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {events.map((event) => {
          const eventDate = new Date(event.event_date);
          const isUpcoming = isFuture(eventDate);
          const isNow = isToday(eventDate);

          return (
            <div
              key={event.id}
              className="min-w-[280px] sm:min-w-[320px] snap-start bg-slate-800 rounded-2xl border border-slate-700/50 overflow-hidden hover:shadow-lg transition-all duration-300 flex-shrink-0 text-white"
            >
              {event.image_url ? (
                <img src={event.image_url} alt={event.title} className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36 bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
                  <Calendar className="w-10 h-10 text-emerald-300" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isNow ? "bg-emerald-100 text-emerald-700" :
                    isUpcoming ? "bg-blue-100 text-blue-700" :
                    "bg-slate-700 text-slate-400"
                  }`}>
                    {isNow ? "Today" : isUpcoming ? "Upcoming" : "Past"}
                  </span>
                </div>
                <h3 className="font-bold text-white text-sm mb-1 line-clamp-1">{event.title}</h3>
                {event.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 mb-2">{event.description}</p>
                )}
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(eventDate, "MMM dd, h:mm a")}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {event.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dots */}
      {events.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {events.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex ? "bg-emerald-500 w-5" : "bg-stone-200"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}