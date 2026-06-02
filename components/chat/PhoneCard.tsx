"use client";

import { Phone } from "@/types";

interface Props {
  phone: Phone;
  isRecommended?: boolean;
}

export default function PhoneCard({ phone, isRecommended }: Props) {
  if (!phone) return null;

  return (
    <div
      className="relative rounded-xl p-3 transition-all duration-200"
      style={{
        background: "#13131f",
        border: isRecommended ? "1px solid #6d28d9" : "1px solid #2e2e4a",
        boxShadow: isRecommended ? "0 0 0 1px #6d28d920" : "none",
      }}
    >
      {isRecommended && (
        <span
          className="absolute -top-2 -right-2 text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: "#6d28d9", color: "#fff" }}
        >
          Top Pick
        </span>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-2.5">
        <div className="min-w-0 pr-2">
          <h3 className="font-semibold text-sm truncate" style={{ color: "#e2e2f0" }}>{phone.name}</h3>
          <p className="text-xs mt-0.5" style={{ color: "#6b6b8a" }}>{phone.brand}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-sm" style={{ color: "#a78bfa" }}>
            ₹{phone.price?.current?.toLocaleString()}
          </p>
          {phone.price?.discount > 0 && (
            <p className="text-xs" style={{ color: "#34d399" }}>{phone.price.discount}% off</p>
          )}
        </div>
      </div>

      {/* Specs */}
      <div className="grid grid-cols-2 gap-1 text-xs" style={{ color: "#8b8ba7" }}>
        {[
          { icon: "🔲", label: phone.specs?.ram ? `${phone.specs.ram}GB RAM` : null },
          { icon: "💾", label: phone.specs?.storage ? `${phone.specs.storage}GB` : null },
          { icon: "🔋", label: phone.specs?.battery?.capacity ? `${phone.specs.battery.capacity}mAh` : null },
          { icon: "📷", label: phone.specs?.camera?.rear?.main ? `${phone.specs.camera.rear.main}MP` : null },
          { icon: "📶", label: phone.specs?.connectivity?.network ?? null },
          { icon: "🖥", label: phone.specs?.display?.refreshRate ? `${phone.specs.display.refreshRate}Hz` : null },
        ].filter((spec) => spec.label).map((spec) => (
          <div
            key={spec.label}
            className="flex items-center gap-1 px-2 py-1 rounded-lg"
            style={{ background: "#1e1e32" }}
          >
            <span>{spec.icon}</span>
            <span className="truncate">{spec.label}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between mt-2.5 pt-2"
        style={{ borderTop: "1px solid #2e2e4a" }}
      >
        <div className="flex items-center gap-1">
          <span className="text-yellow-400 text-xs">★</span>
          <span className="text-xs" style={{ color: "#6b6b8a" }}>{phone.rating ?? "—"}/5</span>
        </div>
        <div className="flex gap-1 flex-wrap justify-end">
          {phone.tags?.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{ background: "#2a1f4a", color: "#a78bfa" }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
