import { useState, useEffect } from 'react';
import {
  FileText,
  Trash2,
  AlertCircle,
  Recycle,
  CheckCircle2,
  ArrowLeft,
  AlertTriangle,
  UserX,
  Cctv,
  Camera,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  Card,
  Button,
  Input,
  Textarea,
  Badge,
  Spinner,
} from '@/components/ui';
import {
  VIOLATION_LABELS,
  VIOLATION_DEFAULT_FINES,
  STATUS_LABELS,
  STATUS_COLORS,
  DEFAULT_PAYMENT_DAYS,
  type Citizen,
  type ViolationType,
  type ViolationSource,
} from '@/types';
import type { Page, NavigationData } from '@/App';
import type { FaceDetectionResult } from '@/lib/faceApi';

const VIOLATION_ICONS_MAP: Record<ViolationType, React.ReactNode> = {
  garbage: <Trash2 className="h-5 w-5" />,
  spitting: <AlertCircle className="h-5 w-5" />,
  littering: <Recycle className="h-5 w-5" />,
};

interface IssueFineProps {
  data: NavigationData | null;
  onNavigate: (page: Page, data?: unknown) => void;
}

export function IssueFine({ data, onNavigate }: IssueFineProps) {
  const [violationType, setViolationType] = useState<ViolationType>('garbage');
  const [fineAmount, setFineAmount] = useState<number>(VIOLATION_DEFAULT_FINES.garbage);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [suspectName, setSuspectName] = useState('');
  const [paymentDays, setPaymentDays] = useState<number>(DEFAULT_PAYMENT_DAYS);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [issuedFine, setIssuedFine] = useState<{ id: string; fine_amount: number } | null>(null);

  useEffect(() => {
    setFineAmount(VIOLATION_DEFAULT_FINES[violationType]);
  }, [violationType]);

  const citizen: Citizen | null = data?.citizen ?? null;
  const suspectFaceData: FaceDetectionResult | null = data?.suspectFaceData ?? null;
  const source: ViolationSource = data?.source ?? 'camera';
  const cctvCameraName: string | undefined = data?.cctvCameraName;

  const isUnidentified = !citizen && !!suspectFaceData;
  const hasNoSubject = !citizen && !suspectFaceData;

  if (hasNoSubject) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="h-12 w-12 text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-500">
          No person selected. Please identify or capture a face first.
        </p>
        <div className="mt-4 flex gap-3">
          <Button onClick={() => onNavigate('recognize')}>
            <ArrowLeft className="h-4 w-4" /> Go to Face Recognition
          </Button>
          <Button variant="outline" onClick={() => onNavigate('register')}>
            Register New Person
          </Button>
        </div>
      </div>
    );
  }

  const handleIssue = async () => {
    setSaving(true);
    setSaveError(null);

    try {
      const insertData: Record<string, unknown> = {
        violation_type: violationType,
        fine_amount: fineAmount,
        location: location.trim() || null,
        description: description.trim() || null,
        status: 'pending',
        source,
        incident_date: new Date().toISOString(),
        due_date: new Date(Date.now() + paymentDays * 24 * 60 * 60 * 1000).toISOString(),
      };

      if (cctvCameraName) {
        insertData.cctv_camera_name = cctvCameraName;
      }

      if (citizen) {
        insertData.citizen_id = citizen.id;
      } else if (suspectFaceData) {
        insertData.suspect_name = suspectName.trim() || null;
        insertData.suspect_face_descriptor = suspectFaceData.descriptor;
        insertData.suspect_photo_url = suspectFaceData.photoDataUrl;
      }

      const { data: result, error: insertErr } = await supabase
        .from('violations')
        .insert(insertData)
        .select()
        .single();

      if (insertErr) throw insertErr;

      setIssuedFine({ id: result.id, fine_amount: Number(result.fine_amount) });
      setSuccess(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to issue fine.');
    } finally {
      setSaving(false);
    }
  };

  if (success && issuedFine) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-emerald-100 p-4">
          <CheckCircle2 className="h-12 w-12 text-emerald-600" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-slate-900">Fine Issued Successfully</h2>
        <Card className="mt-6 w-full max-w-md p-6">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Person</span>
              <span className="font-medium text-slate-900">
                {citizen?.full_name || suspectName || 'Unidentified'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Violation</span>
              <span className="font-medium text-slate-900">{VIOLATION_LABELS[violationType]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fine Amount</span>
              <span className="text-lg font-bold text-slate-900">
                ₹{issuedFine.fine_amount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Source</span>
              <span className="text-slate-700 flex items-center gap-1">
                {source === 'cctv' ? <Cctv className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
                {source === 'cctv' ? 'CCTV Footage' : 'Live Camera'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Deadline</span>
              <span className="font-medium text-slate-900">
                {paymentDays} days from now
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <Badge className={STATUS_COLORS.pending}>Pending</Badge>
            </div>
          </div>
        </Card>
        <div className="mt-6 flex gap-3">
          <Button onClick={() => onNavigate('dashboard')}>Back to Dashboard</Button>
          <Button variant="outline" onClick={() => onNavigate('violations')}>View All Violations</Button>
        </div>
      </div>
    );
  }

  const displayName = citizen?.full_name || 'Unidentified Person';
  const displayPhoto = citizen?.photo_url || suspectFaceData?.photoDataUrl || null;

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => onNavigate('recognize')}
          className="mb-2 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Issue Fine</h1>
        <p className="mt-1 text-sm text-slate-500">
          Record a violation and issue a fine
        </p>
      </div>

      {/* Subject Info */}
      <Card className={`p-5 ${isUnidentified ? 'border-amber-200' : ''}`}>
        <div className="flex items-center gap-4">
          {displayPhoto ? (
            <img
              src={displayPhoto}
              alt={displayName}
              className="h-16 w-16 rounded-lg object-cover border border-slate-200"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-xl font-semibold text-slate-400">
              ?
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">{displayName}</h2>
              {isUnidentified && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                  <UserX className="h-3 w-3 mr-1" /> Unidentified
                </Badge>
              )}
            </div>
            {citizen?.phone && <p className="text-sm text-slate-500">{citizen.phone}</p>}
            {citizen?.address && <p className="text-sm text-slate-500">{citizen.address}</p>}
            {isUnidentified && (
              <p className="text-sm text-amber-600">
                Face data saved with this fine — will auto-link if person is registered later
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            {source === 'cctv' ? <Cctv className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
            {source === 'cctv' ? (cctvCameraName || 'CCTV') : 'Camera'}
          </div>
        </div>

        {/* Optional suspect name for unidentified persons */}
        {isUnidentified && (
          <div className="mt-4">
            <Input
              label="Suspect Name (optional)"
              value={suspectName}
              onChange={(e) => setSuspectName(e.target.value)}
              placeholder="If you know the person's name"
            />
          </div>
        )}
      </Card>

      {/* Violation Form */}
      <Card className="p-5">
        <h3 className="text-base font-semibold text-slate-900">Violation Details</h3>

        {/* Violation Type Selection */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Violation Type
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(Object.keys(VIOLATION_LABELS) as ViolationType[]).map((type) => (
              <button
                key={type}
                onClick={() => setViolationType(type)}
                className={`flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all ${
                  violationType === type ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className={`rounded-lg p-2 ${violationType === type ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {VIOLATION_ICONS_MAP[type]}
                </span>
                <span className="text-sm font-medium text-slate-900">{VIOLATION_LABELS[type]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Fine Amount (₹)"
            type="number"
            value={fineAmount}
            onChange={(e) => setFineAmount(Number(e.target.value))}
            min={0}
          />
          <Input
            label="Location of Incident"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., MG Road, Sector 14"
          />
          <Input
            label="Payment Deadline (days)"
            type="number"
            value={paymentDays}
            onChange={(e) => setPaymentDays(Number(e.target.value))}
            min={1}
          />
        </div>

        <div className="mt-4">
          <Textarea
            label="Description / Officer Notes"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional details about the violation..."
            rows={3}
          />
        </div>

        {saveError && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => onNavigate('dashboard')}>Cancel</Button>
          <Button onClick={handleIssue} disabled={saving || fineAmount <= 0} size="lg">
            {saving ? (
              <><Spinner className="h-4 w-4" /> Issuing...</>
            ) : (
              <><FileText className="h-4 w-4" /> Issue Fine of ₹{fineAmount.toLocaleString('en-IN')}</>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
