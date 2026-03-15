'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PersonalInfo {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  date_of_birth: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
}

interface EmploymentInfo {
  previous_employer: string;
  previous_employer_phone: string;
  years_experience: string;
  trade_primary: string;
  other_skills: string;
  available_start_date: string;
  preferred_pay_rate: string;
  languages_spoken: string[];
  has_transportation: boolean;
  willing_to_travel: boolean;
}

interface CertificationsInfo {
  osha_10: boolean;
  osha_30: boolean;
  cpr_first_aid: boolean;
  forklift_certified: boolean;
  other_certifications: string;
  drivers_license_number: string;
  drivers_license_state: string;
  drivers_license_class: string;
  drivers_license_expiry: string;
}

interface DocumentsInfo {
  drivers_license_front: string;
  drivers_license_back: string;
  certification_photos: string[];
  vehicle_insurance: string;
  resume: string;
}

interface AgreementsInfo {
  safety_policy: boolean;
  drug_testing: boolean;
  background_check: boolean;
  at_will_employment: boolean;
  truthful_information: boolean;
  electronic_signature: string;
  drawn_signature: string;
  signature_date: string;
}

interface FormData {
  personal_info: PersonalInfo;
  employment_info: EmploymentInfo;
  certifications_info: CertificationsInfo;
  documents_info: DocumentsInfo;
  agreements_info: AgreementsInfo;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const defaultPersonalInfo: PersonalInfo = {
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  date_of_birth: '',
  address_street: '',
  address_city: '',
  address_state: '',
  address_zip: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  emergency_contact_relationship: '',
};

const defaultEmploymentInfo: EmploymentInfo = {
  previous_employer: '',
  previous_employer_phone: '',
  years_experience: '',
  trade_primary: '',
  other_skills: '',
  available_start_date: '',
  preferred_pay_rate: '',
  languages_spoken: [],
  has_transportation: false,
  willing_to_travel: false,
};

const defaultCertificationsInfo: CertificationsInfo = {
  osha_10: false,
  osha_30: false,
  cpr_first_aid: false,
  forklift_certified: false,
  other_certifications: '',
  drivers_license_number: '',
  drivers_license_state: '',
  drivers_license_class: '',
  drivers_license_expiry: '',
};

const defaultDocumentsInfo: DocumentsInfo = {
  drivers_license_front: '',
  drivers_license_back: '',
  certification_photos: [],
  vehicle_insurance: '',
  resume: '',
};

const defaultAgreementsInfo: AgreementsInfo = {
  safety_policy: false,
  drug_testing: false,
  background_check: false,
  at_will_employment: false,
  truthful_information: false,
  electronic_signature: '',
  drawn_signature: '',
  signature_date: new Date().toISOString().split('T')[0],
};

const defaultFormData: FormData = {
  personal_info: { ...defaultPersonalInfo },
  employment_info: { ...defaultEmploymentInfo },
  certifications_info: { ...defaultCertificationsInfo },
  documents_info: { ...defaultDocumentsInfo },
  agreements_info: { ...defaultAgreementsInfo },
};

const STEP_LABELS = [
  'Personal Info',
  'Employment & Skills',
  'Certifications',
  'Documents',
  'Agreements',
  'Review & Submit',
];

const STEP_KEYS: (keyof FormData)[] = [
  'personal_info',
  'employment_info',
  'certifications_info',
  'documents_info',
  'agreements_info',
  'agreements_info', // review step doesn't have its own key
];

const STATE_OPTIONS = ['SC', 'NC', 'GA', 'Other'];
const TRADE_OPTIONS = [
  'Carpenter',
  'Electrician',
  'Plumber',
  'Heavy Equipment Operator',
  'Laborer',
  'Concrete',
  'Steel/Iron',
  'Grading/Excavation',
  'Foreman',
  'Project Manager',
  'Other',
];
const LANGUAGE_OPTIONS = ['English', 'Spanish', 'Other'];
const LICENSE_CLASS_OPTIONS = ['Regular', 'CDL-A', 'CDL-B'];

// ---------------------------------------------------------------------------
// Shared UI primitives
// ---------------------------------------------------------------------------

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-300 mb-1">
      {children}
      {required && <span className="text-[#D4772C] ml-0.5">*</span>}
    </label>
  );
}

