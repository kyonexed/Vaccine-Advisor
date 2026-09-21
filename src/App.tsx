import { useState, useMemo } from 'react';
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
  Plus,
  ClipboardCopy,
  Printer,
  History,
  Layers,
  ChevronDown,
  ChevronUp,
  BookOpen
} from 'lucide-react';

interface PriorDoseState {
  fluThisSeason: boolean;
  covidRecent: boolean;
  tdapWithin10Yrs: boolean;
  shingrixCompleted: boolean;
  priorPneumococcal: 'none' | 'pcv15' | 'pcv20' | 'ppsv23_only';
  hepbCompleted: boolean;
  hibReceived: boolean;
  menAcwyCompleted: boolean;
  menBCompleted: boolean;
}

interface PatientProfile {
  age: number;
  isPregnant: boolean;
  conditions: string[];
  settings: string[];
  history: PriorDoseState;
}

interface VaccineRecommendation {
  id: string;
  name: string;
  brandExamples: string;
  fdaAgeRange: string;
  category: 'routine' | 'shared-decision' | 'risk-based' | 'contraindicated' | 'completed';
  schedule: string;
  rationale: string;
  sourceCitation: string;
  contraindications?: string;
  priority: 'high' | 'medium' | 'critical' | 'informational';
}

const CONDITIONS_LIST = [
  { id: 'diabetes', label: 'Diabetes Mellitus' },
  { id: 'cardiopulmonary', label: 'Chronic Heart / Lung Disease (COPD, Asthma, CHF)' },
  { id: 'liver_kidney', label: 'Chronic Liver Disease / ESRD / Dialysis' },
  { id: 'immunocompromised', label: 'Immunocompromised (HIV, Chemo, Biologics, Transplant)' },
  { id: 'asplenia', label: 'Asplenia / Complement Deficiency / Sickle Cell' },
  { id: 'smoking', label: 'Current Cigarette Smoker' },
];

const SETTINGS_LIST = [
  { id: 'healthcare', label: 'Healthcare Worker' },
  { id: 'college_dorm', label: 'First-year College Student in Dorm / Military' },
  { id: 'travel', label: 'International Travel to Endemic Regions' },
];

