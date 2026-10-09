import { useEffect, useState, useCallback, useRef } from 'react';
import {
  ScanFace,
  Camera,
  CameraOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Loader2,
  Upload,
  Cctv,
  Link2,
  Monitor,
} from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import { useCctvStream } from '@/hooks/useCctvStream';
import {
  loadModels,
  detectFaceFromInput,
  detectFaceFromFile,
  findBestMatch,
  type FaceDetectionResult,
} from '@/lib/faceApi';
import { supabase } from '@/lib/supabase';
import type { Citizen, ViolationSource } from '@/types';
import { Card, Button, Badge, Spinner, Input } from '@/components/ui';
import type { Page, NavigationData } from '@/App';

interface MatchResult {
  citizen: Citizen;
  distance: number;
}

type InputMode = 'camera' | 'cctv-live' | 'cctv-upload';

export function FaceRecognition({ onNavigate }: { onNavigate: (page: Page, data?: unknown) => void }) {
  const { videoRef, isActive, error, startCamera, stopCamera } = useCamera();
  const cctv = useCctvStream();
  const [inputMode, setInputMode] = useState<InputMode>('camera');
  const [modelStatus, setModelStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [scanning, setScanning] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [noMatch, setNoMatch] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [lastDetection, setLastDetection] = useState<FaceDetectionResult | null>(null);
  const [citizenViolations, setCitizenViolations] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [cctvUrl, setCctvUrl] = useState('');
  const [cctvName, setCctvName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeVideoRef = inputMode === 'cctv-live' ? cctv.videoRef : videoRef;
  const isStreamActive = inputMode === 'cctv-live' ? cctv.isActive : isActive;

  useEffect(() => {
    setModelStatus('loading');
    loadModels().then(() => setModelStatus('ready')).catch(() => setModelStatus('error'));
  }, []);

  const performMatch = useCallback(async (detection: FaceDetectionResult) => {
    setCapturedPhoto(detection.photoDataUrl);
    setLastDetection(detection);

    const { data: citizens, error: fetchErr } = await supabase.from('citizens').select('*');
    if (fetchErr) throw fetchErr;
    if (!citizens || citizens.length === 0) { setNoMatch(true); return; }

    const knownDescriptors = citizens.map((c: Citizen) => ({
      id: c.id, name: c.full_name, descriptor: c.face_descriptor,
    }));
    const match = findBestMatch(detection.descriptor, knownDescriptors, 0.5);

    if (match.isMatch && match.id) {
      const matchedCitizen = citizens.find((c: Citizen) => c.id === match.id);
      if (matchedCitizen) {
        setMatchResult({ citizen: matchedCitizen, distance: match.distance });
        const { count } = await supabase
          .from('violations').select('id', { count: 'exact', head: true }).eq('citizen_id', matchedCitizen.id);
        setCitizenViolations(count || 0);
      }
    } else {
      setNoMatch(true);
    }
  }, []);

  const handleScan = useCallback(async () => {
    if (!activeVideoRef.current || !isStreamActive) return;
    setScanning(true);
    setMatchResult(null);
    setNoMatch(false);
    try {
      const detection = await detectFaceFromInput(activeVideoRef.current);
      if (!detection) { setNoMatch(true); return; }
      await performMatch(detection);
    } catch {
      setNoMatch(true);
    } finally {
      setScanning(false);
    }
  }, [activeVideoRef, isStreamActive, performMatch]);

  const handleFileUpload = useCallback(async (file: File) => {
    setScanning(true);
    setMatchResult(null);
    setNoMatch(false);
    setUploadError(null);
    setCapturedPhoto(null);
    setLastDetection(null);
    try {
      const detection = await detectFaceFromFile(file);
      if (!detection) { setUploadError('No face detected in the uploaded image.'); setScanning(false); return; }
      await performMatch(detection);
    } catch {
      setUploadError('Failed to process the image.');
    } finally {
      setScanning(false);
    }
  }, [performMatch]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleReset = () => {
    setMatchResult(null);
    setNoMatch(false);
    setCapturedPhoto(null);
    setLastDetection(null);
    setCitizenViolations(0);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const switchMode = (mode: InputMode) => {
    handleReset();
    if (isActive) stopCamera();
    if (cctv.isActive) cctv.disconnect();
    setInputMode(mode);
  };

  const handleConnectCctv = () => {
    if (cctvUrl.trim()) {
      cctv.connectStream(cctvUrl.trim());
    }
  };

  const currentSource: ViolationSource = inputMode === 'camera' ? 'camera' : 'cctv';
  const navigateToIssueFine = (data: NavigationData) => onNavigate('issue-fine', data);

  const renderInputSection = () => {
    if (inputMode === 'camera') {
      return (
        <>
          <div className="relative aspect-[4/3] bg-slate-900">
            <video ref={videoRef} className={`h-full w-full object-cover ${isActive ? 'opacity-100' : 'opacity-0'}`} autoPlay playsInline muted />
            {!isActive && !capturedPhoto && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <ScanFace className="h-16 w-16 mb-3" />
                <p className="text-sm">Camera is off</p>
              </div>
            )}
            {capturedPhoto && !isActive && <img src={capturedPhoto} alt="Captured" className="h-full w-full object-cover" />}
            {isActive && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white/60 rounded-2xl" />
                {scanning && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-blue-400 rounded-2xl animate-pulse" />}
              </div>
            )}
          </div>
          <div className="flex gap-3 p-4">
            {!isActive ? (
              <Button onClick={startCamera} disabled={modelStatus !== 'ready'} className="flex-1">
                <Camera className="h-4 w-4" /> Start Camera
              </Button>
            ) : (
              <>
                <Button onClick={handleScan} disabled={scanning || modelStatus !== 'ready'} className="flex-1">
                  {scanning ? <><Spinner className="h-4 w-4" /> Scanning...</> : <><ScanFace className="h-4 w-4" /> Scan Face</>}
                </Button>
                <Button variant="secondary" onClick={stopCamera}><CameraOff className="h-4 w-4" /></Button>
              </>
            )}
          </div>
          {error && <p className="px-4 pb-3 text-xs text-red-600">{error}</p>}
        </>
      );
    }

    if (inputMode === 'cctv-live') {
      return (
        <>
          {/* CCTV Connection */}
          <div className="border-b border-slate-100 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Monitor className="h-4 w-4 text-slate-400" /> Connect to Live CCTV Camera
            </div>
            <div className="flex gap-2">
              <Input
                value={cctvUrl}
                onChange={(e) => setCctvUrl(e.target.value)}
                placeholder="Stream URL (e.g., http://camera-ip/stream)"
                className="flex-1"
              />
              <Button
                onClick={handleConnectCctv}
                disabled={!cctvUrl.trim() || cctv.loading || modelStatus !== 'ready'}
              >
                {cctv.loading ? <Spinner className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                Connect
              </Button>
            </div>
            <Input
              value={cctvName}
              onChange={(e) => setCctvName(e.target.value)}
              placeholder="Camera name (e.g., MG Road Camera 1)"
            />
          </div>

          {/* Video Feed */}
          <div className="relative aspect-[4/3] bg-slate-900">
            <video
              ref={cctv.videoRef}
              className={`h-full w-full object-cover ${cctv.isActive ? 'opacity-100' : 'opacity-0'}`}
              autoPlay
              playsInline
              muted
            />
            {!cctv.isActive && !capturedPhoto && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <Cctv className="h-16 w-16 mb-3" />
                <p className="text-sm">No CCTV stream connected</p>
                <p className="text-xs text-slate-500 mt-1">Enter a stream URL above to connect</p>
              </div>
            )}
            {capturedPhoto && !cctv.isActive && <img src={capturedPhoto} alt="CCTV capture" className="h-full w-full object-cover" />}
            {cctv.isActive && (
              <>
                <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-red-600/90 px-2.5 py-1 text-xs font-medium text-white">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" /> LIVE
                </div>
                {cctvName && (
                  <div className="absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
                    {cctvName}
                  </div>
                )}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white/60 rounded-2xl" />
                  {scanning && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-blue-400 rounded-2xl animate-pulse" />}
                </div>
              </>
            )}
          </div>
          <div className="flex gap-3 p-4">
            {cctv.isActive ? (
              <>
                <Button onClick={handleScan} disabled={scanning || modelStatus !== 'ready'} className="flex-1">
                  {scanning ? <><Spinner className="h-4 w-4" /> Scanning...</> : <><ScanFace className="h-4 w-4" /> Scan Face</>}
                </Button>
                <Button variant="secondary" onClick={cctv.disconnect}>
                  <CameraOff className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <p className="text-xs text-slate-400 px-1">Connect to a CCTV stream to start scanning</p>
            )}
          </div>
          {cctv.error && <p className="px-4 pb-3 text-xs text-red-600">{cctv.error}</p>}
        </>
      );
    }

    // cctv-upload mode
    return (
      <>
        <div
          className={`relative aspect-[4/3] flex flex-col items-center justify-center border-2 border-dashed transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'}`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          {capturedPhoto ? (
            <img src={capturedPhoto} alt="CCTV capture" className="h-full w-full object-cover" />
          ) : scanning ? (
            <div className="flex flex-col items-center text-slate-500">
              <Spinner className="h-10 w-10 mb-3" />
              <p className="text-sm">Analyzing image...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-slate-400 px-6 text-center">
              <Cctv className="h-16 w-16 mb-3" />
              <p className="text-sm font-medium text-slate-600">Upload CCTV Footage</p>
              <p className="mt-1 text-xs text-slate-400">Drag and drop a screenshot, or click to browse</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => fileInputRef.current?.click()} disabled={modelStatus !== 'ready'}>
                <Upload className="h-4 w-4" /> Choose Image
              </Button>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        </div>
        <div className="flex gap-3 p-4">
          {capturedPhoto && <Button variant="outline" onClick={handleReset} className="flex-1">Upload Another</Button>}
        </div>
        {uploadError && <p className="px-4 pb-3 text-xs text-red-600">{uploadError}</p>}
      </>
    );
  };

  const navDataWithCctvName = (data: NavigationData): NavigationData => ({
    ...data,
    cctvCameraName: inputMode === 'cctv-live' && cctvName ? cctvName : undefined,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Face Recognition</h1>
        <p className="mt-1 text-sm text-slate-500">
          Identify a person by face — using live camera, live CCTV stream, or CCTV screenshot
        </p>
      </div>

      {/* Model status */}
      <div className="flex items-center gap-2 text-sm">
        {modelStatus === 'loading' && (
          <span className="flex items-center gap-2 text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading face recognition models...
          </span>
        )}
        {modelStatus === 'ready' && (
          <span className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" /> Recognition engine ready
          </span>
        )}
        {modelStatus === 'error' && (
          <span className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4" /> Failed to load models. Refresh the page.
          </span>
        )}
      </div>

      {/* Mode Toggle — 3 options */}
      <div className="inline-flex flex-wrap rounded-lg border border-slate-200 bg-white p-1">
        <button onClick={() => switchMode('camera')} className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${inputMode === 'camera' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Camera className="h-4 w-4" /> Live Camera
        </button>
        <button onClick={() => switchMode('cctv-live')} className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${inputMode === 'cctv-live' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Cctv className="h-4 w-4" /> Live CCTV
        </button>
        <button onClick={() => switchMode('cctv-upload')} className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${inputMode === 'cctv-upload' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Upload className="h-4 w-4" /> CCTV Upload
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card className="overflow-hidden">
          {renderInputSection()}
        </Card>

        {/* Results Section */}
        <div className="space-y-4">
          {matchResult && (
            <Card className="border-emerald-200 bg-emerald-50/50 p-5">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                <h2 className="text-base font-semibold">Person Identified</h2>
              </div>
              <div className="mt-4 flex gap-4">
                {matchResult.citizen.photo_url && (
                  <img src={matchResult.citizen.photo_url} alt={matchResult.citizen.full_name} className="h-24 w-24 rounded-lg object-cover border border-slate-200" />
                )}
                <div className="flex-1 space-y-1.5 text-sm">
                  <div><span className="text-slate-500">Name: </span><span className="font-semibold text-slate-900">{matchResult.citizen.full_name}</span></div>
                  {matchResult.citizen.aadhaar_number && <div><span className="text-slate-500">Aadhaar: </span><span className="text-slate-700">{matchResult.citizen.aadhaar_number}</span></div>}
                  {matchResult.citizen.phone && <div><span className="text-slate-500">Phone: </span><span className="text-slate-700">{matchResult.citizen.phone}</span></div>}
                  {matchResult.citizen.address && <div><span className="text-slate-500">Address: </span><span className="text-slate-700">{matchResult.citizen.address}</span></div>}
                  <div className="flex items-center gap-2 pt-1">
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      {citizenViolations} prior violation{citizenViolations !== 1 ? 's' : ''}
                    </Badge>
                    <span className="text-xs text-slate-400">Match confidence: {((1 - matchResult.distance) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <Button onClick={() => navigateToIssueFine(navDataWithCctvName({ citizen: matchResult.citizen, source: currentSource }))}>
                  <FileText className="h-4 w-4" /> Issue Fine
                </Button>
                <Button variant="outline" onClick={handleReset}>Scan Another</Button>
              </div>
            </Card>
          )}

          {noMatch && !matchResult && lastDetection && (
            <Card className="border-amber-200 bg-amber-50/50 p-5">
              <div className="flex items-center gap-2 text-amber-700">
                <XCircle className="h-5 w-5" />
                <h2 className="text-base font-semibold">Person Not in Registry</h2>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                This person has not been registered. You can still issue a fine —
                the face data will be saved and auto-linked when they're registered later.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => navigateToIssueFine(navDataWithCctvName({ suspectFaceData: lastDetection, source: currentSource }))}>
                  <FileText className="h-4 w-4" /> Issue Fine to Unidentified Person
                </Button>
                <Button variant="outline" onClick={() => onNavigate('register')}>Register This Person First</Button>
              </div>
              <div className="mt-3"><Button variant="ghost" size="sm" onClick={handleReset}>Try Another Scan</Button></div>
            </Card>
          )}

          {noMatch && !matchResult && !lastDetection && (
            <Card className="border-amber-200 bg-amber-50/50 p-5">
              <div className="flex items-center gap-2 text-amber-700">
                <XCircle className="h-5 w-5" />
                <h2 className="text-base font-semibold">No Face Detected</h2>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                The system could not detect a face.
                {inputMode === 'cctv-upload' ? ' Try a clearer screenshot with a visible face.' : ' Make sure the person is visible with good lighting.'}
              </p>
              <div className="mt-4"><Button variant="outline" onClick={handleReset}>Try Again</Button></div>
            </Card>
          )}

          {!matchResult && !noMatch && (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center text-center">
                <ScanFace className="h-12 w-12 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-500">
                  {inputMode === 'camera' && 'Start the camera and scan a face'}
                  {inputMode === 'cctv-live' && 'Connect to a CCTV stream and scan'}
                  {inputMode === 'cctv-upload' && 'Upload a CCTV screenshot to scan'}
                </p>
                <p className="mt-1 text-xs text-slate-400">The system will match against registered citizens</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