function Input({
  label,
  required,
  ...props
}: { label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <input
        {...props}
        required={required}
        className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-base
                   placeholder:text-gray-500 focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] transition"
      />
    </div>
  );
}

function Select({
  label,
  required,
  options,
  placeholder,
  ...props
}: {
  label: string;
  required?: boolean;
  options: string[];
  placeholder?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <select
        {...props}
        required={required}
        className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-base
                   focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] transition appearance-none"
      >
        <option value="">{placeholder || 'Select...'}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextArea({
  label,
  required,
  ...props
}: { label: string; required?: boolean } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <textarea
        {...props}
        required={required}
        rows={3}
        className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-base
                   placeholder:text-gray-500 focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] transition resize-y"
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-base"
    >
      <span>{label}</span>
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-[#C9A84C]' : 'bg-[#333]'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </span>
    </button>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 min-h-[44px] py-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 rounded border-[#333] bg-[#1a1a1a] text-[#C9A84C] focus:ring-[#C9A84C] accent-[#C9A84C] flex-shrink-0"
      />
      <span className="text-gray-300 text-base">{label}</span>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Signature Pad — touch/mouse drawing canvas
// ---------------------------------------------------------------------------
function SignaturePad({ value, onChange }: { value: string; onChange: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Set canvas resolution
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#C9A84C';
    // Restore saved signature
    if (value) {
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0, rect.width, rect.height); };
      img.src = value;
    }
  }, []);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    drawingRef.current = true;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    drawingRef.current = false;
    if (canvasRef.current) {
      onChange(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  return (
    <div>
      <div className="relative rounded-lg border-2 border-dashed border-[#333] bg-[#1a1a1a] overflow-hidden" style={{ touchAction: 'none' }}>
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair"
          style={{ height: 120 }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {!value && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-white/15 text-sm">Sign here with your finger</p>
          </div>
        )}
      </div>
      {value && (
        <button type="button" onClick={clear} className="mt-2 text-sm text-red-400/60 hover:text-red-400">
          Clear signature
        </button>
      )}
    </div>
  );
}

function FileUpload({
  label,
  required,
  fileName,
  multiple,
  accept,
  onSelect,
}: {
  label: string;
  required?: boolean;
  fileName: string | string[];
  multiple?: boolean;
  accept?: string;
  onSelect: (names: string | string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (multiple) {
      onSelect(Array.from(files).map((f) => f.name));
    } else {
      onSelect(files[0].name);
    }
  };

  const displayNames = Array.isArray(fileName) ? fileName : fileName ? [fileName] : [];

  return (
    <div>
      <Label required={required}>{label}</Label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full min-h-[44px] px-4 py-3 rounded-lg border-2 border-dashed border-[#333] bg-[#1a1a1a]
                   text-gray-400 text-base hover:border-[#C9A84C] transition flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Tap to upload or take photo
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept || "image/*,application/pdf"}
        capture="environment"
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
      {displayNames.length > 0 && (
        <div className="mt-2 space-y-1">
          {displayNames.map((n, i) => (
            <p key={i} className="text-sm text-[#C9A84C]">File selected: {n}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress Bar
// ---------------------------------------------------------------------------

function ProgressBar({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div className="flex items-center w-full">
              {i > 0 && (
                <div
                  className={`flex-1 h-0.5 ${i <= currentStep ? 'bg-[#C9A84C]' : 'bg-[#333]'}`}
                />
              )}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
                  i < currentStep
                    ? 'bg-[#C9A84C] text-black'
                    : i === currentStep
                    ? 'bg-[#C9A84C] text-black ring-2 ring-[#C9A84C] ring-offset-2 ring-offset-[#0a0a0a]'
                    : 'bg-[#222] text-gray-500 border border-[#333]'
                }`}
              >
                {i < currentStep ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              {i < totalSteps - 1 && (
                <div
                  className={`flex-1 h-0.5 ${i < currentStep ? 'bg-[#C9A84C]' : 'bg-[#333]'}`}
                />
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-gray-400 mt-3">
        Step {currentStep + 1} of {totalSteps}: <span className="text-white font-medium">{STEP_LABELS[currentStep]}</span>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step Components
// ---------------------------------------------------------------------------

function StepPersonalInfo({
  data,
  onChange,
}: {
  data: PersonalInfo;
  onChange: (d: Partial<PersonalInfo>) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white mb-4">Personal Information</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="First Name" required value={data.first_name} onChange={(e) => onChange({ first_name: (e.target as HTMLInputElement).value })} />
        <Input label="Last Name" required value={data.last_name} onChange={(e) => onChange({ last_name: (e.target as HTMLInputElement).value })} />
      </div>
      <Input label="Phone" required type="tel" value={data.phone} onChange={(e) => onChange({ phone: (e.target as HTMLInputElement).value })} />
      <Input label="Email" type="email" value={data.email} onChange={(e) => onChange({ email: (e.target as HTMLInputElement).value })} />
      <Input label="Date of Birth" type="date" value={data.date_of_birth} onChange={(e) => onChange({ date_of_birth: (e.target as HTMLInputElement).value })} />
      <Input label="Street Address" value={data.address_street} onChange={(e) => onChange({ address_street: (e.target as HTMLInputElement).value })} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input label="City" value={data.address_city} onChange={(e) => onChange({ address_city: (e.target as HTMLInputElement).value })} />
        <Select label="State" options={STATE_OPTIONS} value={data.address_state} onChange={(e) => onChange({ address_state: (e.target as HTMLSelectElement).value })} />
        <Input label="ZIP Code" value={data.address_zip} onChange={(e) => onChange({ address_zip: (e.target as HTMLInputElement).value })} />
      </div>

      <div className="border-t border-[#222] pt-4 mt-6">
        <h3 className="text-lg font-semibold text-[#C9A84C] mb-3">Emergency Contact</h3>
        <div className="space-y-4">
          <Input label="Contact Name" required value={data.emergency_contact_name} onChange={(e) => onChange({ emergency_contact_name: (e.target as HTMLInputElement).value })} />
          <Input label="Contact Phone" required type="tel" value={data.emergency_contact_phone} onChange={(e) => onChange({ emergency_contact_phone: (e.target as HTMLInputElement).value })} />
          <Input label="Relationship" value={data.emergency_contact_relationship} onChange={(e) => onChange({ emergency_contact_relationship: (e.target as HTMLInputElement).value })} />
        </div>
      </div>
    </div>
  );
}

function StepEmployment({
  data,
  onChange,
}: {
  data: EmploymentInfo;
  onChange: (d: Partial<EmploymentInfo>) => void;
}) {
  const toggleLanguage = (lang: string) => {
    const current = data.languages_spoken || [];
    if (current.includes(lang)) {
      onChange({ languages_spoken: current.filter((l) => l !== lang) });
    } else {
      onChange({ languages_spoken: [...current, lang] });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white mb-4">Employment &amp; Skills</h2>
      <Input label="Previous Employer" value={data.previous_employer} onChange={(e) => onChange({ previous_employer: (e.target as HTMLInputElement).value })} />
      <Input label="Previous Employer Phone" type="tel" value={data.previous_employer_phone} onChange={(e) => onChange({ previous_employer_phone: (e.target as HTMLInputElement).value })} />
      <Input label="Years of Experience" type="number" min="0" value={data.years_experience} onChange={(e) => onChange({ years_experience: (e.target as HTMLInputElement).value })} />
      <Select label="Primary Trade" options={TRADE_OPTIONS} value={data.trade_primary} onChange={(e) => onChange({ trade_primary: (e.target as HTMLSelectElement).value })} />
      <TextArea label="Other Skills" placeholder="List any additional skills..." value={data.other_skills} onChange={(e) => onChange({ other_skills: (e.target as HTMLTextAreaElement).value })} />
      <Input label="Available Start Date" type="date" value={data.available_start_date} onChange={(e) => onChange({ available_start_date: (e.target as HTMLInputElement).value })} />

      <div>
        <Label>Preferred Pay Rate</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">$</span>
          <input
            type="number"
            min="0"
            step="0.50"
            value={data.preferred_pay_rate}
            onChange={(e) => onChange({ preferred_pay_rate: e.target.value })}
            className="w-full min-h-[44px] pl-7 pr-12 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-base
                       placeholder:text-gray-500 focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] transition"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/hr</span>
        </div>
      </div>

      <div>
        <Label>Languages Spoken</Label>
        <div className="space-y-1">
          {LANGUAGE_OPTIONS.map((lang) => (
            <Checkbox
              key={lang}
              label={lang}
              checked={(data.languages_spoken || []).includes(lang)}
              onChange={() => toggleLanguage(lang)}
            />
          ))}
        </div>
      </div>

      <Toggle label="Has reliable transportation?" checked={data.has_transportation} onChange={(v) => onChange({ has_transportation: v })} />
      <Toggle label="Willing to travel?" checked={data.willing_to_travel} onChange={(v) => onChange({ willing_to_travel: v })} />
    </div>
  );
}

function StepCertifications({
  data,
  onChange,
}: {
  data: CertificationsInfo;
  onChange: (d: Partial<CertificationsInfo>) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white mb-4">Certifications</h2>

      <div className="space-y-1">
        <Checkbox label="OSHA 10" checked={data.osha_10} onChange={(v) => onChange({ osha_10: v })} />
        <Checkbox label="OSHA 30" checked={data.osha_30} onChange={(v) => onChange({ osha_30: v })} />
        <Checkbox label="CPR / First Aid" checked={data.cpr_first_aid} onChange={(v) => onChange({ cpr_first_aid: v })} />
        <Checkbox label="Forklift Certified" checked={data.forklift_certified} onChange={(v) => onChange({ forklift_certified: v })} />
      </div>

      <TextArea
        label="Other Certifications"
        placeholder="List any other certifications..."
        value={data.other_certifications}
        onChange={(e) => onChange({ other_certifications: (e.target as HTMLTextAreaElement).value })}
      />

      <div className="border-t border-[#222] pt-4 mt-6">
        <h3 className="text-lg font-semibold text-[#C9A84C] mb-3">Driver&apos;s License</h3>
        <div className="space-y-4">
          <Input label="License Number" required value={data.drivers_license_number} onChange={(e) => onChange({ drivers_license_number: (e.target as HTMLInputElement).value })} />
          <Input label="Issuing State" value={data.drivers_license_state} onChange={(e) => onChange({ drivers_license_state: (e.target as HTMLInputElement).value })} />
          <Select label="License Class" options={LICENSE_CLASS_OPTIONS} value={data.drivers_license_class} onChange={(e) => onChange({ drivers_license_class: (e.target as HTMLSelectElement).value })} />
          <Input label="Expiration Date" type="date" value={data.drivers_license_expiry} onChange={(e) => onChange({ drivers_license_expiry: (e.target as HTMLInputElement).value })} />
        </div>
      </div>
    </div>
  );
}

function StepDocuments({
  data,
  hasTransportation,
  onChange,
}: {
  data: DocumentsInfo;
  hasTransportation: boolean;
  onChange: (d: Partial<DocumentsInfo>) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white mb-4">Documents</h2>
      <p className="text-gray-400 text-sm mb-4">
        Upload photos of the following documents. You can use your camera or choose from your gallery.
      </p>

      <FileUpload label="Driver's License (Front)" required fileName={data.drivers_license_front} onSelect={(n) => onChange({ drivers_license_front: n as string })} />
      <FileUpload label="Driver's License (Back)" fileName={data.drivers_license_back} onSelect={(n) => onChange({ drivers_license_back: n as string })} />
      <FileUpload label="Certification Photos" multiple fileName={data.certification_photos} onSelect={(n) => onChange({ certification_photos: n as string[] })} />
      {hasTransportation && (
        <FileUpload label="Vehicle Insurance" fileName={data.vehicle_insurance} onSelect={(n) => onChange({ vehicle_insurance: n as string })} />
      )}

      <div className="border-t border-[#222] pt-4 mt-2">
        <h3 className="text-base font-semibold text-white mb-2">Resume (optional)</h3>
        <p className="text-gray-500 text-sm mb-3">Upload your resume if you have one — PDF, Word, or image.</p>
        <FileUpload label="Resume / CV" fileName={data.resume} accept=".pdf,.doc,.docx,image/*" onSelect={(n) => onChange({ resume: n as string })} />
      </div>
    </div>
  );
}

function StepAgreements({
  data,
  onChange,
}: {
  data: AgreementsInfo;
  onChange: (d: Partial<AgreementsInfo>) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white mb-4">Agreements</h2>

      <div className="space-y-2 bg-[#1a1a1a] rounded-lg p-4 border border-[#222]">
        <Checkbox
          label="I acknowledge and agree to follow all RO Unlimited safety policies and procedures"
          checked={data.safety_policy}
          onChange={(v) => onChange({ safety_policy: v })}
        />
        <Checkbox
          label="I consent to pre-employment and random drug testing as required"
          checked={data.drug_testing}
          onChange={(v) => onChange({ drug_testing: v })}
        />
        <Checkbox
          label="I authorize RO Unlimited to conduct a background check"
          checked={data.background_check}
          onChange={(v) => onChange({ background_check: v })}
        />
        <Checkbox
          label="I understand that employment is at-will and may be terminated at any time"
          checked={data.at_will_employment}
          onChange={(v) => onChange({ at_will_employment: v })}
        />
        <Checkbox
          label="All information I have provided is true and accurate to the best of my knowledge"
          checked={data.truthful_information}
          onChange={(v) => onChange({ truthful_information: v })}
        />
      </div>

      <div className="border-t border-[#222] pt-4 mt-6">
        <h3 className="text-lg font-semibold text-[#C9A84C] mb-3">Electronic Signature</h3>
        <Input
          label="Type your full legal name as your electronic signature"
          required
          value={data.electronic_signature}
          onChange={(e) => onChange({ electronic_signature: (e.target as HTMLInputElement).value })}
        />

        {/* Drawn Signature Pad */}
        <div className="mt-4">
          <Label>Draw your signature</Label>
          <SignaturePad
            value={data.drawn_signature}
            onChange={(dataUrl) => onChange({ drawn_signature: dataUrl })}
          />
        </div>

        <div className="mt-4">
          <Label>Signature Date</Label>
          <input
            type="date"
            readOnly
            value={data.signature_date}
            className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#222] border border-[#333] text-gray-400 text-base cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review Step helpers
// ---------------------------------------------------------------------------

function CollapsibleSection({
  title,
  children,
  defaultOpen,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  return (
    <div className="border border-[#222] rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#1a1a1a] text-white font-semibold text-base min-h-[44px]"
      >
        {title}
        <svg
          className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-4 py-3 space-y-1 text-sm">{children}</div>}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string | boolean | string[] | undefined }) {
  let display: string;
  if (typeof value === 'boolean') {
    display = value ? 'Yes' : 'No';
  } else if (Array.isArray(value)) {
    display = value.length > 0 ? value.join(', ') : '-';
  } else {
    display = value || '-';
  }
  return (
    <div className="flex justify-between py-1 border-b border-[#1a1a1a]">
      <span className="text-gray-400">{label}</span>
      <span className="text-white text-right max-w-[60%] break-words">{display}</span>
    </div>
  );
}

function StepReview({ formData }: { formData: FormData }) {
  const { personal_info: p, employment_info: e, certifications_info: c, documents_info: d, agreements_info: a } = formData;
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white mb-4">Review Your Application</h2>
      <p className="text-gray-400 text-sm mb-4">Please review all information before submitting.</p>

      <CollapsibleSection title="Personal Information">
        <ReviewRow label="Name" value={`${p.first_name} ${p.last_name}`} />
        <ReviewRow label="Phone" value={p.phone} />
        <ReviewRow label="Email" value={p.email} />
        <ReviewRow label="Date of Birth" value={p.date_of_birth} />
        <ReviewRow label="Address" value={[p.address_street, p.address_city, p.address_state, p.address_zip].filter(Boolean).join(', ')} />
        <ReviewRow label="Emergency Contact" value={`${p.emergency_contact_name} (${p.emergency_contact_relationship || 'N/A'}) - ${p.emergency_contact_phone}`} />
      </CollapsibleSection>

      <CollapsibleSection title="Employment & Skills">
        <ReviewRow label="Previous Employer" value={e.previous_employer} />
        <ReviewRow label="Employer Phone" value={e.previous_employer_phone} />
        <ReviewRow label="Years Experience" value={e.years_experience} />
        <ReviewRow label="Primary Trade" value={e.trade_primary} />
        <ReviewRow label="Other Skills" value={e.other_skills} />
        <ReviewRow label="Available Start" value={e.available_start_date} />
        <ReviewRow label="Preferred Pay" value={e.preferred_pay_rate ? `$${e.preferred_pay_rate}/hr` : ''} />
        <ReviewRow label="Languages" value={e.languages_spoken} />
        <ReviewRow label="Transportation" value={e.has_transportation} />
        <ReviewRow label="Willing to Travel" value={e.willing_to_travel} />
      </CollapsibleSection>

      <CollapsibleSection title="Certifications">
        <ReviewRow label="OSHA 10" value={c.osha_10} />
        <ReviewRow label="OSHA 30" value={c.osha_30} />
        <ReviewRow label="CPR / First Aid" value={c.cpr_first_aid} />
        <ReviewRow label="Forklift" value={c.forklift_certified} />
        <ReviewRow label="Other Certs" value={c.other_certifications} />
        <ReviewRow label="License #" value={c.drivers_license_number} />
        <ReviewRow label="License State" value={c.drivers_license_state} />
        <ReviewRow label="License Class" value={c.drivers_license_class} />
        <ReviewRow label="License Expiry" value={c.drivers_license_expiry} />
      </CollapsibleSection>

      <CollapsibleSection title="Documents">
        <ReviewRow label="License (Front)" value={d.drivers_license_front} />
        <ReviewRow label="License (Back)" value={d.drivers_license_back} />
        <ReviewRow label="Cert Photos" value={d.certification_photos} />
        <ReviewRow label="Vehicle Insurance" value={d.vehicle_insurance} />
      </CollapsibleSection>

      <CollapsibleSection title="Agreements">
        <ReviewRow label="Safety Policy" value={a.safety_policy} />
        <ReviewRow label="Drug Testing" value={a.drug_testing} />
        <ReviewRow label="Background Check" value={a.background_check} />
        <ReviewRow label="At-Will Employment" value={a.at_will_employment} />
        <ReviewRow label="Truthful Info" value={a.truthful_information} />
        <ReviewRow label="Electronic Signature" value={a.electronic_signature} />
        <ReviewRow label="Signature Date" value={a.signature_date} />
      </CollapsibleSection>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Branding
// ---------------------------------------------------------------------------

function Brand() {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <div className="w-8 h-8 rounded bg-[#C9A84C] flex items-center justify-center font-black text-black text-sm">
        RO
      </div>
      <span className="text-white font-bold text-lg tracking-wide">RO Unlimited</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function IntakePage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({ ...defaultFormData });
  const [saving, setSaving] = useState(false);

  // Load token data on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/intake/${token}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'This link is invalid or has expired.');
        }
        const data = await res.json();

        if (data.status === 'submitted') {
          setAlreadySubmitted(true);
          setLoading(false);
          return;
        }

        // Pre-populate form data from saved intake
        const intake = data.intake || data;
        setFormData((prev) => ({
          personal_info: {
            ...prev.personal_info,
            ...(intake.personal_info || {}),
            phone: intake.personal_info?.phone || intake.candidate_phone || prev.personal_info.phone,
          },
          employment_info: { ...prev.employment_info, ...(intake.employment_info || {}) },
          certifications_info: { ...prev.certifications_info, ...(intake.certifications_info || {}) },
          documents_info: { ...prev.documents_info, ...(intake.documents_info || {}) },
          agreements_info: {
            ...prev.agreements_info,
            ...(intake.agreements_info || {}),
            signature_date: new Date().toISOString().split('T')[0],
          },
        }));

        if (typeof intake.current_step === 'number') {
          setCurrentStep(intake.current_step);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  // Auto-save via PATCH
  const autoSave = useCallback(
    async (step: number) => {
      setSaving(true);
      try {
        await fetch(`/api/intake/${token}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            current_step: step,
            [STEP_KEYS[step]]: formData[STEP_KEYS[step]],
          }),
        });
      } catch {
        // silent fail for auto-save
      } finally {
        setSaving(false);
      }
    },
    [token, formData],
  );

  const updateSection = useCallback(
    <K extends keyof FormData>(section: K, partial: Partial<FormData[K]>) => {
      setFormData((prev) => ({
        ...prev,
        [section]: { ...prev[section], ...partial },
      }));
    },
    [],
  );

  const goNext = useCallback(async () => {
    await autoSave(currentStep);
    setCurrentStep((s) => Math.min(s + 1, 5));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [autoSave, currentStep]);

  const goBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/intake/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to submit application.');
      }
      setSubmitted(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [token, formData]);

  // Validate current step to decide if Next is allowed
  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case 0: {
        const p = formData.personal_info;
        return !!(p.first_name && p.last_name && p.phone && p.emergency_contact_name && p.emergency_contact_phone);
      }
      case 2: {
        return !!formData.certifications_info.drivers_license_number;
      }
      case 3: {
        return !!formData.documents_info.drivers_license_front;
      }
      case 4: {
        const a = formData.agreements_info;
        return !!(
          a.safety_policy &&
          a.drug_testing &&
          a.background_check &&
          a.at_will_employment &&
          a.truthful_information &&
          a.electronic_signature
        );
      }
      default:
        return true;
    }
  }, [currentStep, formData]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#C9A84C] border-t-transparent" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-[#111] rounded-2xl p-8 max-w-md w-full text-center border border-[#222]">
          <Brand />
          <div className="w-16 h-16 mx-auto mt-4 mb-4 rounded-full bg-red-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Link Invalid</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // Already submitted
  if (alreadySubmitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-[#111] rounded-2xl p-8 max-w-md w-full text-center border border-[#222]">
          <Brand />
          <div className="w-16 h-16 mx-auto mt-4 mb-4 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#C9A84C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Already Submitted</h1>
          <p className="text-gray-400">
            Your application has already been submitted. We&apos;ll be in touch soon.
          </p>
        </div>
      </div>
    );
  }

  // Thank-you screen after submit
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-[#111] rounded-2xl p-8 max-w-md w-full text-center border border-[#222]">
          <Brand />
          <div className="w-20 h-20 mx-auto mt-6 mb-4 rounded-full bg-green-900/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Application Submitted!</h1>
          <p className="text-gray-400">
            Thank you for applying to RO Unlimited. We&apos;ll review your information and get back to you soon.
          </p>
        </div>
      </div>
    );
  }

  // Wizard form
  return (
    <div className="min-h-screen bg-[#0a0a0a] py-6 px-4">
      <div className="max-w-xl mx-auto">
        <Brand />

        <ProgressBar currentStep={currentStep} totalSteps={6} />

        <div className="bg-[#111] rounded-2xl p-5 sm:p-6 border border-[#222]">
          {currentStep === 0 && (
            <StepPersonalInfo
              data={formData.personal_info}
              onChange={(d) => updateSection('personal_info', d)}
            />
          )}
          {currentStep === 1 && (
            <StepEmployment
              data={formData.employment_info}
              onChange={(d) => updateSection('employment_info', d)}
            />
          )}
          {currentStep === 2 && (
            <StepCertifications
              data={formData.certifications_info}
              onChange={(d) => updateSection('certifications_info', d)}
            />
          )}
          {currentStep === 3 && (
            <StepDocuments
              data={formData.documents_info}
              hasTransportation={formData.employment_info.has_transportation}
              onChange={(d) => updateSection('documents_info', d)}
            />
          )}
          {currentStep === 4 && (
            <StepAgreements
              data={formData.agreements_info}
              onChange={(d) => updateSection('agreements_info', d)}
            />
          )}
          {currentStep === 5 && <StepReview formData={formData} />}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-[#222]">
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="min-h-[44px] px-6 py-2 rounded-lg border border-[#333] text-gray-300 text-base font-medium
                           hover:bg-[#1a1a1a] transition"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!canProceed() || saving}
                className="min-h-[44px] px-8 py-2 rounded-lg bg-[#C9A84C] text-black text-base font-bold
                           hover:bg-[#b8973f] transition disabled:opacity-40 disabled:cursor-not-allowed
                           flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
                    Saving...
                  </>
                ) : (
                  'Next'
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="min-h-[44px] px-8 py-3 rounded-lg bg-[#D4772C] text-white text-base font-bold
                           hover:bg-[#c06a25] transition disabled:opacity-60 disabled:cursor-not-allowed
                           flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-6">
          &copy; {new Date().getFullYear()} RO Unlimited. All rights reserved.
        </p>
      </div>
    </div>
  );
}
