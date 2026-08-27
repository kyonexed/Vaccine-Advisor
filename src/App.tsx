import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  XCircle, 
  HeartPulse, 
  User, 
  Search,
  RefreshCw,
  Scale,
  Minus,
  Plus
} from 'lucide-react';

interface PatientProfile {
  age: number;
  isPregnant: boolean;
  trimester: 'none' | '1st' | '2nd' | '3rd';
  conditions: string[];
  settings: string[];
}

interface VaccineRecommendation {
  id: string;
  name: string;
  brandExamples: string;
  category: 'routine' | 'risk-based' | 'contraindicated';
  schedule: string;
  rationale: string;
  contraindications?: string;
  priority: 'high' | 'medium' | 'critical';
}

const CONDITIONS_LIST = [
  { id: 'diabetes', label: 'Diabetes Mellitus' },
  { id: 'cardiopulmonary', label: 'Chronic Heart / Lung Disease (COPD, Asthma, CHF)' },
  { id: 'liver_kidney', label: 'Chronic Liver Disease / Renal Failure (ESRD/Dialysis)' },
  { id: 'immunocompromised', label: 'Immunocompromised (HIV, Chemo, Biologics, Transplant)' },
  { id: 'asplenia', label: 'Asplenia / Complement Deficiency' },
  { id: 'smoking', label: 'Current Cigarette Smoker' },
];

const SETTINGS_LIST = [
  { id: 'healthcare', label: 'Healthcare Worker' },
  { id: 'college_dorm', label: 'First-year College Student in Dorm / Military' },
  { id: 'travel', label: 'International Travel to Endemic Regions' },
];

