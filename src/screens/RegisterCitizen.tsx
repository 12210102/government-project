import { useState, useEffect, useRef } from 'react';
import {
  ScanFace,
  Camera,
  CameraOff,
  CheckCircle2,
  UserPlus,
  Loader2,
  AlertTriangle,
  Upload,
  Link2,
} from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import {
  loadModels,
  detectFaceFromInput,
  detectFaceFromFile,
  compareDescriptors,
  type FaceDetectionResult,
} from '@/lib/faceApi';
import { supabase } from '@/lib/supabase';
import { Card, Button, Input, Textarea, Spinner } from '@/components/ui';
import type { Citizen } from '@/types';
import type { Page as AppPage } from '@/App';

interface PendingLink {
  count: number;
  totalAmount: number;
}

export function RegisterCitizen({ onNavigate }: { onNavigate: (page: AppPage, data?: unknown) => void }) {
  const { videoRef, isActive, error, startCamera, stopCamera } = useCamera();
  const [modelStatus, setModelStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [faceData, setFaceData] = useState<FaceDetectionResult | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [inputMode, setInputMode] = useState<'camera' | 'upload'>('camera');
  const [form, setForm] = useState({ full_name: '', aadhaar_number: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pendingLink, setPendingLink] = useState<PendingLink | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setModelStatus('loading');
    loadModels().then(() => setModelStatus('ready')).catch(() => setModelStatus('error'));
  }, []);

  // Check for pending unlinked violations matching this face
  useEffect(() => {
    if (!faceData) {
      setPendingLink(null);
      return;
    }
    (async () => {
      const { data: unlinked } = await supabase
        .from('violations')
        .select('id, fine_amount, suspect_face_descriptor')
        .is('citizen_id', null)
        .not('suspect_face_descriptor', 'is', null);
      if (!unlinked || unlinked.length === 0) {
        setPendingLink(null);
        return;
      }
      const matches = unlinked.filter((v) => {
        if (!v.suspect_face_descriptor) return false;
        return compareDescriptors(faceData.descriptor, v.suspect_face_descriptor as number[], 0.5).isMatch;
      });
      if (matches.length > 0) {
        setPendingLink({
          count: matches.length,
          totalAmount: matches.reduce((sum, v) => sum + Number(v.fine_amount), 0),
        });
      } else {
        setPendingLink(null);
      }
    })();
  }, [faceData]);

  const handleCapture = async () => {
    if (!videoRef.current || !isActive) return;
    setCapturing(true);
    setSaveError(null);
    try {
      const detection = await detectFaceFromInput(videoRef.current);
      if (!detection) {
        setSaveError('No face detected. Please position the face in the camera view.');
        setCapturing(false);
        return;
      }
      setFaceData(detection);
      setCapturedPhoto(detection.photoDataUrl);
      stopCamera();
    } catch {
      setSaveError('Failed to capture face data. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setCapturing(true);
    setSaveError(null);
    setUploadError(null);
    setCapturedPhoto(null);
    setFaceData(null);
    try {
      const detection = await detectFaceFromFile(file);
      if (!detection) {
        setUploadError('No face detected in the uploaded image. Try a clearer photo.');
        setCapturing(false);
        return;
      }
      setFaceData(detection);
      setCapturedPhoto(detection.photoDataUrl);
    } catch {
      setUploadError('Failed to process the image.');
    } finally {
      setCapturing(false);
    }
  };

  const handleRegister = async () => {
    if (!faceData) { setSaveError('Please capture a face photo first.'); return; }
    if (!form.full_name.trim()) { setSaveError('Full name is required.'); return; }

    setSaving(true);
    setSaveError(null);

    try {
      const { data, error: insertErr } = await supabase
        .from('citizens')
        .insert({
          full_name: form.full_name.trim(),
          aadhaar_number: form.aadhaar_number.trim() || null,
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
          face_descriptor: faceData.descriptor,
          photo_url: faceData.photoDataUrl,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      const newCitizen = data as Citizen;

      // Auto-link pending unlinked violations that match this person's face
      const { data: unlinked } = await supabase
        .from('violations')
        .select('id, suspect_face_descriptor')
        .is('citizen_id', null)
        .not('suspect_face_descriptor', 'is', null);

      if (unlinked && unlinked.length > 0) {
        const matchIds = unlinked
          .filter((v) => {
            if (!v.suspect_face_descriptor) return false;
            return compareDescriptors(faceData.descriptor, v.suspect_face_descriptor as number[], 0.5).isMatch;
          })
          .map((v) => v.id);

        if (matchIds.length > 0) {
          await supabase
            .from('violations')
            .update({ citizen_id: newCitizen.id })
            .in('id', matchIds);
        }
      }

      setSuccess(true);
      setTimeout(() => { onNavigate('issue-fine', { citizen: newCitizen }); }, 1500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to register citizen.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setCapturedPhoto(null);
    setFaceData(null);
    setForm({ full_name: '', aadhaar_number: '', phone: '', address: '' });
    setSaveError(null);
    setSuccess(false);
    setPendingLink(null);
    setUploadError(null);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-emerald-100 p-4">
          <CheckCircle2 className="h-12 w-12 text-emerald-600" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-slate-900">Citizen Registered!</h2>
        <p className="mt-1 text-sm text-slate-500">
          {pendingLink ? `${pendingLink.count} pending violation${pendingLink.count !== 1 ? 's' : ''} linked to this person` : 'Redirecting to issue a fine...'}
        </p>
        <Spinner className="mt-4 h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Register New Citizen</h1>
        <p className="mt-1 text-sm text-slate-500">
          Capture a face photo and enter the person's details
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
        <button
          onClick={() => { handleReset(); setInputMode('camera'); }}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${inputMode === 'camera' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Camera className="h-4 w-4" /> Camera
        </button>
        <button
          onClick={() => { handleReset(); setInputMode('upload'); }}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${inputMode === 'upload' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Upload className="h-4 w-4" /> Upload Photo
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Camera / Photo */}
        <Card className="overflow-hidden">
          {inputMode === 'camera' ? (
            <>
              <div className="relative aspect-[4/3] bg-slate-900">
                <video
                  ref={videoRef}
                  className={`h-full w-full object-cover ${isActive ? 'opacity-100' : 'opacity-0'}`}
                  autoPlay playsInline muted
                />
                {!isActive && !capturedPhoto && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                    <ScanFace className="h-16 w-16 mb-3" />
                    <p className="text-sm">Camera is off</p>
                  </div>
                )}
                {capturedPhoto && !isActive && (
                  <img src={capturedPhoto} alt="Captured" className="h-full w-full object-cover" />
                )}
                {capturedPhoto && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-medium text-white">
                      <CheckCircle2 className="h-3 w-3" /> Face captured
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-3 p-4">
                {!isActive && !capturedPhoto && (
                  <Button onClick={startCamera} disabled={modelStatus !== 'ready'} className="flex-1">
                    <Camera className="h-4 w-4" /> Start Camera
                  </Button>
                )}
                {isActive && !capturedPhoto && (
                  <>
                    <Button onClick={handleCapture} disabled={capturing || modelStatus !== 'ready'} className="flex-1">
                      {capturing ? <><Spinner className="h-4 w-4" /> Capturing...</> : <><ScanFace className="h-4 w-4" /> Capture Face</>}
                    </Button>
                    <Button variant="secondary" onClick={stopCamera}><CameraOff className="h-4 w-4" /></Button>
                  </>
                )}
                {capturedPhoto && (
                  <Button variant="outline" onClick={handleReset} className="flex-1">Retake Photo</Button>
                )}
              </div>
              {error && <p className="px-4 pb-3 text-xs text-red-600">{error}</p>}
            </>
          ) : (
            <>
              <div
                className="relative aspect-[4/3] flex flex-col items-center justify-center border-2 border-dashed border-slate-300 bg-slate-50"
                onClick={() => fileInputRef.current?.click()}
              >
                {capturedPhoto ? (
                  <img src={capturedPhoto} alt="Uploaded" className="h-full w-full object-cover" />
                ) : capturing ? (
                  <div className="flex flex-col items-center text-slate-500">
                    <Spinner className="h-10 w-10 mb-3" />
                    <p className="text-sm">Processing image...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-slate-400 px-6 text-center cursor-pointer">
                    <Upload className="h-16 w-16 mb-3" />
                    <p className="text-sm font-medium text-slate-600">Upload a Photo</p>
                    <p className="mt-1 text-xs text-slate-400">Click to browse or drag and drop</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                />
              </div>
              <div className="flex gap-3 p-4">
                {capturedPhoto && (
                  <Button variant="outline" onClick={handleReset} className="flex-1">Upload Another</Button>
                )}
              </div>
              {uploadError && <p className="px-4 pb-3 text-xs text-red-600">{uploadError}</p>}
            </>
          )}
          {modelStatus === 'loading' && (
            <p className="px-4 pb-3 flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading face models...
            </p>
          )}
        </Card>

        {/* Form */}
        <div className="space-y-4">
          {/* Pending violations link notice */}
          {pendingLink && (
            <Card className="border-blue-200 bg-blue-50/50 p-4">
              <div className="flex items-start gap-2">
                <Link2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">
                    {pendingLink.count} pending violation{pendingLink.count !== 1 ? 's' : ''} found
                  </p>
                  <p className="mt-0.5 text-blue-700">
                    This person has ₹{pendingLink.totalAmount.toLocaleString('en-IN')} in pending fines
                    from unidentified violations. Registering will automatically link them.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-5">
            <h2 className="text-base font-semibold text-slate-900">Citizen Details</h2>
            <div className="mt-4 space-y-4">
              <Input label="Full Name *" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Enter full legal name" />
              <Input label="Aadhaar Number" value={form.aadhaar_number} onChange={(e) => setForm({ ...form, aadhaar_number: e.target.value })} placeholder="XXXX XXXX XXXX" maxLength={14} />
              <Input label="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" type="tel" />
              <Textarea label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Residential address" rows={3} />

              {saveError && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              <Button onClick={handleRegister} disabled={!faceData || !form.full_name.trim() || saving} className="w-full" size="lg">
                {saving ? <><Spinner className="h-4 w-4" /> Registering...</> : <><UserPlus className="h-4 w-4" /> Register Citizen</>}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
