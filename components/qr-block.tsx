"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrBlock({ value, label }: { value: string; label: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let ignore = false;
    QRCode.toString(value, {
      type: "svg",
      margin: 1,
      width: 240,
      errorCorrectionLevel: "M",
      color: { dark: "#24352d", light: "#fffdf8" },
    })
      .then((markup) => {
        if (!ignore) setSvg(markup);
      })
      .catch(() => {
        if (!ignore) setFailed(true);
      });
    return () => {
      ignore = true;
    };
  }, [value]);

  return (
    <div className="mx-auto w-52 rounded-3xl bg-card p-3 shadow-sm ring-1 ring-foreground/10">
      {svg ? (
        <div
          className="[&_svg]:h-auto [&_svg]:w-full"
          role="img"
          aria-label={label}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="flex aspect-square items-center justify-center text-center text-sm text-muted-foreground">
          {failed ? "The QR code didn't draw. Copy the link instead." : "Drawing the QR…"}
        </div>
      )}
    </div>
  );
}
