import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

export interface SignaturePadHandle {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string;
  fromDataURL: (data: string) => void;
}

interface SignaturePadProps {
  initialDataUrl?: string;
  onChange?: (hasSignature: boolean) => void;
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ initialDataUrl, onChange }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sigRef = useRef<SignatureCanvas>(null);
    const [size, setSize] = useState<{ w: number; h: number } | null>(null);

    useEffect(() => {
      if (!containerRef.current) return;
      const measure = () => {
        const w = containerRef.current?.clientWidth ?? 320;
        setSize({ w: Math.max(280, Math.floor(w)), h: 180 });
      };
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(containerRef.current);
      return () => ro.disconnect();
    }, []);

    useEffect(() => {
      if (!size || !sigRef.current || !initialDataUrl) return;
      try {
        sigRef.current.fromDataURL(initialDataUrl, { width: size.w, height: size.h });
        onChange?.(true);
      } catch {
        // ignore decoding errors
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [size]);

    useImperativeHandle(ref, () => ({
      clear: () => {
        sigRef.current?.clear();
        onChange?.(false);
      },
      isEmpty: () => sigRef.current?.isEmpty() ?? true,
      toDataURL: () => sigRef.current?.toDataURL("image/png") ?? "",
      fromDataURL: (data: string) => {
        if (size) sigRef.current?.fromDataURL(data, { width: size.w, height: size.h });
      },
    }));

    return (
      <div ref={containerRef} className="w-full">
        {size && (
          <SignatureCanvas
            ref={sigRef}
            penColor="#0f172a"
            backgroundColor="#ffffff"
            canvasProps={{
              width: size.w,
              height: size.h,
              className: "block rounded-md w-full",
              style: { touchAction: "none", width: "100%", height: `${size.h}px` },
            }}
            onEnd={() => onChange?.(true)}
          />
        )}
      </div>
    );
  }
);

SignaturePad.displayName = "SignaturePad";