export default function App() {
  const [patient, setPatient] = useState<PatientProfile>({
    age: 0,
    isPregnant: false,
    conditions: [],
    settings: [],
    history: {
      fluThisSeason: false,
      covidRecent: false,
      tdapWithin10Yrs: false,
      shingrixCompleted: false,
      priorPneumococcal: 'none',
      hepbCompleted: false,
      hibReceived: false,
      menAcwyCompleted: false,
      menBCompleted: false,
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'indicated' | 'scdm' | 'contraindicated'>('all');
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showCoAdminModal, setShowCoAdminModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

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

  const updateHistory = (key: keyof PriorDoseState, value: any) => {
    setPatient(prev => ({
      ...prev,
      history: {
        ...prev.history,
        [key]: value
      }
    }));
  };

  const resetForm = () => {
    setPatient({
      age: 0,
      isPregnant: false,
      conditions: [],
      settings: [],
      history: {
        fluThisSeason: false,
        covidRecent: false,
        tdapWithin10Yrs: false,
        shingrixCompleted: false,
        priorPneumococcal: 'none',
        hepbCompleted: false,
        hibReceived: false,
        menAcwyCompleted: false,
        menBCompleted: false,
      }
    });
  };

  const handleAgeChange = (value: number) => {
    const validAge = isNaN(value) ? 0 : Math.max(0, Math.min(120, value));
    setPatient(prev => ({ ...prev, age: validAge }));
  };

  // Comprehensive ACIP Evaluation Engine
  const recommendations: VaccineRecommendation[] = useMemo(() => {
    const list: VaccineRecommendation[] = [];
    const hasCondition = (id: string) => patient.conditions.includes(id);
    const hasSetting = (id: string) => patient.settings.includes(id);
    const isImmuno = hasCondition('immunocompromised');
    const isAsplenia = hasCondition('asplenia');
    const hasChronic = hasCondition('diabetes') || hasCondition('cardiopulmonary') || hasCondition('liver_kidney') || hasCondition('smoking');

    // 1. INFLUENZA
    if (patient.history.fluThisSeason) {
      list.push({
        id: 'flu_done',
        name: 'Influenza (Seasonal Flu)',
        brandExamples: 'Fluzone, Fluarix, Flublok, Fluzone High-Dose',
        fdaAgeRange: 'Fluzone/Fluarix: ≥6 mos; Flublok: ≥18 yrs; Fluzone HD/Fluad: ≥65 yrs',
        category: 'completed',
        priority: 'informational',
        schedule: 'Documented for current season',
        rationale: 'Patient has already received seasonal influenza vaccination for the current cycle.',
        sourceCitation: 'CDC MMWR / Prevention and Control of Seasonal Influenza with Vaccines: ACIP Recommendations',
      });
    } else {
      list.push({
        id: 'flu',
        name: 'Influenza (Seasonal Flu)',
        brandExamples: patient.age >= 65 ? 'Fluzone High-Dose, Fluad, or Flublok (Preferred)' : 'Standard IIV4/RIV4 or ccIIV4',
        fdaAgeRange: patient.age >= 65 ? 'High-dose/Adjuvanted: ≥65 years' : 'Standard IIV4: ≥6 months',
        category: 'routine',
        priority: 'high',
        schedule: '1 dose annually every autumn/winter season',
        rationale: patient.age >= 65 
          ? 'Age ≥65: Higher-dose or adjuvanted influenza vaccine is preferentially recommended for enhanced immunogenicity.'
          : 'Universal annual recommendation for all individuals aged ≥6 months without contraindications.',
        sourceCitation: 'CDC MMWR Recommendations and Reports / ACIP Seasonal Influenza Schedule',
      });
    }

    // 2. COVID-19 (Shared Decision Making Guidance)
    if (patient.history.covidRecent) {
      list.push({
        id: 'covid_done',
        name: 'COVID-19 (Updated Formulation)',
        brandExamples: 'Spikevax (Moderna), Comirnaty (Pfizer), Novavax',
        fdaAgeRange: 'Spikevax: ≥6 mos; Comirnaty: ≥5 yrs; Novavax: ≥12 yrs',
        category: 'completed',
        priority: 'informational',
        schedule: 'Up to date for current seasonal cycle',
        rationale: 'Patient reports recent receipt of the updated seasonal formulation. Additional doses indicated only for immunocompromise.',
        sourceCitation: 'CDC ACIP COVID-19 Clinical Considerations',
      });
    } else if (patient.age >= 65) {
      list.push({
        id: 'covid_senior',
        name: 'COVID-19 (Updated Formulation)',
        brandExamples: 'Spikevax (Moderna), Comirnaty (Pfizer), Novavax',
        fdaAgeRange: 'Spikevax: ≥6 mos; Comirnaty: ≥5 yrs; Novavax: ≥12 yrs',
        category: 'shared-decision',
        priority: 'high',
        schedule: '1 dose updated seasonal formulation; optional additional dose 6 months later based on SCDM',
        rationale: 'ACIP Guideline: Recommended based on individual-based / shared clinical decision-making (SCDM). Risk-benefit is highly favorable in older adults due to elevated hospitalization risk.',
        sourceCitation: 'CDC ACIP Recommendations for Individual Decision-Making for COVID-19 Vaccination',
      });
    } else if (isImmuno || isAsplenia || hasChronic || patient.isPregnant) {
      list.push({
        id: 'covid_risk',
        name: 'COVID-19 (Updated Formulation)',
        brandExamples: 'Spikevax, Comirnaty, Novavax',
        fdaAgeRange: 'Spikevax: ≥6 mos; Comirnaty: ≥5 yrs; Novavax: ≥12 yrs',
        category: 'shared-decision',
        priority: 'high',
        schedule: isImmuno ? '1 dose updated formulation + eligible for additional dose ≥2 months later' : '1 dose updated seasonal formulation',
        rationale: 'ACIP Guideline: Shared Clinical Decision-Making (SCDM) for individuals <65 years. The risk-benefit ratio is most favorable for individuals with chronic conditions, immunocompromise, asplenia, or pregnancy.',
        sourceCitation: 'CDC MMWR / ACIP Update: Guidance for COVID-19 Immunization via Individual Decision-Making',
      });
    } else {
      list.push({
        id: 'covid_healthy',
        name: 'COVID-19 (Updated Formulation)',
        brandExamples: 'Spikevax, Comirnaty, Novavax',
        fdaAgeRange: 'Spikevax: ≥6 mos; Comirnaty: ≥5 yrs; Novavax: ≥12 yrs',
        category: 'shared-decision',
        priority: 'medium',
        schedule: '1 dose updated seasonal formulation via clinical consultation',
        rationale: 'ACIP Guideline: Administered under shared clinical decision-making (SCDM). Clinical discussion considers baseline personal risk and community transmission.',
        sourceCitation: 'HHS / ACIP Adult & Child Immunization Schedules / Shared Clinical Decision-Making Guidance',
      });
    }

    // 3. PEDIATRIC SPECIFIC (Age < 19)
    if (patient.age < 19) {
      if (patient.age < 1) {
        list.push({
          id: 'ped_rotavirus',
          name: 'Rotavirus (RV1 / RV5)',
          brandExamples: 'Rotarix (RV1 - 2 doses), RotaTeq (RV5 - 3 doses)',
          fdaAgeRange: '6 weeks through 8 months 0 days',
          category: 'routine',
          priority: 'high',
          schedule: '2-dose (2, 4 mos) or 3-dose (2, 4, 6 mos) oral series. Max age for final dose is 8 mos 0 days.',
          rationale: 'Prevents severe rotavirus gastroenteritis and dehydration in infants.',
          sourceCitation: 'CDC Child and Adolescent Immunization Schedule / MMWR Rotavirus ACIP Guidelines',
        });
      }

      if (patient.age < 7) {
        list.push({
          id: 'ped_dtap',
          name: 'DTaP (Diphtheria, Tetanus, acellular Pertussis)',
          brandExamples: 'Infanrix, Daptacel',
          fdaAgeRange: '6 weeks through 6 years (up to 7th birthday)',
          category: 'routine',
          priority: 'high',
          schedule: '5-dose primary series at 2, 4, 6, 15-18 months, and 4-6 years',
          rationale: 'Standard pediatric active immunization against tetanus, diphtheria, and pertussis before age 7.',
          sourceCitation: 'CDC ACIP DTaP Schedule / FDA Package Insert (Infanrix)',
        });
      }

      if (patient.age >= 11 && patient.age <= 12) {
        list.push({
          id: 'ped_adolescent_booster',
          name: 'Adolescent Tdap & MenACWY',
          brandExamples: 'Boostrix/Adacel (Tdap); MenQuadfi/Menveo (MenACWY)',
          fdaAgeRange: 'Boostrix: ≥10 yrs; Adacel: 10-64 yrs; MenQuadfi: ≥2 yrs',
          category: 'routine',
          priority: 'high',
          schedule: 'Single dose Tdap at 11-12 years; Single dose MenACWY at 11-12 years (booster at 16 years)',
          rationale: 'Routine adolescent platform addressing waning pertussis immunity and adolescent meningococcal risk.',
          sourceCitation: 'CDC Recommended Child and Adolescent Immunization Schedule',
        });
      }
    }

    // 4. TDAP / TD
    if (patient.age >= 19 || patient.isPregnant) {
      if (patient.isPregnant) {
        list.push({
          id: 'tdap_preg',
          name: 'Tdap (Tetanus, Diphtheria, Pertussis - Maternal)',
          brandExamples: 'Boostrix, Adacel',
          fdaAgeRange: 'Boostrix: approved for all ages ≥10 yrs, including 3rd trimester pregnancy',
          category: 'routine',
          priority: 'high',
          schedule: '1 dose administered during gestational weeks 27 through 36 of EVERY pregnancy',
          rationale: 'Maximizes transplacental transfer of high-titer maternal anti-pertussis IgG antibodies to protect the infant prior to primary series eligibility.',
          sourceCitation: 'CDC MMWR / Updated Recommendations for Use of Tdap in Pregnant Women',
        });
      } else if (patient.history.tdapWithin10Yrs) {
        list.push({
          id: 'tdap_current',
          name: 'Tdap / Td Booster',
          brandExamples: 'Boostrix, Adacel, Tenivac',
          fdaAgeRange: 'Boostrix: ≥10 yrs; Adacel: 10-64 yrs; Tenivac: ≥7 yrs',
          category: 'completed',
          priority: 'informational',
          schedule: 'Up to date (Next booster indicated 10 years after last documented dose)',
          rationale: 'Documented tetanus/diphtheria protection within the past 10-year window.',
          sourceCitation: 'CDC ACIP Adult Schedule Guidelines',
        });
      } else {
        list.push({
          id: 'tdap_adult',
          name: 'Tdap / Td Booster',
          brandExamples: 'Boostrix, Adacel, Tenivac',
          fdaAgeRange: 'Boostrix: ≥10 yrs; Adacel: 10-64 yrs; Tenivac: ≥7 yrs',
          category: 'routine',
          priority: 'medium',
          schedule: '1 dose Tdap now if never received as an adult, followed by Td or Tdap every 10 years',
          rationale: 'Maintains neutralizing antitoxin titers against Clostridium tetani and Corynebacterium diphtheriae.',
          sourceCitation: 'CDC ACIP Adult Immunization Schedule',
        });
      }
    }

    // 5. SHINGLES (RZV - Immunocompromise Indication)
    if (patient.history.shingrixCompleted) {
      list.push({
        id: 'shingrix_done',
        name: 'Zoster Vaccine Recombinant (Shingrix)',
        brandExamples: 'Shingrix (RZV - Recombinant Adjuvanted)',
        fdaAgeRange: 'FDA Approved: Adults ≥50 years, and Adults ≥18 years who are immunocompromised',
        category: 'completed',
        priority: 'informational',
        schedule: 'Series Completed (2 doses documented)',
        rationale: 'Full 2-dose series confers >90% long-term protection against Herpes Zoster and PHN.',
        sourceCitation: 'CDC MMWR Recommendations of ACIP / Shingrix Package Insert (GSK)',
      });
    } else if (patient.age >= 50 || (patient.age >= 19 && isImmuno)) {
      list.push({
        id: 'shingrix',
        name: 'Zoster Vaccine Recombinant (Shingrix)',
        brandExamples: 'Shingrix (RZV - Non-live)',
        fdaAgeRange: 'FDA Approved: Adults ≥50 years, and Adults ≥18 years who are immunocompromised',
        category: 'routine',
        priority: 'high',
        schedule: '2-dose intramuscular series (0, 2-6 months; 0, 1-2 months if immunocompromised)',
        rationale: patient.age >= 50
          ? 'Routinely recommended for all immunocompetent adults ≥50 years regardless of prior zoster disease or Zostavax.'
          : 'Indicated for adults 19-49 who are or will be immunodeficient or immunosuppressed due to disease or therapy.',
        sourceCitation: 'CDC ACIP MMWR Recommendations for Use of Recombinant Zoster Vaccine',
      });
    }

    // 6. PNEUMOCOCCAL (Tailored with Prior History)
    if (patient.history.priorPneumococcal === 'pcv20') {
      list.push({
        id: 'pneumo_completed',
        name: 'Pneumococcal Conjugate',
        brandExamples: 'Prevnar 20 (PCV20) / Capvaxive (PCV21)',
        fdaAgeRange: 'Prevnar 20: ≥6 wks; Capvaxive: ≥18 yrs',
        category: 'completed',
        priority: 'informational',
        schedule: 'Complete single-dose PCV20/PCV21 regimen already documented',
        rationale: 'A single dose of PCV20 or PCV21 provides broad, durable capsular serotype coverage without requiring routine PPSV23 booster.',
        sourceCitation: 'CDC ACIP Pneumococcal Vaccination Schedule Guidelines',
      });
    } else if (patient.history.priorPneumococcal === 'ppsv23_only') {
      list.push({
        id: 'pneumo_post_ppsv23',
        name: 'Pneumococcal Conjugate (Post-PPSV23 Catch-Up)',
        brandExamples: 'Prevnar 20 (PCV20), Capvaxive (PCV21), or Vaxneuvance (PCV15)',
        fdaAgeRange: 'PCV20: ≥6 wks; PCV21: ≥18 yrs; PCV15: ≥6 wks',
        category: 'risk-based',
        priority: 'high',
        schedule: '1 dose PCV20, PCV21, or PCV15 administered ≥ 1 year after the most recent PPSV23 dose. No further PPSV23 doses needed.',
        rationale: 'For patients who previously received PPSV23 only, a conjugate vaccine (PCV20, PCV21, or PCV15) is recommended ≥1 year later to establish conjugate T-cell dependent immune memory without further PPSV23 booster doses.',
        sourceCitation: 'CDC MMWR / ACIP Pneumococcal Vaccination for Adults with Previous PPSV23',
      });
    } else if (patient.history.priorPneumococcal === 'pcv15') {
      list.push({
        id: 'pneumo_post_pcv15',
        name: 'Pneumococcal Polysaccharide (PPSV23 Follow-up)',
        brandExamples: 'Pneumovax 23 (PPSV23)',
        fdaAgeRange: 'PPSV23: ≥2 yrs',
        category: 'risk-based',
        priority: 'high',
        schedule: (isImmuno || isAsplenia) 
          ? '1 dose PPSV23 administered ≥ 8 weeks after PCV15' 
          : '1 dose PPSV23 administered ≥ 1 year after PCV15',
        rationale: 'Completion of two-step series following initial PCV15 dose.',
        sourceCitation: 'CDC ACIP Pneumococcal Recommendations',
      });
    } else if (patient.age >= 50) {
      list.push({
        id: 'pneumo_routine',
        name: 'Pneumococcal Conjugate (PCV20 or PCV21)',
        brandExamples: 'Prevnar 20 (PCV20, Pfizer) or Capvaxive (PCV21, Merck)',
        fdaAgeRange: 'Prevnar 20: Infants ≥6 wks and Adults; Capvaxive (PCV21): Adults ≥18 yrs',
        category: 'routine',
        priority: 'high',
        schedule: '1 dose PCV20 or PCV21 alone (or PCV15 followed by PPSV23 ≥1 year later)',
        rationale: 'CDC routinely recommends pneumococcal immunization starting at age 50 to protect against invasive pneumococcal disease and pneumonia.',
        sourceCitation: 'CDC ACIP Updated Pneumococcal Recommendations / Capvaxive FDA Approval',
      });
    } else if (hasChronic || isImmuno || isAsplenia) {
      list.push({
        id: 'pneumo_highrisk',
        name: 'Pneumococcal Conjugate (High Risk 19-49)',
        brandExamples: 'Prevnar 20 (PCV20) or Capvaxive (PCV21)',
        fdaAgeRange: 'Prevnar 20: ≥6 wks; Capvaxive: ≥18 yrs',
        category: 'risk-based',
        priority: 'high',
        schedule: (isImmuno || isAsplenia)
          ? '1 dose PCV20 or PCV21 alone (or PCV15 followed by PPSV23 ≥8 weeks later)'
          : '1 dose PCV20 or PCV21 alone (or PCV15 followed by PPSV23 ≥1 year later)',
        rationale: 'Indicated for adults 19-49 with chronic medical conditions, asplenia, or immunocompromising states due to heightened risk of invasive pneumococcal disease (IPD).',
        sourceCitation: 'CDC MMWR / ACIP Pneumococcal Conjugate Vaccines in Adults with Underlying Conditions',
      });
    }

    // 7. ASPLENIA SPECIFIC ENCAPSULATED ORGANISM COVERAGE
    // Meningococcal ACWY
    if (isAsplenia || hasSetting('college_dorm') || hasSetting('travel')) {
      if (patient.history.menAcwyCompleted && !isAsplenia) {
        list.push({
          id: 'men_acwy_done',
          name: 'Meningococcal ACWY (MenACWY)',
          brandExamples: 'MenQuadfi, Menveo',
          fdaAgeRange: 'Menveo: ≥2 mos; MenQuadfi: ≥2 yrs',
          category: 'completed',
          priority: 'informational',
          schedule: 'Documented Series Completed',
          rationale: 'Up to date for standard risk indications.',
          sourceCitation: 'CDC ACIP Meningococcal Schedule',
        });
      } else {
        list.push({
          id: 'men_acwy',
          name: 'Meningococcal ACWY (MenACWY)',
          brandExamples: 'MenQuadfi, Menveo',
          fdaAgeRange: 'Menveo: ≥2 mos; MenQuadfi: ≥2 yrs',
          category: 'risk-based',
          priority: 'high',
          schedule: isAsplenia 
            ? '2-dose primary series administered ≥ 8 weeks apart, followed by a booster dose every 5 years throughout life' 
            : '1 dose (booster every 5 years if persistent exposure/travel risk)',
          rationale: isAsplenia
            ? 'CRITICAL FOR ASPLENIA: Anatomic/functional asplenia impairs clearance of encapsulated Neisseria meningitidis, predisposing to fulminant meningococcemia. Requires 2-dose primary series + 5-year lifelong boosters.'
            : 'Indicated for dormitory residents or travel to hyperendemic regions.',
          sourceCitation: 'CDC MMWR / Recommendations for Use of Meningococcal Conjugate Vaccines in Persons with Anatomic or Functional Asplenia',
        });
      }
    }

    // Meningococcal B
    if (isAsplenia) {
      if (patient.history.menBCompleted) {
        list.push({
          id: 'men_b_booster',
          name: 'Meningococcal B (MenB - Booster Due)',
          brandExamples: 'Bexsero (2-dose initial), Trumenba (3-dose initial)',
          fdaAgeRange: 'Bexsero & Trumenba: Approved for individuals 10 through 25 years (and older if high risk)',
          category: 'risk-based',
          priority: 'high',
          schedule: '1 booster dose 1 year after primary series completion, then regular booster every 2-3 years while asplenic',
          rationale: 'Waning bactericidal antibodies against Serogroup B necessitate regular boosters in patients with asplenia.',
          sourceCitation: 'CDC ACIP Meningococcal B Recommendations for High-Risk Individuals',
        });
      } else {
        list.push({
          id: 'men_b_primary',
          name: 'Meningococcal B (MenB Series)',
          brandExamples: 'Bexsero (2-dose series: 0, 1 mo) or Trumenba (3-dose series: 0, 1-2, 6 mos)',
          fdaAgeRange: 'Bexsero & Trumenba: Approved for age ≥10 years in persons at increased risk',
          category: 'risk-based',
          priority: 'high',
          schedule: 'Bexsero: 2 doses (0, 1 month) OR Trumenba: 3 doses (0, 1-2, 6 months). Follow with booster 1 year later.',
          rationale: 'CRITICAL FOR ASPLENIA: High risk for invasive Serogroup B meningococcal disease. Brands are NOT interchangeable; complete full series with same manufacturer.',
          sourceCitation: 'CDC MMWR / Use of Serogroup B Meningococcal Vaccines in Persons with High-Risk Conditions',
        });
      }
    }

    // Haemophilus influenzae type b (Hib)
    if (isAsplenia) {
      if (patient.history.hibReceived) {
        list.push({
          id: 'hib_done',
          name: 'Haemophilus influenzae type b (Hib)',
          brandExamples: 'ActHIB, Hiberix, PedvaxHIB',
          fdaAgeRange: 'ActHIB/Hiberix/PedvaxHIB: Approved in infants & indicated in asplenic adults',
          category: 'completed',
          priority: 'informational',
          schedule: 'Documented 1-dose series received',
          rationale: 'Asplenic patient has documented protection against Hib encapsulated bacteremia.',
          sourceCitation: 'CDC ACIP Hib Vaccination Guidelines',
        });
      } else {
        list.push({
          id: 'hib_asplenia',
          name: 'Haemophilus influenzae type b (Hib)',
          brandExamples: 'ActHIB, Hiberix, or PedvaxHIB',
          fdaAgeRange: 'PedvaxHIB: ≥6 wks; ActHIB/Hiberix: ≥6 wks; Indicated across all ages with asplenia',
          category: 'risk-based',
          priority: 'high',
          schedule: '1 dose IM if no documented childhood/adult series (at least 14 days prior to elective splenectomy if planned)',
          rationale: 'CRITICAL FOR ASPLENIA: Asplenia eliminates splenic phagocytic clearance of encapsulated H. influenzae, creating susceptibility to rapid septic shock.',
          sourceCitation: 'CDC ACIP Guidelines for Hib Vaccination in Persons with Functional or Anatomic Asplenia',
        });
      }
    }

    // 8. RSV
    if (patient.age >= 75) {
      list.push({
        id: 'rsv_75',
        name: 'Respiratory Syncytial Virus (RSV)',
        brandExamples: 'Arexvy (GSK), Abrysvo (Pfizer), mRESVIA (Moderna)',
        fdaAgeRange: 'Arexvy/Abrysvo: ≥60 yrs; mRESVIA: ≥60 yrs',
        category: 'routine',
        priority: 'high',
        schedule: 'Single one-time dose prior to onset of RSV season',
        rationale: 'Routinely recommended for all adults aged ≥75 years to prevent severe lower respiratory tract disease (LRTD).',
        sourceCitation: 'CDC ACIP Adult RSV Vaccination Guidelines',
      });
    } else if (patient.age >= 50 && (hasChronic || isImmuno)) {
      list.push({
        id: 'rsv_risk',
        name: 'RSV Vaccine (Risk Indication 50-74)',
        brandExamples: 'Arexvy, Abrysvo, or mRESVIA',
        fdaAgeRange: 'Arexvy: ≥50 yrs (expanded approval); Abrysvo/mRESVIA: ≥60 yrs',
        category: 'risk-based',
        priority: 'high',
        schedule: 'Single one-time dose prior to peak seasonal transmission',
        rationale: 'Indicated for adults 50-74 at increased risk due to chronic illness or immunocompromise.',
        sourceCitation: 'CDC ACIP RSV Recommendations for High-Risk Adults Aged 50-74',
      });
    } else if (patient.isPregnant) {
      list.push({
        id: 'rsv_maternal',
        name: 'Maternal RSV Vaccine (Abrysvo Only)',
        brandExamples: 'Abrysvo (Pfizer) - ONLY unadjuvanted formulation approved in pregnancy',
        fdaAgeRange: 'FDA Approved for pregnant individuals at 32 through 36 weeks gestational age',
        category: 'routine',
        priority: 'high',
        schedule: '1 dose administered at 32 through 36 weeks gestation during September–January',
        rationale: 'Provides passive transplacental transfer of neutralizing antibodies to prevent severe RSV disease and hospitalization in infants.',
        sourceCitation: 'CDC MMWR / Maternal RSV Vaccine ACIP Recommendations / FDA Abrysvo Insert',
      });
    }

    // 9. HEPATITIS B
    if (patient.history.hepbCompleted) {
      list.push({
        id: 'hepb_done',
        name: 'Hepatitis B',
        brandExamples: 'Heplisav-B, Engerix-B, Recombivax HB',
        fdaAgeRange: 'Heplisav-B: ≥18 yrs; Engerix-B: all ages',
        category: 'completed',
        priority: 'informational',
        schedule: 'Full documented series completed',
        rationale: 'Documented completion confers durable protection without routine booster requirements.',
        sourceCitation: 'CDC ACIP Hepatitis B Immunization Guidelines',
      });
    } else if (patient.age >= 19 && patient.age <= 59) {
      list.push({
        id: 'hepb_routine',
        name: 'Hepatitis B Recombinant',
        brandExamples: 'Heplisav-B (2-dose), Engerix-B / Recombivax HB (3-dose)',
        fdaAgeRange: 'Heplisav-B: ≥18 yrs; PreHevbrio: ≥18 yrs; Engerix-B: all ages',
        category: 'routine',
        priority: 'medium',
        schedule: 'Heplisav-B: 2 doses (0, 1 mo) OR 3 doses Engerix-B (0, 1, 6 mos)',
        rationale: 'Universal routine recommendation for all non-immune adults aged 19 through 59 without requiring risk disclosure.',
        sourceCitation: 'CDC MMWR / Universal Hepatitis B Vaccination in Adults Aged 19–59 Years',
      });
    } else if (patient.age >= 60 && (hasSetting('healthcare') || hasCondition('diabetes') || hasCondition('liver_kidney'))) {
      list.push({
        id: 'hepb_risk',
        name: 'Hepatitis B (Risk Indication ≥60)',
        brandExamples: 'Heplisav-B (preferred for rapid seroconversion), Engerix-B',
        fdaAgeRange: 'Heplisav-B: ≥18 yrs; Engerix-B: all ages',
        category: 'risk-based',
        priority: 'high',
        schedule: '2 doses (Heplisav-B at 0, 1 mo) or 3 doses standard antigen',
        rationale: 'Recommended for adults ≥60 with diabetes mellitus, occupational bloodborne exposure, or chronic hepatitis risk.',
        sourceCitation: 'CDC ACIP Risk-Based HepB Immunization in Older Adults',
      });
    }

    // 10. LIVE VACCINES (MMR & VARICELLA)
    // Only contraindicated for PREGNANCY and SEVERE IMMUNOCOMPROMISE (NOT isolated asplenia)
    if (patient.isPregnant || isImmuno) {
      list.push({
        id: 'contra_live',
        name: 'Live Viral Vaccines (MMR, Varicella, LAIV Flu)',
        brandExamples: 'M-M-R II, Priorix, Varivax, FluMist',
        fdaAgeRange: 'MMR/Priorix: ≥12 mos; Varivax: ≥12 mos; FluMist: 2 through 49 yrs',
        category: 'contraindicated',
        priority: 'critical',
        schedule: 'ABSOLUTELY CONTRAINDICATED (DO NOT ADMINISTER)',
        rationale: 'Live attenuated viral replication carries severe risk of congenital rubella syndrome, fetal viremia, or unchecked disseminated infection in severely immunocompromised hosts.',
        contraindications: patient.isPregnant ? 'Active Pregnancy' : 'Severe Immunocompromise / T-cell deficiency',
        sourceCitation: 'CDC General Best Practice Guidelines for Immunization: Contraindications and Precautions',
      });
    } else if (patient.age >= 12 && patient.age < 50) {
      list.push({
        id: 'mmr_catchup',
        name: 'MMR & Varicella (Catch-up Series)',
        brandExamples: 'M-M-R II or Priorix, Varivax',
        fdaAgeRange: '≥12 months through adults',
        category: 'routine',
        priority: 'medium',
        schedule: '1 to 2 doses if no laboratory presumptive immunity or documented childhood series',
        rationale: 'Indicated for adults born in 1957 or later lacking documented proof of vaccination or serologic titer immunity. Safe in asplenia and chronic metabolic disease.',
        sourceCitation: 'CDC ACIP Adult Catch-up Guidelines for Measles, Mumps, Rubella, and Varicella',
      });
    }

    return list;
  }, [patient]);

  const filteredRecs = useMemo(() => {
    return recommendations.filter(rec => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        rec.name.toLowerCase().includes(q) ||
        rec.brandExamples.toLowerCase().includes(q) ||
        rec.fdaAgeRange.toLowerCase().includes(q) ||
        rec.rationale.toLowerCase().includes(q);
      
      if (!matchesSearch) return false;
      if (activeTab === 'indicated') return rec.category === 'routine' || rec.category === 'risk-based';
      if (activeTab === 'scdm') return rec.category === 'shared-decision';
      if (activeTab === 'contraindicated') return rec.category === 'contraindicated';
      return true;
    });
  }, [recommendations, searchQuery, activeTab]);

  const clinicalNoteText = useMemo(() => {
    const indicated = recommendations.filter(r => r.category === 'routine' || r.category === 'risk-based');
    const scdm = recommendations.filter(r => r.category === 'shared-decision');
    const contra = recommendations.filter(r => r.category === 'contraindicated');

    return `CLINICAL IMMUNIZATION ASSESSMENT & ADVISORY NOTE
=====================================================
PATIENT CLINICAL SUMMARY:
- Age: ${patient.age} years
- Pregnancy Status: ${patient.isPregnant ? 'Yes (Maternal Protocol Active)' : 'No'}
- Risk Conditions: ${patient.conditions.length > 0 ? patient.conditions.join(', ') : 'None documented'}
- Occupational/Living Setting: ${patient.settings.length > 0 ? patient.settings.join(', ') : 'Standard'}

PRIOR DOCUMENTED DOSES:
- Flu (Current Season): ${patient.history.fluThisSeason ? 'Yes' : 'No'}
- Recent COVID-19 Formula: ${patient.history.covidRecent ? 'Yes' : 'No'}
- Tdap within 10 years: ${patient.history.tdapWithin10Yrs ? 'Yes' : 'No'}
- Shingrix 2-Dose Series: ${patient.history.shingrixCompleted ? 'Completed' : 'Incomplete/None'}
- Prior Pneumococcal: ${patient.history.priorPneumococcal.toUpperCase()}
- Prior Hib: ${patient.history.hibReceived ? 'Documented' : 'None/Unknown'}
- Prior MenACWY: ${patient.history.menAcwyCompleted ? 'Documented' : 'None/Unknown'}
- Prior MenB: ${patient.history.menBCompleted ? 'Documented' : 'None/Unknown'}

RECOMMENDED ROUTINE / RISK-BASED IMMUNIZATIONS:
${indicated.length > 0 ? indicated.map(r => `• ${r.name} (${r.brandExamples})\n  - FDA Indication:${r.fdaAgeRange}\n  - Schedule: ${r.schedule}\n  - Ref:${r.sourceCitation}`).join('\n') : '• None currently due'}

SHARED CLINICAL DECISION-MAKING (SCDM) DISCUSSIONS:
${scdm.length > 0 ? scdm.map(r => `• ${r.name} (${r.brandExamples})\n  - FDA Indication:${r.fdaAgeRange}\n  - Considerations: ${r.rationale}\n  - Ref:${r.sourceCitation}`).join('\n') : '• None'}

CONTRAINDICATIONS / SAFETY FLAGS:
${contra.length > 0 ? contra.map(r => `• CRITICAL: ${r.name}\n  - Reason: ${r.contraindications}\n  - Clinical Rationale:${r.rationale}`).join('\n') : '• No active contraindications flagged'}

Assessed per CDC / ACIP Clinical Guidelines.`;
  }, [patient, recommendations]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(clinicalNoteText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 bg-slate-50 min-h-screen text-slate-800 font-sans print:p-0 print:bg-white">
      {/* Header Bar */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4 print:border-b-2 print:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-2xl print:text-black">
            <HeartPulse className="w-8 h-8" />
            <h1>ACIP Vaccine Clinical Navigator</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 print:text-slate-600">
            Automated clinical decision engine with manufacturer FDA age criteria, asplenia protocols, & ACIP shared decision-making.
          </p>
        </div>
        
        {/* Action Button Group */}
        <div className="flex items-center gap-2 flex-wrap print:hidden">
          <button
            onClick={() => setShowCoAdminModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg shadow-xs transition"
          >
            <Layers className="w-3.5 h-3.5" />
            Co-Admin Rules
          </button>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg shadow-xs transition"
            title="Export SOAP Note to Clipboard"
          >
            <ClipboardCopy className="w-3.5 h-3.5 text-slate-500" />
            {copySuccess ? 'Copied to EHR!' : 'Export Note'}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print Handout
          </button>
          <button
            onClick={resetForm}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-white hover:bg-slate-100 text-rose-600 border border-slate-300 rounded-lg shadow-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset (Age 0)
          </button>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Patient Profile & History Panel */}
        <div className="lg:col-span-5 space-y-4 print:col-span-12">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <User className="w-5 h-5 text-indigo-500" />
                <h2>Patient Profile & Clinical Status</h2>
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Step 1</span>
            </div>

            {/* Age Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Patient Age
                </label>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {patient.age === 0 ? '0 (Infant / Newborn)' : `${patient.age} years old`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAgeChange(patient.age - 1)}
                  className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 font-bold transition shrink-0"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={patient.age}
                  onChange={(e) => handleAgeChange(parseInt(e.target.value) || 0)}
                  className="flex-1 h-10 px-3 text-center text-lg font-bold text-indigo-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => handleAgeChange(patient.age + 1)}
                  className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 font-bold transition shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-1.5 px-1 font-mono">
                <span>0 (Infant)</span>
                <span>19 (Adult)</span>
                <span>50 (PCV/RZV)</span>
                <span>65+ (High-Dose Flu)</span>
              </div>
            </div>

            {/* Pregnancy Switch */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">Currently Pregnant?</div>
                <div className="text-[11px] text-slate-500">Activates maternal Tdap/RSV; contraindicates live MMR/Varicella</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={patient.isPregnant}
                  onChange={(e) => setPatient({ ...patient, isPregnant: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Underlying Clinical Conditions */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Underlying Medical Conditions
              </label>
              <div className="space-y-1.5">
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

            {/* Living / Occupational Settings */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Occupational / Living Exposures
              </label>
              <div className="space-y-1.5">
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

          {/* Collapsible Vaccine History Checklist */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <button
              onClick={() => setShowHistoryPanel(!showHistoryPanel)}
              className="w-full p-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition border-b border-slate-200 text-left"
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Prior Immunization History Checklist
                </span>
              </div>
              {showHistoryPanel ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showHistoryPanel && (
              <div className="p-4 space-y-3 bg-white text-xs">
                <p className="text-slate-500 text-[11px] mb-2">
                  Check off documented previous doses to automatically adjust intervals and suppress redundant booster recommendations.
                </p>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={patient.history.fluThisSeason}
                    onChange={(e) => updateHistory('fluThisSeason', e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Received Seasonal Flu Vaccine for Current Year</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={patient.history.covidRecent}
                    onChange={(e) => updateHistory('covidRecent', e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Received Updated COVID-19 Seasonal Dose</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={patient.history.tdapWithin10Yrs}
                    onChange={(e) => updateHistory('tdapWithin10Yrs', e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Received Tdap / Td within past 10 years</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={patient.history.shingrixCompleted}
                    onChange={(e) => updateHistory('shingrixCompleted', e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Completed 2-Dose Shingrix (RZV) series</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={patient.history.hepbCompleted}
                    onChange={(e) => updateHistory('hepbCompleted', e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Completed Hepatitis B series</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={patient.history.hibReceived}
                    onChange={(e) => updateHistory('hibReceived', e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Documented Prior Hib Vaccine (Adult or Child)</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={patient.history.menAcwyCompleted}
                    onChange={(e) => updateHistory('menAcwyCompleted', e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Completed Initial MenACWY 2-Dose Series</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={patient.history.menBCompleted}
                    onChange={(e) => updateHistory('menBCompleted', e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Completed Initial MenB Series (Bexsero or Trumenba)</span>
                </label>

                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Prior Documented Pneumococcal Dose:
                  </label>
                  <select
                    value={patient.history.priorPneumococcal}
                    onChange={(e) => updateHistory('priorPneumococcal', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="none">None / Unknown</option>
                    <option value="pcv20">PCV20 or PCV21 (Complete)</option>
                    <option value="pcv15">PCV15 (requires follow-up)</option>
                    <option value="ppsv23_only">PPSV23 Only in past</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Recommendations */}
        <div className="lg:col-span-7 space-y-4 print:col-span-12">
          {/* Search and Category Filter Bar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between print:hidden">
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search vaccine, brand, FDA age..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition ${
                  activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({recommendations.length})
              </button>
              <button
                onClick={() => setActiveTab('indicated')}
                className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition ${
                  activeTab === 'indicated' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Indicated ({recommendations.filter(r => r.category === 'routine' || r.category === 'risk-based').length})
              </button>
              <button
                onClick={() => setActiveTab('scdm')}
                className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition ${
                  activeTab === 'scdm' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Shared Decision ({recommendations.filter(r => r.category === 'shared-decision').length})
              </button>
              <button
                onClick={() => setActiveTab('contraindicated')}
                className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition ${
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
                No matching vaccine guidelines found for current patient profile.
              </div>
            ) : (
              filteredRecs.map((rec) => {
                const isContra = rec.category === 'contraindicated';
                const isRoutine = rec.category === 'routine';
                const isShared = rec.category === 'shared-decision';
                const isCompleted = rec.category === 'completed';

                return (
                  <div
                    key={rec.id}
                    className={`bg-white rounded-xl border p-4 transition shadow-xs print:border-slate-300 print:shadow-none ${
                      isContra
                        ? 'border-rose-300 bg-rose-50/40'
                        : isCompleted
                        ? 'border-slate-200 bg-slate-50/70 opacity-80'
                        : isShared
                        ? 'border-purple-200 bg-purple-50/20'
                        : isRoutine
                        ? 'border-emerald-200 hover:border-emerald-300'
                        : 'border-indigo-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isContra
                                ? 'bg-rose-100 text-rose-800'
                                : isCompleted
                                ? 'bg-slate-200 text-slate-700'
                                : isShared
                                ? 'bg-purple-100 text-purple-800'
                                : isRoutine
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {isContra 
                              ? 'Contraindication' 
                              : isCompleted 
                              ? 'Documented / Completed' 
                              : isShared 
                              ? 'Shared Decision (SCDM)' 
                              : isRoutine 
                              ? 'Routine Universal' 
                              : 'Risk / Exposure Indicated'}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">• {rec.brandExamples}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-base mt-1.5">{rec.name}</h3>
                      </div>
                      <div>
                        {isContra ? (
                          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        ) : isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0" />
                        ) : isShared ? (
                          <Scale className="w-5 h-5 text-purple-600 shrink-0" />
                        ) : (
                          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                        )}
                      </div>
                    </div>

                    {/* FDA Approved Age Range Badge */}
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-[11px] text-slate-700 font-mono">
                      <span className="font-bold text-slate-900">FDA Age Approval:</span>
                      {rec.fdaAgeRange}
                    </div>

                    {/* Schedule / Timing */}
                    <div className="mt-2.5 bg-white/80 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed">
                      <span className="font-semibold text-slate-900">Dosing & Administration: </span>
                      {rec.schedule}
                    </div>

                    {/* Clinical Rationale */}
                    <div className="mt-2 text-xs text-slate-600 flex items-start gap-1.5 leading-relaxed">
                      <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{rec.rationale}</span>
                    </div>

                    {/* Contraindication detail if any */}
                    {rec.contraindications && (
                      <div className="mt-2 text-xs font-semibold text-rose-700 flex items-center gap-1.5 bg-rose-100/70 p-2 rounded-md">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Contraindicated by: {rec.contraindications}</span>
                      </div>
                    )}

                    {/* Official Guideline Citation */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex items-center gap-1.5 text-[10px] text-slate-500 italic">
                      <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{rec.sourceCitation}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Co-administration Rules Modal */}
      {showCoAdminModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-lg">
                <Layers className="w-5 h-5" />
                <h3>ACIP Co-administration & Spacing Guidelines</h3>
              </div>
              <button
                onClick={() => setShowCoAdminModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="text-xs space-y-3 text-slate-700 leading-relaxed">
              <p>
                <strong>General Rule for Inactivated Vaccines:</strong> Inactivated vaccines (Flu, COVID-19, Shingrix, Pneumococcal, Hepatitis B, Tdap, MenACWY, MenB, Hib) can be co-administered simultaneously at separate anatomical injection sites.
              </p>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
                <strong>Live Attenuated Spacing Rule (MMR, Varicella, Yellow Fever):</strong> Parenteral live virus vaccines must be administered on the <em>same calendar day</em> OR separated by at least <em>28 days</em>.
              </div>
              <p>
                <strong>Asplenia MenACWY / PCV Spacing:</strong> If Menactra (an older MenACWY-D conjugate) is used, administer PCV first and separate from Menactra by $\ge 4$ weeks to prevent interference. (Not applicable to Menveo or MenQuadfi).
              </p>
              <p>
                <strong>PCV15 & PPSV23 Sequence:</strong> If PCV15 is administered, follow with PPSV23 at least 1 year later (immunocompetent) or $\ge 8$ weeks later (immunocompromised or asplenia). Never administer PCV15 and PPSV23 together at the same visit.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowCoAdminModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Medical Disclaimer */}
      <footer className="mt-12 pt-6 border-t border-slate-200 print:hidden">
        <div className="bg-slate-100 rounded-2xl p-5 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-2">
            <Scale className="w-4 h-4 text-slate-600" />
            <h3>Medical & Regulatory Disclaimer</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>For Educational and Informational Purposes Only:</strong> This application is intended solely as an interactive reference tool based on published CDC and ACIP immunization schedules and manufacturer prescribing guidelines. It does not provide medical advice or personalized medical orders.
          </p>
        </div>
      </footer>
    </div>
  );
}
