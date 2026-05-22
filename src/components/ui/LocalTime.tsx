"use client";

import React, { useEffect, useState } from "react";

interface LocalTimeProps {
  dateStr: string;
  fallbackFormat?: boolean;
}

export default function LocalTime({ dateStr, fallbackFormat = false }: LocalTimeProps) {
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    try {
      const d = new Date(dateStr);
      // Ensure the date is valid
      if (!isNaN(d.getTime())) {
        if (fallbackFormat) {
          // eslint-disable-next-line
          setFormatted(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        } else {
          // eslint-disable-next-line
          setFormatted(d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }));
        }
      }
    } catch (e) {
      // Ignore invalid dates
    }
  }, [dateStr, fallbackFormat]);

  return (
    <span className="local-time" suppressHydrationWarning>
      {formatted || new Date(dateStr).toLocaleDateString('en-US', fallbackFormat ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}
