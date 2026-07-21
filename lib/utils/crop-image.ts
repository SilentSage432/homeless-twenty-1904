import Resizer from "react-image-file-resizer";

export type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// Final stored dimensions (4:3). Keeps plaque assets light + consistent.
const MAX_WIDTH = 1600;
const MAX_HEIGHT = 1200;
const JPEG_QUALITY = 82;

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (err) => reject(err));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

/** Bounding box of an image after rotating by `rotation` degrees. */
function rotatedSize(width: number, height: number, rotation: number) {
  const rad = (rotation * Math.PI) / 180;
  return {
    width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
    height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
  };
}

/** Draw the source rotated, then extract the crop rectangle to a Blob. */
async function getCroppedBlob(
  imageSrc: string,
  crop: CropArea,
  rotation: number
): Promise<Blob> {
  const image = await createImage(imageSrc);

  const rotationCanvas = document.createElement("canvas");
  const rotationCtx = rotationCanvas.getContext("2d");
  if (!rotationCtx) throw new Error("Canvas 2D context unavailable.");

  const { width: boxWidth, height: boxHeight } = rotatedSize(
    image.width,
    image.height,
    rotation
  );
  rotationCanvas.width = boxWidth;
  rotationCanvas.height = boxHeight;

  rotationCtx.translate(boxWidth / 2, boxHeight / 2);
  rotationCtx.rotate((rotation * Math.PI) / 180);
  rotationCtx.drawImage(image, -image.width / 2, -image.height / 2);

  const cropCanvas = document.createElement("canvas");
  const cropCtx = cropCanvas.getContext("2d");
  if (!cropCtx) throw new Error("Canvas 2D context unavailable.");

  cropCanvas.width = Math.max(1, Math.round(crop.width));
  cropCanvas.height = Math.max(1, Math.round(crop.height));

  cropCtx.drawImage(
    rotationCanvas,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve, reject) => {
    cropCanvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not export image."))),
      "image/jpeg",
      0.92
    );
  });
}

/** Compress + downscale a File/Blob to the canonical plaque dimensions. */
function resizeToPlaqueFile(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    try {
      Resizer.imageFileResizer(
        file,
        MAX_WIDTH,
        MAX_HEIGHT,
        "JPEG",
        JPEG_QUALITY,
        0,
        (result) => resolve(result as File),
        "file"
      );
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Produce a cropped + rotated + resized JPEG File from the raw image source
 * and the pixel crop area reported by react-easy-crop.
 */
export async function generateCroppedImage(
  imageSrc: string,
  crop: CropArea,
  rotation: number
): Promise<File> {
  const blob = await getCroppedBlob(imageSrc, crop, rotation);
  const intermediate = new File([blob], `plaque-${Date.now()}.jpg`, {
    type: "image/jpeg",
  });
  return resizeToPlaqueFile(intermediate);
}
