"use client";

import { useCallback, useRef, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { generateCroppedImage } from "@/lib/utils/crop-image";
import { useModalA11y } from "@/lib/hooks/useModalA11y";

const DEFAULT_ASPECT = 4 / 3;

export function ImageCropEditor({
  imageSrc,
  onCancel,
  onConfirm,
  aspect = DEFAULT_ASPECT,
  eyebrow = "Image editor",
  title = "Crop & rotate photograph",
  hint,
}: {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
  aspect?: number;
  eyebrow?: string;
  title?: string;
  hint?: string;
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false);
  processingRef.current = processing;

  const handleClose = useCallback(() => {
    if (!processingRef.current) onCancel();
  }, [onCancel]);

  useModalA11y({
    open: true,
    onClose: handleClose,
  });

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    setError(null);
    try {
      const file = await generateCroppedImage(imageSrc, croppedAreaPixels, rotation);
      onConfirm(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not process image.");
      setProcessing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Edit photograph"
    >
      <div
        className="absolute inset-0 bg-charcoal/90"
        aria-hidden="true"
        onClick={processing ? undefined : onCancel}
      />

      <div className="admin-panel admin-deck relative z-10 flex w-full max-w-2xl flex-col rounded-sm">
        <div className="border-b border-charcoal/10 px-5 py-4 sm:px-6">
          <p className="font-mono text-crimson text-[10px] sm:text-xs tracking-[0.24em] uppercase mb-1">
            {eyebrow}
          </p>
          <h3 className="font-display text-xl sm:text-2xl text-charcoal leading-tight">
            {title}
          </h3>
          {hint ? (
            <p className="mt-1 font-body text-xs sm:text-sm text-slate-weathered">
              {hint}
            </p>
          ) : null}
        </div>

        <div className="relative h-64 w-full bg-charcoal sm:h-80">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            restrictPosition={false}
          />
        </div>

        <div className="space-y-4 px-5 py-4 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="crop-zoom" className="admin-label">
                Zoom
              </label>
              <input
                id="crop-zoom"
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="focus-ring w-full accent-crimson"
                aria-label="Zoom level"
              />
            </div>
            <div>
              <label htmlFor="crop-rotation" className="admin-label">
                Rotation · {rotation}°
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                  className="focus-ring tap-target justify-center border border-charcoal/20 px-3 text-sm museum-ease hover:border-charcoal/40"
                  aria-label="Rotate left 90 degrees"
                >
                  ⟲
                </button>
                <input
                  id="crop-rotation"
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="focus-ring w-full accent-crimson"
                  aria-label="Rotation degrees"
                />
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="focus-ring tap-target justify-center border border-charcoal/20 px-3 text-sm museum-ease hover:border-charcoal/40"
                  aria-label="Rotate right 90 degrees"
                >
                  ⟳
                </button>
              </div>
            </div>
          </div>

          {error ? (
            <p className="text-sm text-crimson" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={processing}
              className="focus-ring tap-target justify-center border border-charcoal/20 bg-transparent px-4 text-sm museum-ease hover:border-charcoal/40 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={processing || !croppedAreaPixels}
              className="focus-ring btn-primary tap-target justify-center px-6 text-sm tracking-wide disabled:opacity-60"
            >
              {processing ? "Processing…" : "Confirm crop"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