export default function App() {
  const [patient, setPatient] = useState<PatientProfile>({
    age: 52,
    isPregnant: false,
    trimester: 'none',
    conditions: [],
    settings: [],
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'recommended' | 'contraindicated'>('all');

  const toggleCondition = (id: string) => {
    setPatient(prev => ({
      ...prev,
      conditions: prev.conditions.includes(id)
        ? prev.conditions.filter(c => c !== id)
        : [...prev.conditions, id],
    }));
  };

  const toggleSetting = (id: string) => {
    setPatient(prev => ({
      ...prev,
      settings: prev.settings.includes(id)
        ? prev.settings.filter(s => s !== id)
        : [...prev.settings, id],
    }));
  };

  const resetForm = () => {
    setPatient({
      age: 30,
      isPregnant: false,
      trimester: 'none',
      conditions: [],
      settings: [],
    });
  };

  const handleAgeChange = (value: number) => {
    const validAge = isNaN(value) ? 0 : Math.max(0, Math.min(120, value));
    setPatient(prev => ({ ...prev, age: validAge }));
  };

  // ACIP Evaluation Logic
  const recommendations: VaccineRecommendation[] = useMemo(() => {
    const list: VaccineRecommendation[] = [];
    const hasCondition = (id: string) => patient.conditions.includes(id);
    const hasSetting = (id: string) => patient.settings.includes(id);
    const isImmuno = hasCondition('immunocompromised') || hasCondition('asplenia');
    const hasChronic = hasCondition('diabetes') || hasCondition('cardiopulmonary') || hasCondition('liver_kidney') || hasCondition('smoking');

    // 1. Influenza
    list.push({
      id: 'flu',
      name: 'Influenza (Seasonal Flu)',
      brandExamples: patient.age >= 65 ? 'Fluzone High-Dose, Fluad, or Flublok preferred' : 'Standard IIV4/RIV4',
      category: 'routine',
      priority: 'high',
      schedule: '1 dose annually every autumn',
      rationale: patient.age >= 65 
        ? 'Age 65+: Higher-dose or adjuvanted influenza vaccine is preferentially recommended for enhanced immunogenicity.'
        : 'Universal recommendation for all individuals ≥ 6 months of age without contraindications.',
    });

    // 2. COVID-19
    list.push({
      id: 'covid',
      name: 'COVID-19 (Updated Formulation)',
      brandExamples: 'Comirnaty, Spikevax, or Novavax',
      category: 'routine',
      priority: 'high',
      schedule: isImmuno || patient.age >= 65 ? '1 dose updated formula + additional booster dose 6 months later' : '1 dose updated seasonal formula',
      rationale: isImmuno || patient.age >= 65
        ? 'High-risk profile: Eligible for additional booster intervals to sustain neutralizing antibodies.'
        : 'Recommended routinely to reduce risk of severe hospitalization and post-acute sequelae.',
    });

    // 3. Tdap / Td
    if (patient.isPregnant) {
      list.push({
        id: 'tdap',
        name: 'Tdap (Tetanus, Diphtheria, Pertussis)',
        brandExamples: 'Boostrix, Adacel',
        category: 'routine',
        priority: 'high',
        schedule: '1 dose during gestational weeks 27-36 of every pregnancy',
        rationale: 'Transfers high maternal pertussis antibodies across the placenta to protect neonate in early infancy.',
      });
    } else {
      list.push({
        id: 'tdap',
        name: 'Tdap / Td Booster',
        brandExamples: 'Boostrix, Tenivac',
        category: 'routine',
        priority: 'medium',
        schedule: '1 dose Tdap if never received as an adult, followed by Td or Tdap booster every 10 years',
        rationale: 'Maintains durable protective immunity against Clostridium tetani and Corynebacterium diphtheriae.',
      });
    }

    // 4. Shingles (RZV - Shingrix)
    if (patient.age >= 50 || (patient.age >= 19 && isImmuno)) {
      list.push({
        id: 'shingrix',
        name: 'Zoster Vaccine Recombinant (Shingrix)',
        brandExamples: 'Shingrix (RZV - Inactivated)',
        category: 'routine',
        priority: 'high',
        schedule: '2-dose series administered intramuscularly 2 to 6 months apart',
        rationale: patient.age >= 50
          ? 'Routinely recommended for all immunocompetent adults ≥ 50 years to prevent Herpes Zoster and Postherpetic Neuralgia (PHN).'
          : 'Indicated for adults 19-49 who are immunodeficient/immunosuppressed due to elevated reactivation risk.',
      });
    }

    // 5. Pneumococcal (PCV20 / PCV21 / PCV15 + PPSV23)
    if (patient.age >= 50) {
      list.push({
        id: 'pneumo',
        name: 'Pneumococcal Conjugate (PCV20 / PCV21)',
        brandExamples: 'Prevnar 20 or Capvaxive (PCV21)',
        category: 'routine',
        priority: 'high',
        schedule: 'Single dose PCV20 or PCV21 (or PCV15 followed by PPSV23 1 year later)',
        rationale: 'CDC lowered routine pneumococcal age criteria to ≥ 50 years to protect against invasive pneumococcal disease (IPD) and bacteremic pneumonia.',
      });
    } else if (hasChronic || isImmuno) {
      list.push({
        id: 'pneumo_risk',
        name: 'Pneumococcal Conjugate (High Risk 19-49)',
        brandExamples: 'Prevnar 20 or PCV21',
        category: 'risk-based',
        priority: 'high',
        schedule: '1 dose PCV20/PCV21 (or PCV15 followed by PPSV23 ≥ 8 weeks later for immunocompromise)',
        rationale: 'Recommended due to chronic pulmonary/cardiovascular/renal/metabolic illness or immunosuppression.',
      });
    }

    // 6. RSV (Respiratory Syncytial Virus)
    if (patient.age >= 75) {
      list.push({
        id: 'rsv',
        name: 'RSV Vaccine',
        brandExamples: 'Arexvy, Abrysvo, or mRESVIA',
        category: 'routine',
        priority: 'high',
        schedule: 'Single one-time dose prior to RSV season',
        rationale: 'Routinely recommended for all adults aged ≥ 75 to prevent severe lower respiratory tract disease.',
      });
    } else if (patient.age >= 50 && (hasChronic || isImmuno)) {
      list.push({
        id: 'rsv_risk',
        name: 'RSV Vaccine (Risk Indication 50-74)',
        brandExamples: 'Arexvy or Abrysvo',
        category: 'risk-based',
        priority: 'high',
        schedule: 'Single one-time dose',
        rationale: 'Indicated for adults 50-74 with qualifying high-risk chronic conditions (heart/lung disease, diabetes, or immunocompromise).',
      });
    } else if (patient.isPregnant) {
      list.push({
        id: 'rsv_mat',
        name: 'Maternal RSV Vaccine (Abrysvo)',
        brandExamples: 'Abrysvo ONLY (Pfizer)',
        category: 'risk-based',
        priority: 'high',
        schedule: '1 dose administered between gestational weeks 32 through 36 from September through January',
        rationale: 'Provides passive transplacental maternal antibodies protecting infants from severe RSV bronchiolitis up to 6 months of age.',
      });
    }

    // 7. Hepatitis B
    if (patient.age <= 59) {
      list.push({
        id: 'hepb',
        name: 'Hepatitis B',
        brandExamples: 'Engerix-B, Recombivax HB, or Heplisav-B',
        category: 'routine',
        priority: 'medium',
        schedule: '2-dose (Heplisav-B at 0, 1 mo) or 3-dose (0, 1, 6 mo) series if unvaccinated',
        rationale: 'Universal routine recommendation for all adults aged 19 through 59 regardless of risk factors.',
      });
    } else if (hasSetting('healthcare') || hasCondition('diabetes') || hasCondition('liver_kidney')) {
      list.push({
        id: 'hepb_risk',
        name: 'Hepatitis B (Risk Indication ≥60)',
        brandExamples: 'Heplisav-B or Engerix-B',
        category: 'risk-based',
        priority: 'high',
        schedule: '2 or 3-dose series',
        rationale: 'Recommended for adults ≥ 60 with risk factors including occupational exposure, diabetes, or ESRD.',
      });
    }

    // 8. HPV
    if (patient.age <= 26) {
      list.push({
        id: 'hpv',
        name: 'Human Papillomavirus (9-valent)',
        brandExamples: 'Gardasil 9',
        category: 'routine',
        priority: 'high',
        schedule: '2 or 3 doses depending on initial age of first dose (<15 vs ≥15)',
        rationale: 'Prevents cervical, anogenital, and oropharyngeal cancers. Routine catch-up through age 26.',
      });
    } else if (patient.age >= 27 && patient.age <= 45) {
      list.push({
        id: 'hpv_shared',
        name: 'HPV (Shared Clinical Decision-Making)',
        brandExamples: 'Gardasil 9',
        category: 'risk-based',
        priority: 'medium',
        schedule: '3-dose series (0, 1-2, 6 months) after clinical evaluation',
        rationale: 'Adults aged 27-45 may benefit based on new relationship partners, exposure history, and personal risk.',
      });
    }

    // 9. Meningococcal (MenACWY / MenB)
    if (hasSetting('college_dorm') || hasCondition('asplenia') || hasSetting('travel')) {
      list.push({
        id: 'mening',
        name: 'Meningococcal (MenACWY / MenB)',
        brandExamples: 'MenQuadfi, Menveo (ACWY) & Bexsero, Trumenba (MenB)',
        category: 'risk-based',
        priority: 'high',
        schedule: 'MenACWY booster + MenB multi-dose series depending on risk group',
        rationale: 'Indicated for anatomic/functional asplenia, travel to meningitis belt, and collegiate dorm living.',
      });
    }

    // 10. Live Vaccines Contraindications (MMR & Varicella)
    if (patient.isPregnant || isImmuno) {
      list.push({
        id: 'contra_live',
        name: 'Live Attenuated Vaccines (MMR, Varicella, LAIV Flu)',
        brandExamples: 'M-M-R II, Varivax, FluMist',
        category: 'contraindicated',
        priority: 'critical',
        schedule: 'DO NOT ADMINISTER',
        rationale: 'Contraindicated: Theoretical risk of congenital rubella syndrome, fetal viremia, or unchecked live viral replication in immunocompromised hosts.',
        contraindications: patient.isPregnant ? 'Current Pregnancy' : 'Immunocompromised state',
      });
    } else if (patient.age < 50) {
      list.push({
        id: 'mmr_catchup',
        name: 'MMR & Varicella (Catch-up)',
        brandExamples: 'M-M-R II, Varivax',
        category: 'routine',
        priority: 'medium',
        schedule: '1 to 2 doses if no documented evidence of immunity or laboratory titers',
        rationale: 'Recommended for non-pregnant adults without presumptive evidence of immunity (born in 1957 or later).',
      });
    }

    return list;
  }, [patient]);

  const filteredRecs = useMemo(() => {
    return recommendations.filter(rec => {
      const matchesSearch = rec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            rec.brandExamples.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            rec.rationale.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (activeTab === 'recommended') return rec.category !== 'contraindicated';
      if (activeTab === 'contraindicated') return rec.category === 'contraindicated';
      return true;
    });
  }, [recommendations, searchQuery, activeTab]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 bg-slate-50 min-h-screen text-slate-800 font-sans">
      {/* Header */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-2xl">
            <HeartPulse className="w-8 h-8" />
            <h1>CDC / ACIP Vaccine Navigator</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time clinical immunization decision engine tailored to patient age and risk profile.
          </p>
        </div>
        <button
          onClick={resetForm}
          className="flex items-center gap-2 text-xs font-semibold px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg shadow-sm transition self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Patient Profile
        </button>
      </header>

      {/* Top Advisory Banner */}
      <div className="mb-6 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Clinical Informational Notice:</span> This tool assists clinical review using publicly available CDC / ACIP schedules. It is not an automated medical prescriber.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Patient Profile Controls */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 font-semibold text-slate-900 border-b border-slate-100 pb-3">
            <User className="w-5 h-5 text-indigo-500" />
            <h2>Patient Profile & Clinical Factors</h2>
          </div>

          {/* Age Input Box */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Patient Age (Years)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAgeChange(patient.age - 1)}
                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 font-bold transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min="0"
                max="120"
                value={patient.age === 0 ? '' : patient.age}
                placeholder="0"
                onChange={(e) => handleAgeChange(parseInt(e.target.value) || 0)}
                className="flex-1 h-10 px-3 text-center text-lg font-bold text-indigo-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => handleAgeChange(patient.age + 1)}
                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 font-bold transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mt-1 px-1">
              <span>0 (Infant)</span>
              <span>19 (Adult)</span>
              <span>50 (Shingrix/PCV)</span>
              <span>65+ (Senior)</span>
            </div>
          </div>

          {/* Pregnancy Toggle */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-800">Currently Pregnant?</div>
                <div className="text-xs text-slate-500">Triggers maternal Tdap & RSV, flags live vaccines</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={patient.isPregnant}
                  onChange={(e) => setPatient({ ...patient, isPregnant: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>

          {/* Underlying Conditions */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Underlying Medical Conditions
            </label>
            <div className="space-y-2">
              {CONDITIONS_LIST.map((cond) => {
                const active = patient.conditions.includes(cond.id);
                return (
                  <button
                    key={cond.id}
                    onClick={() => toggleCondition(cond.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium border transition flex items-center justify-between ${
                      active
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cond.label}</span>
                    {active ? <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> : <div className="w-4 h-4 border border-slate-300 rounded-full shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Setting / Environmental Risks */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Occupational & Living Factors
            </label>
            <div className="space-y-2">
              {SETTINGS_LIST.map((setting) => {
                const active = patient.settings.includes(setting.id);
                return (
                  <button
                    key={setting.id}
                    onClick={() => toggleSetting(setting.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium border transition flex items-center justify-between ${
                      active
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{setting.label}</span>
                    {active ? <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> : <div className="w-4 h-4 border border-slate-300 rounded-full shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Recommendations Output */}
        <div className="lg:col-span-7 space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search vaccines, brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 sm:flex-none px-3 py-1 text-xs font-medium rounded-md transition ${
                  activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({recommendations.length})
              </button>
              <button
                onClick={() => setActiveTab('recommended')}
                className={`flex-1 sm:flex-none px-3 py-1 text-xs font-medium rounded-md transition ${
                  activeTab === 'recommended' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Indicated ({recommendations.filter(r => r.category !== 'contraindicated').length})
              </button>
              <button
                onClick={() => setActiveTab('contraindicated')}
                className={`flex-1 sm:flex-none px-3 py-1 text-xs font-medium rounded-md transition ${
                  activeTab === 'contraindicated' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Warnings ({recommendations.filter(r => r.category === 'contraindicated').length})
              </button>
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-3">
            {filteredRecs.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-sm">
                No matching vaccine guidelines found for current query.
              </div>
            ) : (
              filteredRecs.map((rec) => {
                const isContra = rec.category === 'contraindicated';
                const isRoutine = rec.category === 'routine';

                return (
                  <div
                    key={rec.id}
                    className={`bg-white rounded-xl border p-4 transition shadow-xs ${
                      isContra
                        ? 'border-rose-300 bg-rose-50/40'
                        : isRoutine
                        ? 'border-emerald-200 hover:border-emerald-300'
                        : 'border-indigo-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isContra
                                ? 'bg-rose-100 text-rose-800'
                                : isRoutine
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {isContra ? 'Contraindication' : isRoutine ? 'Routine Universal' : 'Risk / Setting Indicated'}
                          </span>
                          <span className="text-xs text-slate-400">• {rec.brandExamples}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-base mt-1">{rec.name}</h3>
                      </div>
                      <div>
                        {isContra ? (
                          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        ) : (
                          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                        )}
                      </div>
                    </div>

                    {/* Schedule / Timing */}
                    <div className="mt-3 bg-white/70 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-700">
                      <span className="font-semibold text-slate-900">Dosage & Schedule: </span>
                      {rec.schedule}
                    </div>

                    {/* Clinical Rationale */}
                    <div className="mt-2 text-xs text-slate-600 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{rec.rationale}</span>
                    </div>

                    {/* Contraindication detail if any */}
                    {rec.contraindications && (
                      <div className="mt-2 text-xs font-semibold text-rose-700 flex items-center gap-1.5 bg-rose-100/60 p-2 rounded-md">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Flagged by: {rec.contraindications}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Comprehensive Medical Liability Disclaimer Footer */}
      <footer className="mt-12 pt-6 border-t border-slate-200">
        <div className="bg-slate-100 rounded-2xl p-5 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-2">
            <Scale className="w-4 h-4 text-slate-600" />
            <h3>Medical & Regulatory Disclaimer</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>For Educational and Informational Purposes Only:</strong> This application is intended solely as an interactive reference tool based on published CDC and ACIP immunization schedules. It does not provide medical advice, diagnosis, or treatment recommendations, and does not establish a physician-patient relationship.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed mt-2">
            Always consult a licensed physician, pharmacist, or other qualified healthcare provider with any questions regarding individual clinical immunization plans, allergy profiles, or contraindications. CDC and product trade names are referenced strictly under nominative fair use for identification purposes.
          </p>
        </div>
      </footer>
    </div>
  );
}