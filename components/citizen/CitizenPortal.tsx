'use client';

import React, { useState } from 'react';
import { GeographicArea, CitizenComplaint, PublicAdvisory, ComplaintCategory, HealthSymptom } from '@/types';
import { DataCategoryBadge, StatusBadge } from '../ui/Badge';
import { 
  Send, 
  Search, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  MapPin, 
  Camera, 
  Clock, 
  Info,
  Droplet
} from 'lucide-react';

interface CitizenPortalProps {
  wards: GeographicArea[];
  advisories: PublicAdvisory[];
  complaints: CitizenComplaint[];
  language: 'en' | 'kn';
  onComplaintSubmitted: () => void;
}

export default function CitizenPortal({
  wards,
  advisories,
  complaints,
  language,
  onComplaintSubmitted,
}: CitizenPortalProps) {
  // Form State
  const [category, setCategory] = useState<ComplaintCategory>('DIRTY_WATER');
  const [wardId, setWardId] = useState<string>(wards[0]?.id || '');
  const [addressText, setAddressText] = useState('');
  const [description, setDescription] = useState('');
  const [complainantName, setComplainantName] = useState('');
  const [complainantPhone, setComplainantPhone] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [symptoms, setSymptoms] = useState<HealthSymptom[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<{ ticketNumber: string; clusterDetected: boolean } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Search Ticket State
  const [searchTicket, setSearchTicket] = useState('');
  const [searchedComplaint, setSearchedComplaint] = useState<CitizenComplaint | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const strings = {
    en: {
      portalTitle: 'Citizen Water Grievance & Safety Portal',
      portalSubtitle: 'Report water supply disruptions, dirty water, leakages, or sewage mixing directly to BWSSB and BBMP.',
      reportTab: 'Report a Water Issue',
      trackTab: 'Track Complaint Status',
      advisoriesTab: 'Public Health & Boil-Water Advisories',
      categoryLabel: 'Issue Category',
      wardLabel: 'Ward / Locality',
      addressLabel: 'Street Address & Landmark',
      descLabel: 'Detailed Description of the Issue',
      descPlaceholder: 'e.g., Water is brown/yellowish with earthy smell since 7:30 AM supply cycle...',
      nameLabel: 'Your Name (Optional)',
      phoneLabel: 'Phone Number (Optional - for SMS updates)',
      healthSignalHeader: 'Public Health Signal (Optional)',
      healthSignalDesc: 'Has anyone in your household experienced any mild gastrointestinal symptoms in the last 48 hours?',
      privacyConsent: 'I consent to sharing this water report with municipal engineers. I understand my phone number and name will be strictly anonymized and never shared on public maps.',
      submitBtn: 'Submit Grievance to BWSSB',
      submitting: 'Verifying & Submitting...',
      trackPlaceholder: 'Enter Ticket Number (e.g., WWB-TKT-2026-881)',
      trackBtn: 'Check Status',
      noTicketFound: 'No complaint found matching this ticket reference.',
      successTitle: 'Grievance Registered Successfully!',
      ticketIssued: 'Your Tracking Ticket Number:',
      clusterNotice: 'Notice: Other nearby residents have reported similar issues. Your report has been linked to a localized triage cluster for faster response.',
      keepNote: 'Please save this ticket reference to check status updates.',
    },
    kn: {
      portalTitle: 'ನಾಗರಿಕ ನೀರಿನ ದೂರು ಮತ್ತು ಸುರಕ್ಷತಾ ಪೋರ್ಟಲ್',
      portalSubtitle: 'ಕಲುಷಿತ ನೀರು, ಪೈಪ್ ಲೈನ್ ಸೋರಿಕೆ, ಅಥವಾ ಸರಬರಾಜು ವ್ಯತ್ಯಯವನ್ನು BWSSB ಮತ್ತು BBMP ಗೆ ನೇರವಾಗಿ ವರದಿ ಮಾಡಿ.',
      reportTab: 'ನೀರಿನ ದೂರು ದಾಖಲಿಸಿ',
      trackTab: 'ದೂರಿನ ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ',
      advisoriesTab: 'ಸಾರ್ವಜನಿಕ ಆರೋಗ್ಯ ಮತ್ತು ಮುನ್ನೆಚ್ಚರಿಕೆ ಸೂಚನೆಗಳು',
      categoryLabel: 'ಸಮಸ್ಯೆಯ ವರ್ಗ',
      wardLabel: 'ವಾರ್ಡ್ / ಪ್ರದೇಶ',
      addressLabel: 'ವಿಳಾಸ ಮತ್ತು ಪ್ರಮುಖ ಗುರುತು',
      descLabel: 'ಸಮಸ್ಯೆಯ ವಿವರಣೆ',
      descPlaceholder: 'ಉದಾಹರಣೆಗೆ: ಬೆಳಗ್ಗೆ 7:30 ರ ಸರಬರಾಜಿನಲ್ಲಿ ನಲ್ಲಿಯಲ್ಲಿ ಕಂದು ಬಣ್ಣದ ಕೆಸರು ನೀರು ಮತ್ತು ವಾಸನೆ ಬರುತ್ತಿದೆ...',
      nameLabel: 'ನಿಮ್ಮ ಹೆಸರು (ಐಚ್ಛಿಕ)',
      phoneLabel: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (ಐಚ್ಛಿಕ - SMS ಅಪ್ಡೇಟ್ ಗಾಗಿ)',
      healthSignalHeader: 'ಆರೋಗ್ಯ ಮಾಹಿತಿ (ಐಚ್ಛಿಕ)',
      healthSignalDesc: 'ಕಳೆದ 48 ಗಂಟೆಗಳಲ್ಲಿ ಮನೆಯಲ್ಲಿ ಯಾರಿಗಾದರೂ ಹೊಟ್ಟೆ ನೋವು, ವಾಂತಿ ಅಥವಾ ಭೇದಿ ಲಕ್ಷಣಗಳು ಕಂಡುಬಂದಿವೆಯೇ?',
      privacyConsent: 'ನನ್ನ ದೂರನ್ನು ಪರಿಶೀಲನೆಗಾಗಿ ನೀಡಲು ಒಪ್ಪುತ್ತೇನೆ. ನನ್ನ ಹೆಸರು ಮತ್ತು ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ಗೌಪ್ಯವಾಗಿಡಲಾಗುತ್ತದೆ ಎಂದು ನಾನು ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೇನೆ.',
      submitBtn: 'BWSSB ಗೆ ದೂರು ಸಲ್ಲಿಸಿ',
      submitting: 'ದಾಖಲಾಗುತ್ತಿದೆ...',
      trackPlaceholder: 'ದೂರು ಸಂಖ್ಯೆ ನಮೂದಿಸಿ (ಉದಾ: WWB-TKT-2026-881)',
      trackBtn: 'ಸ್ಥಿತಿ ನೋಡಿ',
      noTicketFound: 'ಈ ದೂರು ಸಂಖ್ಯೆಯ ಯಾವುದೇ ದಾಖಲೆ ಕಂಡುಬಂದಿಲ್ಲ.',
      successTitle: 'ದೂರು ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಾಗಿದೆ!',
      ticketIssued: 'ನಿಮ್ಮ ದೂರು ಸಂಖ್ಯೆ (Ticket ID):',
      clusterNotice: 'ಸೂಚನೆ: ನಿಮ್ಮ ಪ್ರದೇಶದ ಇತರ ನಿವಾಸಿಗಳು ಇದೇ ರೀತಿಯ ದೂರು ನೀಡಿದ್ದು, ಶೀಘ್ರ ಕ್ರಮಕ್ಕಾಗಿ ನಿಮ್ಮ ದೂರನ್ನು ಸಂಯೋಜಿಸಲಾಗಿದೆ.',
      keepNote: 'ದಯವಿಟ್ಟು ಪರಿಶೀಲನೆಗಾಗಿ ಈ ಸಂಖ್ಯೆಯನ್ನು ಉಳಿಸಿಕೊಳ್ಳಿ.',
    }
  };

  const t = strings[language];

  const categories: Array<{ id: ComplaintCategory; en: string; kn: string; icon: string }> = [
    { id: 'DIRTY_WATER', en: 'Dirty / Discoloured Water', kn: 'ಕಲುಷಿತ / ಕೆಸರು ನೀರು', icon: '🟤' },
    { id: 'FOUL_SMELL', en: 'Unusual Odour / Taste', kn: 'ಕೆಟ್ಟ ವಾಸನೆ / ಅಸ್ವಾಭಾವಿಕ ರುಚಿ', icon: '👃' },
    { id: 'SEWAGE_MIXING', en: 'Sewage Ingress Concern', kn: 'ಒಳಚರಂಡಿ ನೀರು ಮಿಶ್ರಣ', icon: '☣️' },
    { id: 'PIPELINE_LEAK', en: 'Visible Pipeline Burst / Leak', kn: 'ಪೈಪ್ ಲೈನ್ ಸೋರಿಕೆ / ಒಡೆದಿರುವುದು', icon: '🌊' },
    { id: 'NO_WATER', en: 'Water Supply Disruption', kn: 'ನೀರು ಸರಬರಾಜು ಸ್ಥಗಿತ', icon: '🚫' },
    { id: 'LOW_PRESSURE', en: 'Extremely Low Pressure', kn: 'ಕಡಿಮೆ ನೀರಿನ ಒತ್ತಡ', icon: '📉' },
    { id: 'EMPTY_WATER_POINT', en: 'Public Water Point / ATM Dry', kn: 'ಸಾರ್ವಜನಿಕ ನೀರಿನ ಕಿಯೋಸ್ಕ್ ಖಾಲಿ', icon: '🚰' },
  ];

  const symptomsList: Array<{ id: HealthSymptom; en: string; kn: string }> = [
    { id: 'STOMACH_PAIN', en: 'Stomach Pain', kn: 'ಹೊಟ್ಟೆ ನೋವು' },
    { id: 'VOMITING', en: 'Vomiting', kn: 'ವಾಂತಿ' },
    { id: 'DIARRHEA', en: 'Loose Motion / Diarrhea', kn: 'ಭೇದಿ / ಭೇದಿ ಲಕ್ಷಣ' },
    { id: 'NAUSEA', en: 'Nausea', kn: 'ವಾಕರಿಕೆ' },
    { id: 'FEVER', en: 'Fever', kn: 'ಜ್ವರ' },
  ];

  const toggleSymptom = (sym: HealthSymptom) => {
    if (symptoms.includes(sym)) {
      setSymptoms(symptoms.filter(s => s !== sym));
    } else {
      setSymptoms([...symptoms, sym]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!consentGiven) {
      setFormError(language === 'kn' ? 'ದಯವಿಟ್ಟು ಮುಂದುವರಿಯಲು ಗೌಪ್ಯತಾ ಒಪ್ಪಿಗೆಯನ್ನು ನೀಡಿ.' : 'Please agree to the privacy notice before submitting.');
      return;
    }

    if (!addressText.trim() || !description.trim()) {
      setFormError(language === 'kn' ? 'ದಯವಿಟ್ಟು ವಿಳಾಸ ಮತ್ತು ವಿವರಣೆಯನ್ನು ಭರ್ತಿ ಮಾಡಿ.' : 'Please provide both address and issue description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          wardId,
          addressText,
          description,
          language,
          complainantName,
          complainantPhone,
          consentGiven: true,
          symptomsReported: symptoms.length > 0 ? symptoms : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmissionSuccess({
          ticketNumber: data.ticketNumber,
          clusterDetected: data.clusterDetected,
        });
        // Clear form
        setAddressText('');
        setDescription('');
        setComplainantName('');
        setComplainantPhone('');
        setSymptoms([]);
        setConsentGiven(false);
        onComplaintSubmitted();
      } else {
        setFormError(data.error || 'Failed to submit grievance.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTicket.trim()) return;

    setSearchError(null);
    setSearchedComplaint(null);

    try {
      const res = await fetch(`/api/v1/complaints/${encodeURIComponent(searchTicket.trim())}`);
      const data = await res.json();
      if (data.success) {
        setSearchedComplaint(data.data);
      } else {
        setSearchError(t.noTicketFound);
      }
    } catch (err: any) {
      setSearchError('Error checking status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Public Advisories Banner */}
      {advisories.filter(a => a.isActive).length > 0 && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-r-xl shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-rose-900 text-sm">
                  {language === 'kn' ? advisories[0].titleKn : advisories[0].titleEn}
                </span>
                <span className="text-[10px] bg-rose-200 text-rose-800 font-bold px-2 py-0.5 rounded uppercase">
                  Active Advisory
                </span>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                {language === 'kn' ? advisories[0].contentKn : advisories[0].contentEn}
              </p>
              <div className="text-[11px] text-rose-700/80 font-medium">
                Issued by: {advisories[0].issuedByOfficer} | Affected Wards: {advisories[0].affectedWards.join(', ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Complaint Submission Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-white">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <Droplet className="w-5 h-5 text-sky-600" />
              {t.portalTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-1">{t.portalSubtitle}</p>
          </div>

          {submissionSuccess ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">{t.successTitle}</h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-w-sm mx-auto">
                <span className="text-xs text-slate-400 block">{t.ticketIssued}</span>
                <span className="text-2xl font-mono font-extrabold text-sky-700 block mt-1 tracking-wider">
                  {submissionSuccess.ticketNumber}
                </span>
              </div>
              {submissionSuccess.clusterDetected && (
                <div className="text-xs text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200 text-left max-w-md mx-auto">
                  ⚡ {t.clusterNotice}
                </div>
              )}
              <p className="text-xs text-slate-500">{t.keepNote}</p>
              <button
                onClick={() => setSubmissionSuccess(null)}
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition"
              >
                {language === 'kn' ? 'ಮತ್ತೊಂದು ದೂರು ದಾಖಲಿಸಿ' : 'Submit Another Grievance'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Category Radio Grid */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">{t.categoryLabel}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map(cat => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                        category === cat.id
                          ? 'border-sky-600 bg-sky-50/80 text-sky-900 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <span className="text-xl mb-1">{cat.icon}</span>
                      <span className="text-xs font-medium leading-tight">
                        {language === 'kn' ? cat.kn : cat.en}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ward Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.wardLabel}</label>
                  <select
                    value={wardId}
                    onChange={e => setWardId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {wards.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.zone} Zone)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.addressLabel}</label>
                  <input
                    type="text"
                    required
                    value={addressText}
                    onChange={e => setAddressText(e.target.value)}
                    placeholder="e.g., 4th Block, 14th Cross, Near Water Tank"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.descLabel}</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={t.descPlaceholder}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Optional Health Symptoms Checklist for Public Health Signal */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{t.healthSignalHeader}</span>
                </div>
                <p className="text-[11px] text-slate-500">{t.healthSignalDesc}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {symptomsList.map(sym => (
                    <button
                      type="button"
                      key={sym.id}
                      onClick={() => toggleSymptom(sym.id)}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                        symptoms.includes(sym.id)
                          ? 'bg-rose-100 text-rose-800 border-rose-300 font-semibold'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {symptoms.includes(sym.id) ? '✓ ' : '+ '}
                      {language === 'kn' ? sym.kn : sym.en}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  * Used strictly for aggregated public-health signal analysis. Not medical advice.
                </p>
              </div>

              {/* Complainant Contact (Anonymized) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t.nameLabel}</label>
                  <input
                    type="text"
                    value={complainantName}
                    onChange={e => setComplainantName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 text-slate-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t.phoneLabel}</label>
                  <input
                    type="tel"
                    value={complainantPhone}
                    onChange={e => setComplainantPhone(e.target.value)}
                    placeholder="e.g. 9845012345"
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Privacy Consent Checkbox */}
              <div className="p-3 bg-sky-50/50 rounded-lg border border-sky-100 text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={e => setConsentGiven(e.target.checked)}
                    className="mt-0.5 rounded text-sky-600 focus:ring-0"
                  />
                  <span className="text-[11px] leading-relaxed text-slate-600">
                    <strong className="text-slate-800 block mb-0.5">Privacy Notice & Citizen Consent:</strong>
                    {t.privacyConsent}
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? t.submitting : t.submitBtn}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Track Ticket & Status Stepper (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Tracking Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Search className="w-4 h-4 text-sky-600" />
              <h3 className="font-bold text-slate-800 text-sm">{t.trackTab}</h3>
            </div>

            <form onSubmit={handleSearchTicket} className="flex gap-2">
              <input
                type="text"
                value={searchTicket}
                onChange={e => setSearchTicket(e.target.value)}
                placeholder={t.trackPlaceholder}
                className="flex-1 text-xs p-2.5 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition"
              >
                {t.trackBtn}
              </button>
            </form>

            {searchError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs">
                {searchError}
              </div>
            )}

            {searchedComplaint && (
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div>
                    <span className="font-mono font-bold text-sky-800 text-sm">{searchedComplaint.ticketNumber}</span>
                    <span className="text-[10px] text-slate-400 block">{searchedComplaint.wardName}</span>
                  </div>
                  <StatusBadge status={searchedComplaint.status} />
                </div>

                <div className="space-y-1.5 text-xs text-slate-700">
                  <div>
                    <strong>Category:</strong> {searchedComplaint.category.replace(/_/g, ' ')}
                  </div>
                  <div>
                    <strong>Reported At:</strong> {new Date(searchedComplaint.reportedAt).toLocaleString()}
                  </div>
                  <div>
                    <strong>Location:</strong> {searchedComplaint.addressText}
                  </div>
                  <div>
                    <strong>Description:</strong> {searchedComplaint.description}
                  </div>
                  {searchedComplaint.duplicateClusterId && (
                    <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                      ⚡ Grouped in localized triage cluster ({searchedComplaint.duplicateClusterId})
                    </div>
                  )}
                </div>

                {/* Status Stepper */}
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 block mb-2 uppercase tracking-wider">
                    Investigation Progress
                  </span>
                  <div className="space-y-2">
                    {['NEW', 'ASSIGNED', 'FIELD_INSPECTION', 'ACTION_IN_PROGRESS', 'RESOLVED'].map((step, idx) => {
                      const currentIdx = ['NEW', 'ASSIGNED', 'FIELD_INSPECTION', 'ACTION_IN_PROGRESS', 'RESOLVED'].indexOf(searchedComplaint.status);
                      const isDone = currentIdx >= idx;
                      const isCurrent = currentIdx === idx;
                      return (
                        <div key={step} className="flex items-center gap-2 text-xs">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {isDone ? '✓' : idx + 1}
                          </span>
                          <span className={`${isCurrent ? 'font-bold text-slate-900' : isDone ? 'text-slate-700' : 'text-slate-400'}`}>
                            {step.replace(/_/g, ' ')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Grievance Feed in Citizen's City */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Recent City Water Reports</span>
              <span className="text-[10px] text-slate-400">Total: {complaints.length}</span>
            </div>
            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {complaints.slice(0, 4).map(c => (
                <div key={c.id} className="p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-slate-800">{c.ticketNumber}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="text-slate-600 font-medium">{c.category.replace(/_/g, ' ')}</div>
                  <div className="text-[11px] text-slate-400 truncate">{c.wardName} - {c.addressText}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

