import * as faceapi from '@vladmandic/face-api';

let modelsLoaded = false;
let modelsLoading: Promise<void> | null = null;

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model';

export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;
  if (modelsLoading) return modelsLoading;

  modelsLoading = (async () => {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
  })();

  return modelsLoading;
}

export function isModelLoaded(): boolean {
  return modelsLoaded;
}

const detectorOptions = new faceapi.TinyFaceDetectorOptions({
  inputSize: 416,
  scoreThreshold: 0.5,
});

export interface FaceDetectionResult {
  descriptor: number[];
  photoDataUrl: string;
  confidence: number;
}

export async function detectFaceFromInput(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<FaceDetectionResult | null> {
  await loadModels();

  const detection = await faceapi
    .detectSingleFace(input, detectorOptions)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;

  const canvas = document.createElement('canvas');
  const targetEl = input as HTMLImageElement;
  canvas.width = targetEl.width || (input as HTMLVideoElement).videoWidth || 320;
  canvas.height = targetEl.height || (input as HTMLVideoElement).videoHeight || 240;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(input, 0, 0, canvas.width, canvas.height);
  }

  return {
    descriptor: Array.from(detection.descriptor),
    photoDataUrl: canvas.toDataURL('image/jpeg', 0.85),
    confidence: detection.detection.score,
  };
}

export async function detectFaceFromFile(file: File): Promise<FaceDetectionResult | null> {
  const img = await loadImageFromFile(file);
  return detectFaceFromInput(img);
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function compareDescriptors(
  desc1: number[],
  desc2: number[],
  threshold = 0.5
): { distance: number; isMatch: boolean } {
  const f1 = new Float32Array(desc1);
  const f2 = new Float32Array(desc2);
  const distance = faceapi.euclideanDistance(f1, f2);
  return { distance, isMatch: distance <= threshold };
}

export function findBestMatch(
  queryDescriptor: number[],
  knownDescriptors: { id: string; name: string; descriptor: number[] }[],
  threshold = 0.5
): { id: string | null; name: string | null; distance: number; isMatch: boolean } {
  let bestId: string | null = null;
  let bestName: string | null = null;
  let bestDistance = Infinity;

  for (const known of knownDescriptors) {
    const { distance } = compareDescriptors(queryDescriptor, known.descriptor, threshold);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestId = known.id;
      bestName = known.name;
    }
  }

  return {
    id: bestId,
    name: bestName,
    distance: bestDistance,
    isMatch: bestDistance <= threshold,
  };
}

export async function captureFromVideo(video: HTMLVideoElement): Promise<FaceDetectionResult | null> {
  return detectFaceFromInput(video);
}

export function canvasToDataUrl(canvas: HTMLCanvasElement, quality = 0.85): string {
  return canvas.toDataURL('image/jpeg', quality);
}
