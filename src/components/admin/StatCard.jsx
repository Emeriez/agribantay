import React, { useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

/**
 * @typedef {Object} StatCardProps
 * @property {string} title
 * @property {number} value
 * @property {any} icon
 * @property {string} [color="emerald"]
 * @property {string} [subtitle]
 * @property {Array} [items] - Items to show in preview (optional)
 * @property {Function} [renderItem] - Function to render each item (optional)
 */

/**
 * @param {object} props
 * @param {string} props.title
 * @param {number} props.value
 * @param {any} props.icon
 * @param {string} [props.color]
 * @param {string} [props.subtitle]
 * @param {Array} [props.items]
 * @param {Function} [props.renderItem]
 */
export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color = "emerald", 
  subtitle = undefined,
  items = [],
  renderItem = (item) => item.name || item.full_name || item.title || String(item)
}) {
  const colorMap = {
    emerald: "bg-emerald-500/20 text-emerald-400",
    amber: "bg-amber-500/20 text-amber-400",
    blue: "bg-blue-500/20 text-blue-400",
    rose: "bg-rose-500/20 text-rose-400",
  };

  const hasPreview = items && items.length > 0;

  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <div className={`bg-gradient-to-br from-slate-800 to-slate-700/50 rounded-2xl border border-slate-700/50 p-6 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 ${hasPreview ? 'cursor-pointer' : ''}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
              <p className="text-4xl font-bold text-white mt-3">{value}</p>
              {subtitle && <p className="text-xs text-slate-500 mt-2">{subtitle}</p>}
            </div>
            <div className={`p-3 rounded-xl ${colorMap[color]}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </div>
      </HoverCardTrigger>
      
      {hasPreview && (
        <HoverCardContent className="">
          <div className="space-y-3">
            <p className="text-sm font-bold text-white">{title}</p>
            <div className="max-h-80 overflow-y-auto space-y-1">
              {items.slice(0, 15).map((item, index) => (
                <div key={index} className="text-sm text-slate-300 py-2 px-3 hover:bg-slate-700/50 rounded transition-colors">
                  {renderItem(item)}
                </div>
              ))}
              {items.length > 15 && (
                <div className="text-xs text-slate-500 italic py-2 px-3">
                  +{items.length - 15} more...
                </div>
              )}
            </div>
          </div>
        </HoverCardContent>
      )}
    </HoverCard>
  );
}