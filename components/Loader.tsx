"use client";

import { Infinity } from "ldrs/react";
import "ldrs/react/Infinity.css";

export default function Loader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Infinity
        size="55"
        stroke="4"
        strokeLength="0.15"
        bgOpacity="0.1"
        speed="1.3"
        color="#7c3aed"
      />
      {label && (
        <p className="text-sm" style={{ color: "#8b8ba7" }}>
          {label}
        </p>
      )}
    </div>
  );
}
