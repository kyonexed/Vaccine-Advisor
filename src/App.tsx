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
  BookOpen, 
  Clock,
  FlaskConical
} from 'lucide-react';

interface PriorDoseState {
  fluThisSeason: boolean;
  covidRecent: boolean;
  tdapWithin10Yrs: boolean;
  dtapPedCompleted: boolean;
  shingrixCompleted: boolean;
  priorPneumococcal: 'none' | 'pcv15' | 'pcv20' | 'ppsv23_only';
  hepbCompleted: boolean;
  hepaCompleted: boolean;
  hibReceived: boolean;
  menAcwyCompleted: boolean;
  menBCompleted: boolean;
  ipvCompleted: boolean;
  hpvCompleted: boolean;
  rotavirusCompleted: boolean;
  mmrCompleted: boolean;
  varicellaCompleted: boolean;
  maternalRsvReceived: boolean;
}

interface PatientProfile {
  ageValue: number;
  ageUnit: 'years' | 'months';
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
  category: 'routine' | 'shared-decision' | 'risk-based' | 'contraindicated' | 'completed' | 'deferred';
  schedule: string;
  rationale: string;
  sourceCitation: string;
  contraindications?: string;
  priority: 'high' | 'medium' | 'critical' | 'informational';
}

const ALL_CONDITIONS_LIST = [
  { id: 'diabetes', label: 'Diabetes Mellitus', minAgeYears: 0 },
  { id: 'cardiopulmonary', label: 'Chronic Heart / Lung Disease (COPD, Asthma, CHF)', minAgeYears: 0 },
  { id: 'liver_kidney', label: 'Chronic Liver Disease / ESRD / Dialysis', minAgeYears: 0 },
  { id: 'immunocompromised', label: 'Immunocompromised (HIV, Chemo, Biologics, Transplant)', minAgeYears: 0 },
  { id: 'asplenia', label: 'Asplenia / Complement Deficiency / Sickle Cell', minAgeYears: 0 },
  { id: 'smoking', label: 'Current Cigarette Smoker', minAgeYears: 12 },
];

const ALL_SETTINGS_LIST = [
  { id: 'healthcare', label: 'Healthcare Worker', minAgeYears: 16 },
  { id: 'college_dorm', label: 'First-year College Student in Dorm / Military', minAgeYears: 17 },
  { id: 'travel', label: 'International Travel to Endemic Regions', minAgeYears: 0 },
];

const PRESET_YEARS = [
  { value: 0, label: '0 (Newborn / Infant)' },
  { value: 1, label: '1 year old' },
  { value: 2, label: '2 years old' },
  { value: 4, label: '4 years old (Kindergarten entry)' },
  { value: 9, label: '9 years old (HPV earliest eligible)' },
  { value: 11, label: '11 years old (Adolescent Tdap / MenACWY / HPV)' },
  { value: 16, label: '16 years old (MenACWY booster / MenB eligible)' },
  { value: 18, label: '18 years old (Adult transition)' },
  { value: 19, label: '19 years old (Adult schedule entry)' },
  { value: 27, label: '27 years old (HPV shared decision)' },
  { value: 50, label: '50 years old (PCV / Shingrix threshold)' },
  { value: 65, label: '65 years old (Senior High-Dose Flu / COVID booster)' },
  { value: 75, label: '75 years old (Universal RSV)' },
];

const PRESET_MONTHS = [
  { value: 0, label: '0 months (Birth / Newborn)' },
  { value: 1, label: '1 month' },
  { value: 2, label: '2 months (Pediatric Series Dose 1)' },
  { value: 4, label: '4 months (Pediatric Series Dose 2)' },
  { value: 6, label: '6 months (Pediatric Dose 3 & Flu / COVID Start)' },
  { value: 12, label: '12 months (MMR / Varicella / HepA Dose 1)' },
  { value: 15, label: '15 months (DTaP Dose 4)' },
  { value: 18, label: '18 months (HepA Dose 2 completion)' },
  { value: 23, label: '23 months (Toddler milestone)' },
];

export default function App() {
  const [patient, setPatient] = useState<PatientProfile>({
    ageValue: 6,
    ageUnit: 'months',
    isPregnant: false,
    conditions: [],
    settings: [],
    history: {
      fluThisSeason: false,
      covidRecent: false,
      tdapWithin10Yrs: false,
      dtapPedCompleted: false,
      shingrixCompleted: false,
      priorPneumococcal: 'none',
      hepbCompleted: false,
      hepaCompleted: false,
      hibReceived: false,
      menAcwyCompleted: false,
      menBCompleted: false,
      ipvCompleted: false,
      hpvCompleted: false,
      rotavirusCompleted: false,
      mmrCompleted: false,
      varicellaCompleted: false,
      maternalRsvReceived: false,
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'indicated' | 'scdm' | 'contraindicated'>('all');
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showCoAdminModal, setShowCoAdminModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const ageInYears = useMemo(() => {
    return patient.ageUnit === 'months' 
      ? patient.ageValue / 12 
      : patient.ageValue;
  }, [patient.ageValue, patient.ageUnit]);

  const ageInMonths = useMemo(() => {
    return patient.ageUnit === 'months'
      ? patient.ageValue
      : Math.round(patient.ageValue * 12);
  }, [patient.ageValue, patient.ageUnit]);

  const isImmuno = useMemo(() => {
    return patient.conditions.includes('immunocompromised');
  }, [patient.conditions]);

  const isAsplenia = useMemo(() => {
    return patient.conditions.includes('asplenia');
  }, [patient.conditions]);

  const visibleConditions = useMemo(() => {
    return ALL_CONDITIONS_LIST.filter(cond => ageInYears >= cond.minAgeYears);
  }, [ageInYears]);

  const visibleSettings = useMemo(() => {
    return ALL_SETTINGS_LIST.filter(setting => ageInYears >= setting.minAgeYears);
  }, [ageInYears]);

  const cleanProfileForAge = (newAgeYears: number, currentProfile: PatientProfile): PatientProfile => {
    const validCondIds = ALL_CONDITIONS_LIST.filter(c => newAgeYears >= c.minAgeYears).map(c => c.id);
    const validSettingIds = ALL_SETTINGS_LIST.filter(s => newAgeYears >= s.minAgeYears).map(s => s.id);

    return {
      ...currentProfile,
      isPregnant: newAgeYears >= 12 ? currentProfile.isPregnant : false,
      conditions: currentProfile.conditions.filter(id => validCondIds.includes(id)),
      settings: currentProfile.settings.filter(id => validSettingIds.includes(id)),
    };
  };

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
      ageValue: 0,
      ageUnit: 'months',
      isPregnant: false,
      conditions: [],
      settings: [],
      history: {
        fluThisSeason: false,
        covidRecent: false,
        tdapWithin10Yrs: false,
        dtapPedCompleted: false,
        shingrixCompleted: false,
        priorPneumococcal: 'none',
        hepbCompleted: false,
        hepaCompleted: false,
        hibReceived: false,
        menAcwyCompleted: false,
        menBCompleted: false,
        ipvCompleted: false,
        hpvCompleted: false,
        rotavirusCompleted: false,
        mmrCompleted: false,
        varicellaCompleted: false,
        maternalRsvReceived: false,
      }
    });
  };

  const handleAgeChange = (value: number) => {
    const max = 120;
    const valid = isNaN(value) ? 0 : Math.max(0, Math.min(max, value));
    const calculatedYears = patient.ageUnit === 'months' ? valid / 12 : valid;
    
    setPatient(prev => cleanProfileForAge(calculatedYears, { ...prev, ageValue: valid }));
  };

  const handleUnitToggle = (unit: 'years' | 'months') => {
    if (unit === patient.ageUnit) return;
    if (unit === 'months') {
      const converted = Math.min(120, Math.round(patient.ageValue * 12));
      const calculatedYears = converted / 12;
      setPatient(prev => cleanProfileForAge(calculatedYears, { ...prev, ageUnit: 'months', ageValue: converted }));
    } else {
      const converted = Math.min(120, Math.floor(patient.ageValue / 12));
      setPatient(prev => cleanProfileForAge(converted, { ...prev, ageUnit: 'years', ageValue: converted }));
    }
  };

  const recommendations: VaccineRecommendation[] = useMemo(() => {
    const list: VaccineRecommendation[] = [];
    const hasCondition = (id: string) => patient.conditions.includes(id);
    const hasSetting = (id: string) => patient.settings.includes(id);
    const hasChronic = hasCondition('diabetes') || hasCondition('cardiopulmonary') || hasCondition('liver_kidney') || hasCondition('smoking');

    // 1. INFLUENZA
    if (patient.history.fluThisSeason) {
      list.push({
        id: 'flu_done',
        name: 'Influenza (Seasonal Trivalent)',
        brandExamples: 'Fluzone, Fluarix, Flucelvax, Flublok, Fluzone High-Dose',
        fdaAgeRange: 'IIV3/ccIIV3: ≥6 mos; Flublok: ≥18 yrs; Fluzone HD/Fluad: ≥65 yrs',
        category: 'completed',
        priority: 'informational',
        schedule: 'Documented for current season',
        rationale: 'Patient has already received seasonal influenza vaccination for the current cycle.',
        sourceCitation: 'CDC Child and Adolescent Immunization Schedule / ACIP Seasonal Influenza Recommendations',
      });
    } else if (ageInMonths < 6) {
      list.push({
        id: 'flu_too_young',
        name: 'Influenza (Seasonal Flu)',
        brandExamples: 'Standard Trivalent IIV3 / ccIIV3',
        fdaAgeRange: 'Approved for age ≥6 months only',
        category: 'deferred',
        priority: 'informational',
        schedule: 'INDICATED STARTING AT 6 MONTHS OF AGE',
        rationale: 'Infants <6 months are too young to receive influenza vaccines. Protection relies on maternal immunization during pregnancy and caregiver cocooning.',
        contraindications: 'Age < 6 months (FDA boundary)',
        sourceCitation: 'CDC ACIP Seasonal Influenza Schedule / FDA Prescribing Information',
      });
    } else {
      list.push({
        id: 'flu',
        name: 'Influenza (Seasonal Flu - Trivalent IIV3 / ccIIV3 / RIV3)',
        brandExamples: ageInYears >= 65 ? 'Fluzone High-Dose, Fluad, or Flublok (Preferred)' : 'Standard IIV3 or ccIIV3 (Inactivated only in pregnancy)',
        fdaAgeRange: ageInYears >= 65 ? 'High-dose/Adjuvanted: ≥65 years' : 'Standard IIV3: ≥6 months; LAIV3: 2 through 49 years',
        category: 'routine',
        priority: 'high',
        schedule: ageInYears < 9 
          ? '2 doses spaced ≥4 weeks apart if first-time flu vaccine recipient, otherwise 1 annual seasonal dose' 
          : '1 dose annually every autumn/winter season',
        rationale: ageInYears >= 65 
          ? 'Age ≥65: Higher-dose or adjuvanted influenza vaccine is preferentially recommended for enhanced immunogenicity.'
          : patient.isPregnant
          ? 'Recommended in any trimester of pregnancy (inactivated IIV3 or recombinant RIV3 only) to prevent maternal-fetal morbidity.'
          : 'Universal annual recommendation for all individuals aged ≥6 months without contraindications.',
        sourceCitation: 'CDC Child & Adolescent Immunization Schedule (Table 1: By Age) / MMWR Guidelines',
      });
    }

    // 2. COVID-19
    if (patient.history.covidRecent) {
      list.push({
        id: 'covid_done',
        name: 'COVID-19 (Updated Formulation)',
        brandExamples: 'Spikevax, mNEXSPIKE, Comirnaty, or Nuvaxovid',
        fdaAgeRange: 'Spikevax: ≥6 mos; Comirnaty: ≥5 yrs; mNEXSPIKE: ≥12 yrs; Nuvaxovid: ≥12 yrs',
        category: 'completed',
        priority: 'informational',
        schedule: 'Up to date for current seasonal cycle',
        rationale: 'Patient reports recent receipt of the updated seasonal formulation.',
        sourceCitation: 'CDC Overview of COVID-19 Vaccines and Vaccination',
      });
    } else if (ageInMonths < 6) {
      list.push({
        id: 'covid_too_young',
        name: 'COVID-19 Formulation',
        brandExamples: 'Spikevax (Moderna)',
        fdaAgeRange: 'Approved starting at ≥6 months of age',
        category: 'deferred',
        priority: 'informational',
        schedule: 'ELIGIBLE STARTING AT 6 MONTHS OF AGE',
        rationale: 'COVID-19 vaccines are authorized and recommended starting at 6 months of age.',
        contraindications: 'Age < 6 months',
        sourceCitation: 'CDC Child & Adolescent Immunization Schedule',
      });
    } else if (ageInYears < 5) {
      list.push({
        id: 'covid_infant_toddler',
        name: 'COVID-19 (Pediatric 6 mos–4 yrs: Spikevax)',
        brandExamples: 'Spikevax (Moderna mRNA) - Sole approved vaccine for 6 mos–4 yrs',
        fdaAgeRange: 'Spikevax: 6 months through 11 years (Pfizer Comirnaty no longer authorized <5 yrs)',
        category: 'routine',
        priority: 'high',
        schedule: 'Unvaccinated: 2 doses Spikevax (0, 4-8 weeks). Incomplete series: complete with 1 dose updated Spikevax 4-8 weeks after prior dose.',
        rationale: 'CDC Guidance: Spikevax (Moderna) is the only FDA-approved COVID-19 vaccine available for children aged 6 months through 4 years. Unvaccinated children receive a 2-dose primary series.',
        sourceCitation: 'CDC Interim Clinical Considerations / Overview of COVID-19 Vaccines (Ages 6 mos–4 yrs)',
      });
    } else if (ageInYears >= 5 && ageInYears < 12) {
      list.push({
        id: 'covid_pediatric_5_11',
        name: 'COVID-19 (Children 5–11 yrs)',
        brandExamples: 'Spikevax (Moderna) or Comirnaty (Pfizer-BioNTech)',
        fdaAgeRange: 'Spikevax: ≥6 mos; Comirnaty: ≥5 yrs',
        category: 'routine',
        priority: 'medium',
        schedule: 'Unvaccinated: 1 dose updated Spikevax or Comirnaty. Previously vaccinated: 1 dose updated formula at least 8 weeks after prior dose.',
        rationale: 'CDC Guidance: 1 single updated dose for unvaccinated individuals aged 5–11 years, or 1 dose ≥8 weeks after prior vaccination.',
        sourceCitation: 'CDC Interim Clinical Considerations / Ages 5–11 years Routine Schedule',
      });
    } else if (ageInYears >= 12 && ageInYears <= 18) {
      list.push({
        id: 'covid_adol_12_18',
        name: 'COVID-19 (Adolescents 12–18 yrs)',
        brandExamples: 'Spikevax, mNEXSPIKE (Moderna), Comirnaty (Pfizer), or Nuvaxovid (Novavax)',
        fdaAgeRange: 'Spikevax: ≥6 mos; Comirnaty: ≥5 yrs; mNEXSPIKE: ≥12 yrs; Nuvaxovid: ≥12 yrs',
        category: 'routine',
        priority: 'medium',
        schedule: 'Unvaccinated: 1 dose updated mRNA (Spikevax/mNEXSPIKE/Comirnaty) OR 2 doses Nuvaxovid (0, 3-8 wks). Previously vaccinated: 1 dose updated formula ≥8 weeks after prior dose.',
        rationale: 'CDC Guidance: Adolescents aged 12–18 may receive either an mRNA single dose or Nuvaxovid 2-dose series if unvaccinated, or 1 updated booster dose ≥8 weeks after prior doses.',
        sourceCitation: 'CDC Interim Clinical Considerations / Overview of COVID-19 Vaccines (Ages 12–18 yrs)',
      });
    } else if (ageInYears >= 65) {
      list.push({
        id: 'covid_senior',
        name: 'COVID-19 (Updated Formulation)',
        brandExamples: 'Spikevax, mNEXSPIKE, Comirnaty, or Nuvaxovid',
        fdaAgeRange: 'Spikevax: ≥6 mos; Comirnaty: ≥5 yrs; mNEXSPIKE: ≥12 yrs; Nuvaxovid: ≥12 yrs',
        category: 'shared-decision',
        priority: 'high',
        schedule: '1 dose updated seasonal formulation; optional additional booster dose 6 months later based on SCDM',
        rationale: 'ACIP Guideline: Recommended based on individual-based / shared clinical decision-making (SCDM). Risk-benefit is highly favorable in older adults due to elevated hospitalization risk.',
        sourceCitation: 'CDC ACIP Recommendations for Individual Decision-Making for COVID-19 Vaccination',
      });
    } else if (isImmuno || isAsplenia || hasChronic || patient.isPregnant) {
      list.push({
        id: 'covid_risk',
        name: 'COVID-19 (Updated Formulation)',
        brandExamples: 'Spikevax, mNEXSPIKE, Comirnaty, or Nuvaxovid',
        fdaAgeRange: 'Spikevax: ≥6 mos; Comirnaty: ≥5 yrs; mNEXSPIKE: ≥12 yrs; Nuvaxovid: ≥12 yrs',
        category: 'shared-decision',
        priority: 'high',
        schedule: isImmuno ? '1 dose updated formulation + eligible for additional booster ≥2 months later' : '1 dose updated seasonal formulation',
        rationale: 'ACIP Guideline: Shared Clinical Decision-Making (SCDM) for individuals <65 years. The risk-benefit ratio is most favorable for individuals with chronic conditions, immunocompromise, asplenia, or pregnancy.',
        sourceCitation: 'CDC MMWR / ACIP Update: Guidance for COVID-19 Immunization via Individual Decision-Making',
      });
    } else {
      list.push({
        id: 'covid_healthy',
        name: 'COVID-19 (Updated Formulation)',
        brandExamples: 'Spikevax, mNEXSPIKE, Comirnaty, or Nuvaxovid',
        fdaAgeRange: 'Spikevax: ≥6 mos; Comirnaty: ≥5 yrs; mNEXSPIKE: ≥12 yrs; Nuvaxovid: ≥12 yrs',
        category: 'shared-decision',
        priority: 'medium',
        schedule: '1 dose updated mRNA (or 2 doses Nuvaxovid at 0, 3-8 wks if unvaccinated) at least 8 weeks after prior doses',
        rationale: 'ACIP Guideline: Administered under shared clinical decision-making (SCDM). Clinical discussion considers baseline personal risk and community transmission.',
        sourceCitation: 'HHS / ACIP Adult Immunization Schedules / Shared Clinical Decision-Making Guidance',
      });
    }

    // 3. INFANT PASSIVE RSV (Nirsevimab)
    if (ageInMonths <= 8 && !patient.history.maternalRsvReceived) {
      list.push({
        id: 'ped_nirsevimab',
        name: 'RSV Monoclonal Antibody (Nirsevimab)',
        brandExamples: 'Beyfortus (Nirsevimab-alip)',
        fdaAgeRange: 'Neonates and infants born during or entering their first RSV season (<8 months)',
        category: 'routine',
        priority: 'high',
        schedule: '1 dose IM (50 mg if <5 kg; 100 mg if ≥5 kg) prior to or during RSV season (Oct–Mar)',
        rationale: 'CDC Child & Adolescent Schedule: Recommended for all infants aged <8 months born during or entering their first RSV season if mother did not receive maternal RSV vaccine (Abrysvo) ≥14 days prior to delivery.',
        sourceCitation: 'CDC Child and Adolescent Immunization Schedule (RSV-mAb [Nirsevimab] Notes)',
      });
    } else if (ageInMonths >= 8 && ageInMonths <= 19 && (hasChronic || isImmuno)) {
      list.push({
        id: 'ped_nirsevimab_highrisk',
        name: 'RSV Monoclonal Antibody (Nirsevimab - High Risk Season 2)',
        brandExamples: 'Beyfortus (200 mg: two 100 mg injections)',
        fdaAgeRange: 'Children 8 through 19 months at increased risk entering second RSV season',
        category: 'risk-based',
        priority: 'high',
        schedule: '1 dose IM (200 mg given as two 100 mg injections) entering second RSV season',
        rationale: 'CDC Schedule: Indicated for children 8 through 19 months with chronic lung disease of prematurity, cystic fibrosis, severe immunocompromise, or severe congenital heart disease.',
        sourceCitation: 'CDC Child & Adolescent Schedule / RSV Prophylaxis for High-Risk Toddlers',
      });
    }

    // 4. PEDIATRIC SPECIFIC (Months & Child Schedule)
    if (ageInYears < 19) {
      // Rotavirus
      if (patient.history.rotavirusCompleted) {
        list.push({
          id: 'ped_rotavirus_done',
          name: 'Rotavirus (RV1 / RV5)',
          brandExamples: 'Rotarix, RotaTeq',
          fdaAgeRange: 'Infants up to 8 months 0 days',
          category: 'completed',
          priority: 'informational',
          schedule: 'Completed 2- or 3-dose oral series',
          rationale: 'Documented completion of rotavirus infant oral immunizations.',
          sourceCitation: 'CDC Child and Adolescent Immunization Schedule',
        });
      } else if (ageInMonths <= 8) {
        list.push({
          id: 'ped_rotavirus',
          name: 'Rotavirus (RV1 / RV5)',
          brandExamples: 'Rotarix (RV1 - 2 doses: 2, 4 mos), RotaTeq (RV5 - 3 doses: 2, 4, 6 mos)',
          fdaAgeRange: 'Minimum age 6 weeks; Maximum age for final dose is 8 months 0 days',
          category: 'routine',
          priority: 'high',
          schedule: ageInMonths < 2 
            ? 'First dose administered starting at 6 weeks through 14 weeks 6 days' 
            : '2-dose (2, 4 mos) or 3-dose (2, 4, 6 mos) oral series before 8 months 0 days',
          rationale: 'Protects infants against severe dehydrating rotavirus gastroenteritis.',
          sourceCitation: 'CDC Recommended Child and Adolescent Immunization Schedule / MMWR Rotavirus ACIP Guidelines',
        });
      }

      // DTaP (<7 years)
      if (ageInYears < 7) {
        if (patient.history.dtapPedCompleted) {
          list.push({
            id: 'ped_dtap_done',
            name: 'DTaP (Pediatric Series)',
            brandExamples: 'Infanrix, Daptacel',
            fdaAgeRange: '6 weeks through 6 years',
            category: 'completed',
            priority: 'informational',
            schedule: 'Full 5-dose primary series documented',
            rationale: 'Patient is up to date on pediatric DTaP series.',
            sourceCitation: 'CDC Child and Adolescent Immunization Schedule',
          });
        } else {
          list.push({
            id: 'ped_dtap',
            name: 'DTaP (Diphtheria, Tetanus, acellular Pertussis)',
            brandExamples: 'Infanrix, Daptacel',
            fdaAgeRange: '6 weeks through 6 years (up to 7th birthday)',
            category: 'routine',
            priority: 'high',
            schedule: ageInMonths < 2 
              ? 'First dose at 2 months of age'
              : ageInMonths < 15 
              ? 'Primary series at 2, 4, and 6 months'
              : 'Booster doses at 15-18 months and 4-6 years of age',
            rationale: 'Standard pediatric active immunization against tetanus, diphtheria, and pertussis before age 7.',
            sourceCitation: 'CDC ACIP DTaP Schedule / FDA Package Insert (Infanrix)',
          });
        }
      }

      // IPV
      if (patient.history.ipvCompleted) {
        list.push({
          id: 'ipv_done',
          name: 'Inactivated Poliovirus (IPV)',
          brandExamples: 'IPOL',
          fdaAgeRange: 'Approved starting at 6 weeks of age',
          category: 'completed',
          priority: 'informational',
          schedule: 'Series Completed (4 doses documented)',
          rationale: 'Documented 4-dose primary pediatric series confers lifelong protection against poliovirus paralysis.',
          sourceCitation: 'CDC ACIP Child and Adolescent Immunization Schedule',
        });
      } else {
        list.push({
          id: 'ped_ipv',
          name: 'Inactivated Poliovirus (IPV)',
          brandExamples: 'IPOL',
          fdaAgeRange: 'Approved starting at 6 weeks of age',
          category: 'routine',
          priority: 'high',
          schedule: ageInMonths < 2 
            ? 'Dose 1 at 2 months of age'
            : ageInMonths < 18 
            ? '4-dose series: doses at 2, 4, 6-18 months, and 4-6 years (final dose on/after 4th birthday)'
            : 'Complete 4-dose catch-up series prior to adulthood',
          rationale: 'Universal routine pediatric schedule to prevent paralytic poliomyelitis.',
          sourceCitation: 'CDC ACIP Inactivated Poliovirus Vaccine Recommendations',
        });
      }

      // Hepatitis A
      if (patient.history.hepaCompleted) {
        list.push({
          id: 'hepa_done',
          name: 'Hepatitis A (HepA)',
          brandExamples: 'Havrix, Vaqta',
          fdaAgeRange: 'Approved starting at 12 months of age',
          category: 'completed',
          priority: 'informational',
          schedule: 'Series Completed (2 doses documented)',
          rationale: '2-dose series provides long-lasting immunity against hepatitis A infection.',
          sourceCitation: 'CDC Child and Adolescent Immunization Schedule',
        });
      } else if (ageInMonths >= 12) {
        list.push({
          id: 'ped_hepa',
          name: 'Hepatitis A (HepA)',
          brandExamples: 'Havrix, Vaqta',
          fdaAgeRange: 'Approved starting at 12 months of age',
          category: 'routine',
          priority: 'high',
          schedule: '2-dose series: Dose 1 at 12-23 months; Dose 2 administered 6 to 18 months later',
          rationale: 'CDC Schedule: Routinely recommended for all children aged 12 through 23 months to prevent acute hepatitis A liver infection.',
          sourceCitation: 'CDC Recommended Child and Adolescent Immunization Schedule (Table 1)',
        });
      }

      // HPV
      if (patient.history.hpvCompleted) {
        list.push({
          id: 'hpv_done',
          name: 'Human Papillomavirus (HPV)',
          brandExamples: 'Gardasil 9',
          fdaAgeRange: 'Approved for females and males aged 9 through 45 years',
          category: 'completed',
          priority: 'informational',
          schedule: 'Series Completed (2 or 3 doses documented)',
          rationale: 'Completed series confers lifelong protection against high-risk oncogenic HPV types (16, 18, 31, 33, 45, 52, 58) and condyloma acuminata.',
          sourceCitation: 'CDC Child and Adolescent Immunization Schedule',
        });
      } else if (ageInYears >= 9 && ageInYears <= 18) {
        list.push({
          id: 'ped_hpv',
          name: 'Human Papillomavirus (9-valent HPV)',
          brandExamples: 'Gardasil 9',
          fdaAgeRange: 'Approved for females and males aged 9 through 45 years',
          category: 'routine',
          priority: 'high',
          schedule: ageInYears < 15 
            ? '2-dose series (0, 6-12 months) if initiated prior to 15th birthday' 
            : '3-dose series (0, 1-2, 6 months) if initiated on or after 15th birthday (or for immunocompromised)',
          rationale: 'CDC Schedule: Routinely recommended starting at 11–12 years (can start at age 9). Highly protective against cervical, anal, penile, and oropharyngeal cancers.',
          sourceCitation: 'CDC Recommended Child and Adolescent Immunization Schedule (Table 1: HPV Notes)',
        });
      }

      // Adolescent Tdap & MenACWY
      if (ageInYears >= 11 && ageInYears <= 12) {
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

      // MenACWY 16-Year Booster
      if (ageInYears >= 16 && ageInYears <= 18 && !isAsplenia) {
        list.push({
          id: 'ped_menacwy_16',
          name: 'Meningococcal ACWY (16-Year Booster Dose)',
          brandExamples: 'Menveo or MenQuadfi',
          fdaAgeRange: 'Menveo: ≥2 mos; MenQuadfi: ≥2 yrs',
          category: 'routine',
          priority: 'high',
          schedule: '1 booster dose administered at age 16 years (if first dose given at 11-12 years)',
          rationale: 'CDC Schedule: Routine booster dose at age 16 provides critical protective bactericidal titers throughout high-risk late adolescent and college dorm years.',
          sourceCitation: 'CDC Child and Adolescent Immunization Schedule (Table 1)',
        });
      }
    }

    // 5. TDAP / TD (Adults ≥ 19 or Pregnant)
    if (ageInYears >= 19 || patient.isPregnant) {
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

    // 6. SHINGLES (RZV)
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
    } else if (patient.isPregnant && isImmuno) {
      list.push({
        id: 'shingrix_preg_caution',
        name: 'Zoster Vaccine Recombinant (Shingrix - Defer in Pregnancy)',
        brandExamples: 'Shingrix (RZV)',
        fdaAgeRange: 'FDA Approved: Adults ≥18 years who are immunocompromised',
        category: 'risk-based',
        priority: 'medium',
        schedule: 'Defer 2-dose series until postpartum (unless acute clinical risk overrides lack of pregnancy safety data)',
        rationale: 'Although RZV is a non-live recombinant subunit vaccine, ACIP recommends deferring administration until postpartum due to limited clinical trial data during pregnancy.',
        sourceCitation: 'CDC ACIP Guidelines for Vaccination of Immunocompromised Adults & Pregnant Women',
      });
    } else if (ageInYears >= 50 || (ageInYears >= 19 && isImmuno)) {
      list.push({
        id: 'shingrix',
        name: 'Zoster Vaccine Recombinant (Shingrix)',
        brandExamples: 'Shingrix (RZV - Non-live)',
        fdaAgeRange: 'FDA Approved: Adults ≥50 years, and Adults ≥18 years who are immunocompromised',
        category: 'routine',
        priority: 'high',
        schedule: '2-dose intramuscular series (0, 2-6 months; 0, 1-2 months if immunocompromised)',
        rationale: ageInYears >= 50
          ? 'Routinely recommended for all immunocompetent adults ≥50 years to prevent Herpes Zoster and postherpetic neuralgia.'
          : 'Indicated for adults 19-49 who are or will be immunodeficient or immunosuppressed due to disease or therapy.',
        sourceCitation: 'CDC ACIP MMWR Recommendations for Use of Recombinant Zoster Vaccine',
      });
    }

    // 7. PNEUMOCOCCAL
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
        rationale: 'For patients who previously received PPSV23 only, a conjugate vaccine (PCV20, PCV21, or PCV15) is recommended ≥1 year later to establish conjugate T-cell dependent immune memory.',
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
    } else if (ageInYears < 2) {
      list.push({
        id: 'ped_pcv20',
        name: 'Pneumococcal Conjugate (Pediatric PCV20/PCV15)',
        brandExamples: 'Prevnar 20 (PCV20) or Vaxneuvance (PCV15)',
        fdaAgeRange: 'Approved starting at 6 weeks of age',
        category: 'routine',
        priority: 'high',
        schedule: '4-dose series given at 2, 4, 6, and 12-15 months of age',
        rationale: 'Routinely prevents invasive pneumococcal disease (meningitis, bacteremia) and otitis media in infants.',
        sourceCitation: 'CDC Child and Adolescent Immunization Schedule (Table 1: PCV15, PCV20)',
      });
    } else if (ageInYears >= 50) {
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
        name: 'Pneumococcal Conjugate (High Risk 2-49)',
        brandExamples: 'Prevnar 20 (PCV20) or Capvaxive (PCV21)',
        fdaAgeRange: 'Prevnar 20: ≥6 wks; Capvaxive: ≥18 yrs',
        category: 'risk-based',
        priority: 'high',
        schedule: (isImmuno || isAsplenia)
          ? '1 dose PCV20 or PCV21 alone (or PCV15 followed by PPSV23 ≥8 weeks later)'
          : '1 dose PCV20 or PCV21 alone (or PCV15 followed by PPSV23 ≥1 year later)',
        rationale: 'Indicated for individuals with chronic medical conditions, asplenia, or immunocompromising states due to heightened risk of invasive pneumococcal disease (IPD).',
        sourceCitation: 'CDC MMWR / ACIP Pneumococcal Conjugate Vaccines in Adults with Underlying Conditions',
      });
    }

    // 8. ASPLENIA ENCAPSULATED ORGANISM COVERAGE
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

    if (isAsplenia && ageInYears >= 10) {
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
          rationale: 'CRITICAL FOR ASPLENIA: High risk for invasive Serogroup B meningococcal disease. Brands are NOT interchangeable.',
          sourceCitation: 'CDC MMWR / Use of Serogroup B Meningococcal Vaccines in Persons with High-Risk Conditions',
        });
      }
    }

    if (isAsplenia || ageInYears < 5) {
      if (patient.history.hibReceived && isAsplenia) {
        list.push({
          id: 'hib_done',
          name: 'Haemophilus influenzae type b (Hib)',
          brandExamples: 'ActHIB, Hiberix, PedvaxHIB',
          fdaAgeRange: 'ActHIB/Hiberix/PedvaxHIB: Approved in infants & indicated in asplenic adults',
          category: 'completed',
          priority: 'informational',
          schedule: 'Documented series received',
          rationale: 'Documented protection against Hib encapsulated bacteremia.',
          sourceCitation: 'CDC ACIP Hib Vaccination Guidelines',
        });
      } else if (ageInMonths < 15) {
        list.push({
          id: 'hib_infant',
          name: 'Haemophilus influenzae type b (Hib Series)',
          brandExamples: 'ActHIB, Hiberix, PedvaxHIB',
          fdaAgeRange: 'Approved starting at 6 weeks of age',
          category: 'routine',
          priority: 'high',
          schedule: 'Primary series at 2, 4, (6) months, plus booster dose at 12-15 months',
          rationale: 'Universal routine infant recommendation preventing epiglottitis and bacteremic meningitis.',
          sourceCitation: 'CDC Child and Adolescent Immunization Schedule (Table 1: Hib)',
        });
      } else if (isAsplenia) {
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

    // 9. ADULT & MATERNAL RSV
    if (ageInYears >= 75) {
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
    } else if (ageInYears >= 50 && (hasChronic || isImmuno)) {
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

    // 10. HEPATITIS B
    if (patient.history.hepbCompleted) {
      list.push({
        id: 'hepb_done',
        name: 'Hepatitis B',
        brandExamples: 'Engerix-B, Recombivax HB, Heplisav-B',
        fdaAgeRange: 'Engerix-B: all ages; Heplisav-B: ≥18 yrs',
        category: 'completed',
        priority: 'informational',
        schedule: 'Full documented series completed',
        rationale: 'Documented completion confers durable protection without routine booster requirements.',
        sourceCitation: 'CDC ACIP Hepatitis B Immunization Guidelines',
      });
    } else if (patient.isPregnant) {
      list.push({
        id: 'hepb_preg',
        name: 'Hepatitis B (Pregnancy Formulation)',
        brandExamples: 'Engerix-B or Recombivax HB (Standard Alum Adjuvanted ONLY)',
        fdaAgeRange: 'Engerix-B / Recombivax HB: Approved across all ages including pregnancy',
        category: 'risk-based',
        priority: 'high',
        schedule: '3-dose series (0, 1, 6 months) using standard single-antigen vaccine. DO NOT USE Heplisav-B in pregnancy.',
        rationale: 'Indicated during pregnancy for patients with occupational exposure, diabetes, ESRD, or chronic liver risk. ACIP explicitly advises using standard alum-adjuvanted vaccines (Engerix-B/Recombivax HB) due to extensive pregnancy safety data.',
        sourceCitation: 'CDC ACIP Recommendations for Hepatitis B Vaccination During Pregnancy / MMWR Guidelines',
      });
    } else if (ageInYears < 1) {
      list.push({
        id: 'hepb_infant',
        name: 'Hepatitis B (Infant Series)',
        brandExamples: 'Engerix-B, Recombivax HB',
        fdaAgeRange: 'Approved starting at birth (0 days)',
        category: 'routine',
        priority: 'high',
        schedule: 'Monovalent birth dose within 24 hours of life; followed by doses at 1-2 and 6-18 months (total 3-4 doses)',
        rationale: 'Universal routine infant immunization starting within 24 hours of birth prevents vertical perinatal and early childhood transmission.',
        sourceCitation: 'CDC Child and Adolescent Immunization Schedule (Table 1: HepB)',
      });
    } else if (ageInYears >= 1 && ageInYears <= 59) {
      list.push({
        id: 'hepb_routine',
        name: 'Hepatitis B Recombinant',
        brandExamples: 'Heplisav-B (2-dose), Engerix-B / Recombivax HB (3-dose)',
        fdaAgeRange: 'Heplisav-B: ≥18 yrs; Engerix-B: all ages',
        category: 'routine',
        priority: 'medium',
        schedule: ageInYears >= 18 
          ? 'Heplisav-B: 2 doses (0, 1 mo) OR 3 doses Engerix-B (0, 1, 6 mos)' 
          : '3 doses Engerix-B / Recombivax HB (0, 1, 6 mos)',
        rationale: 'Universal routine recommendation for all non-immune individuals aged birth through 59 years.',
        sourceCitation: 'CDC MMWR / Universal Hepatitis B Vaccination in Adults Aged 19–59 Years',
      });
    } else if (ageInYears >= 60 && (hasSetting('healthcare') || hasCondition('diabetes') || hasCondition('liver_kidney'))) {
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

    // 11. LIVE VACCINES (MMR & VARICELLA)
    if (patient.isPregnant || isImmuno) {
      const contraReason = patient.isPregnant && isImmuno
        ? 'Active Pregnancy AND Severe Immunocompromise / T-cell deficiency'
        : patient.isPregnant
        ? 'Active Pregnancy'
        : 'Severe Immunocompromise / T-cell deficiency';

      list.push({
        id: 'contra_live',
        name: 'Live Viral Vaccines (MMR, Varicella, LAIV3 Flu)',
        brandExamples: 'M-M-R II, Priorix, Varivax, FluMist',
        fdaAgeRange: 'MMR/Priorix: ≥12 mos; Varivax: ≥12 mos; FluMist: 2 through 49 yrs',
        category: 'contraindicated',
        priority: 'critical',
        schedule: 'ABSOLUTELY CONTRAINDICATED (DO NOT ADMINISTER)',
        rationale: 'Live attenuated viral replication carries severe risk of congenital rubella syndrome, fetal viremia, or unchecked disseminated infection in severely immunocompromised hosts.',
        contraindications: contraReason,
        sourceCitation: 'CDC General Best Practice Guidelines for Immunization: Contraindications and Precautions',
      });
    } else if (ageInMonths < 12) {
      list.push({
        id: 'mmr_infant_wait',
        name: 'MMR & Varicella Vaccines (Deferred Until 12 Months)',
        brandExamples: 'M-M-R II, Priorix, Varivax',
        fdaAgeRange: 'Routine approval starting at ≥12 months of age',
        category: 'deferred',
        priority: 'informational',
        schedule: 'Dose 1 indicated at 12 through 15 months of age; Dose 2 at 4 through 6 years',
        rationale: 'Circulating maternal transplacental IgG antibodies neutralize live viral replication before 12 months, reducing seroconversion. (Off-label dose at 6-11 months given only for immediate international travel, but must still be repeated at ≥12 months).',
        contraindications: 'Age-Based Restriction: Routine start at 12–15 months (Maternal antibody interference)',
        sourceCitation: 'CDC Child and Adolescent Immunization Schedule (Table 1: MMR & VAR)',
      });
    } else {
      // Measles, Mumps, Rubella
      if (patient.history.mmrCompleted) {
        list.push({
          id: 'mmr_done',
          name: 'Measles, Mumps, Rubella (MMR)',
          brandExamples: 'M-M-R II, Priorix',
          fdaAgeRange: '≥12 months through adults',
          category: 'completed',
          priority: 'informational',
          schedule: 'Documented Series or Presumptive Immunity Complete',
          rationale: 'Patient has documented proof of 2 doses of MMR, confirmed laboratory serologic titer, or birth before 1957.',
          sourceCitation: 'CDC ACIP Adult Catch-up & Pediatric Guidelines for MMR',
        });
      } else if (ageInYears < 50) {
        list.push({
          id: 'mmr_catchup',
          name: 'MMR (Measles, Mumps, Rubella Series)',
          brandExamples: 'M-M-R II, Priorix',
          fdaAgeRange: '≥12 months through adults',
          category: 'routine',
          priority: 'medium',
          schedule: ageInYears < 7 
            ? '2-dose routine pediatric series: Dose 1 at 12-15 months, Dose 2 at 4-6 years' 
            : '1 to 2 doses if no laboratory presumptive immunity or documented series',
          rationale: 'Standard immunization against Measles, Mumps, and Rubella. Indicated for adults born in 1957 or later lacking documented proof of vaccination or serologic titer immunity.',
          sourceCitation: 'CDC ACIP Catch-up Guidelines for Measles, Mumps, Rubella',
        });
      }

      // Varicella (Chickenpox)
      if (patient.history.varicellaCompleted) {
        list.push({
          id: 'varicella_done',
          name: 'Varicella (Chickenpox)',
          brandExamples: 'Varivax',
          fdaAgeRange: '≥12 months through adults',
          category: 'completed',
          priority: 'informational',
          schedule: 'Documented 2-Dose Series or Prior Disease Complete',
          rationale: 'Patient has documented history of 2 doses of Varivax, reliable clinical diagnosis/verification of varicella/herpes zoster disease, or serologic immunity.',
          sourceCitation: 'CDC ACIP Varicella Immunization Guidelines',
        });
      } else if (ageInYears < 50) {
        list.push({
          id: 'varicella_catchup',
          name: 'Varicella (Chickenpox Series)',
          brandExamples: 'Varivax',
          fdaAgeRange: '≥12 months through adults',
          category: 'routine',
          priority: 'medium',
          schedule: ageInYears < 7 
            ? '2-dose routine pediatric series: Dose 1 at 12-15 months, Dose 2 at 4-6 years' 
            : '2 doses administered 4 to 8 weeks apart if no documented prior disease or vaccination',
          rationale: 'Universal routine recommendation for non-pregnant, non-immunocompromised individuals lacking presumptive evidence of varicella immunity.',
          sourceCitation: 'CDC ACIP Varicella Prevention and Catch-Up Guidelines',
        });
      }
    }

    return list;
  }, [patient, ageInYears, ageInMonths, isImmuno, isAsplenia]);

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
      if (activeTab === 'contraindicated') return rec.category === 'contraindicated' || rec.category === 'deferred';
      return true;
    });
  }, [recommendations, searchQuery, activeTab]);

  const patientAgeDisplay = useMemo(() => {
    if (patient.ageUnit === 'months') {
      return `${patient.ageValue} ${patient.ageValue === 1 ? 'month' : 'months'} old (${ageInYears.toFixed(2)} yrs)`;
    }
    return `${patient.ageValue} ${patient.ageValue === 1 ? 'year' : 'years'} old`;
  }, [patient.ageValue, patient.ageUnit, ageInYears]);

  const clinicalNoteText = useMemo(() => {
    const indicated = recommendations.filter(r => r.category === 'routine' || r.category === 'risk-based');
    const scdm = recommendations.filter(r => r.category === 'shared-decision');
    const contra = recommendations.filter(r => r.category === 'contraindicated');
    const deferred = recommendations.filter(r => r.category === 'deferred');

    return `CLINICAL IMMUNIZATION ASSESSMENT & ADVISORY NOTE
=====================================================
[BETA STAGING EVALUATION - VERIFY AGAINST PRIMARY CDC SCHEDULES]

PATIENT CLINICAL SUMMARY:
- Age: ${patientAgeDisplay}
- Pregnancy Status: ${patient.isPregnant ? 'Yes (Maternal Protocol Active)' : 'No'}
- Risk Conditions: ${patient.conditions.length > 0 ? patient.conditions.join(', ') : 'None documented'}
- Occupational/Living Setting: ${patient.settings.length > 0 ? patient.settings.join(', ') : 'Standard'}

PRIOR DOCUMENTED DOSES & IMMUNITY:
- Flu (Current Season): ${patient.history.fluThisSeason ? 'Yes' : 'No'}
- Recent COVID-19 Formula: ${patient.history.covidRecent ? 'Yes' : 'No'}
- Maternal RSV (Abrysvo in pregnancy): ${patient.history.maternalRsvReceived ? 'Yes' : 'No'}
- Rotavirus Completed: ${patient.history.rotavirusCompleted ? 'Yes' : 'No'}
- DTaP Primary Series (Pediatric): ${patient.history.dtapPedCompleted ? 'Completed' : 'Incomplete/None'}
- Polio (IPV): ${patient.history.ipvCompleted ? 'Completed' : 'Incomplete/None'}
- MMR Immunity / 2-Dose Series: ${patient.history.mmrCompleted ? 'Documented Complete' : 'Incomplete/Unknown'}
- Varicella Immunity / 2-Dose Series: ${patient.history.varicellaCompleted ? 'Documented Complete' : 'Incomplete/Unknown'}
- Hepatitis A (HepA): ${patient.history.hepaCompleted ? 'Completed' : 'Incomplete/None'}
- Hepatitis B (HepB): ${patient.history.hepbCompleted ? 'Completed' : 'Incomplete/None'}
- HPV Series: ${patient.history.hpvCompleted ? 'Completed' : 'Incomplete/None'}
- Tdap within 10 years: ${patient.history.tdapWithin10Yrs ? 'Yes' : 'No'}
- Shingrix 2-Dose Series: ${patient.history.shingrixCompleted ? 'Completed' : 'Incomplete/None'}
- Prior Pneumococcal: ${patient.history.priorPneumococcal.toUpperCase()}
- Prior Hib: ${patient.history.hibReceived ? 'Documented' : 'None/Unknown'}
- Prior MenACWY: ${patient.history.menAcwyCompleted ? 'Documented' : 'None/Unknown'}
- Prior MenB: ${patient.history.menBCompleted ? 'Documented' : 'None/Unknown'}

RECOMMENDED ROUTINE / RISK-BASED IMMUNIZATIONS:
${indicated.length > 0 ? indicated.map(r => `• ${r.name} (${r.brandExamples})\n  - FDA Indication: ${r.fdaAgeRange}\n  - Schedule: ${r.schedule}\n  - Ref: ${r.sourceCitation}`).join('\n') : '• None currently due'}

SHARED CLINICAL DECISION-MAKING (SCDM) DISCUSSIONS:
${scdm.length > 0 ? scdm.map(r => `• ${r.name} (${r.brandExamples})\n  - FDA Indication: ${r.fdaAgeRange}\n  - Considerations: ${r.rationale}\n  - Ref: ${r.sourceCitation}`).join('\n') : '• None'}

AGE-BASED TIMING RESTRICTIONS & DEFERRED VACCINES:
${deferred.length > 0 ? deferred.map(r => `• ${r.name}\n  - Status: ${r.contraindications}\n  - Schedule: ${r.schedule}`).join('\n') : '• None'}

CONTRAINDICATIONS / SAFETY FLAGS:
${contra.length > 0 ? contra.map(r => `• CRITICAL: ${r.name}\n  - Reason: ${r.contraindications}\n  - Clinical Rationale: ${r.rationale}`).join('\n') : '• No active contraindications flagged'}

Assessed per CDC / ACIP Child, Adolescent & Adult Immunization Schedules.`;
  }, [patient, recommendations, patientAgeDisplay]);

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
      {/* Beta Staging Clinical Alert Banner */}
      <div className="mb-4 bg-amber-50 border border-amber-300 rounded-xl p-3 sm:p-3.5 flex items-start gap-3 text-amber-900 shadow-xs print:hidden">
        <FlaskConical className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="font-bold uppercase tracking-wider text-amber-800 mr-1.5">Beta Testing Notice:</span>
          This clinical decision tool is actively in beta testing and clinical development. While based on CDC/ACIP guidelines, calculation discrepancies or algorithmic errors are possible. Do not use as a sole diagnostic or ordering authority without cross-verifying official CDC schedules.
        </div>
      </div>

      {/* Header Bar */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4 print:border-b-2 print:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-2xl print:text-black flex-wrap">
            <HeartPulse className="w-8 h-8" />
            <h1>ACIP Vaccine Clinical Navigator</h1>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <FlaskConical className="w-3 h-3" />
              Beta Version
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 print:text-slate-600">
            CDC Child, Adolescent, & Adult Immunization Engine with complete dose history tracking, age-gated screening, and updated product indications.
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
            Reset (0 Mos)
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

            {/* Age Selection with Unit Toggle, Stepper, & Landmark Dropdown */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Patient Age Selection
                </label>
                
                <div className="inline-flex rounded-lg bg-slate-200 p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => handleUnitToggle('months')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      patient.ageUnit === 'months' 
                        ? 'bg-white text-indigo-700 shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Months (Pediatric)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnitToggle('years')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      patient.ageUnit === 'years' 
                        ? 'bg-white text-indigo-700 shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Years (Adult)
                  </button>
                </div>
              </div>

              {/* Manual Stepper & Input */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAgeChange(patient.ageValue - 1)}
                  className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 font-bold shadow-xs transition shrink-0"
                >
                  <Minus className="w-4 h-4" />
                </button>
                
                <div className="flex-1 relative">
                  <input
                    type="number"
                    min="0"
                    max={120}
                    value={patient.ageValue}
                    onChange={(e) => handleAgeChange(parseInt(e.target.value) || 0)}
                    className="w-full h-10 px-3 text-center text-lg font-bold text-indigo-950 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs transition"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    {patient.ageUnit}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleAgeChange(patient.ageValue + 1)}
                  className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 font-bold shadow-xs transition shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Jump Landmark Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  Quick Landmark Milestones:
                </label>
                <select
                  value={patient.ageValue}
                  onChange={(e) => handleAgeChange(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-800 shadow-xs focus:ring-2 focus:ring-indigo-500"
                >
                  {(patient.ageUnit === 'months' ? PRESET_MONTHS : PRESET_YEARS).map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status summary banner */}
              <div className="flex justify-between items-center text-[11px] text-indigo-900 bg-indigo-50/70 px-2.5 py-1.5 rounded-md border border-indigo-100 font-medium">
                <span>Active Clinical Evaluation:</span>
                <span className="font-bold">{patientAgeDisplay}</span>
              </div>
            </div>

            {/* Pregnancy Switch - Visible only if age >= 12 years */}
            {ageInYears >= 12 && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between transition">
                <div>
                  <div className="text-xs font-bold text-slate-800">Currently Pregnant?</div>
                  <div className="text-[11px] text-slate-500">Activates maternal Tdap/RSV; flags live vaccines</div>
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
            )}

            {/* Underlying Clinical Conditions (Filtered by age) */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Underlying Medical Conditions
              </label>
              <div className="space-y-1.5">
                {visibleConditions.map((cond) => {
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

            {/* Living / Occupational Settings (Filtered by age) */}
            {visibleSettings.length > 0 && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Occupational / Living Exposures
                </label>
                <div className="space-y-1.5">
                  {visibleSettings.map((setting) => {
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
            )}
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
                  Check off documented previous doses to automatically adjust intervals, recognize immunity, and suppress redundant recommendations.
                </p>

                {/* Maternal RSV Flag (relevant for infants <= 8 months) */}
                {ageInMonths <= 8 && (
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={patient.history.maternalRsvReceived}
                      onChange={(e) => updateHistory('maternalRsvReceived', e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>Mother Received Maternal RSV Vaccine (Abrysvo) during pregnancy</span>
                  </label>
                )}

                {/* Rotavirus infant series */}
                {ageInMonths <= 12 && (
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={patient.history.rotavirusCompleted}
                      onChange={(e) => updateHistory('rotavirusCompleted', e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>Completed Rotavirus Oral Series (2 doses Rotarix or 3 doses RotaTeq)</span>
                  </label>
                )}

                {/* DTaP primary series (pediatric) */}
                {ageInYears < 11 && (
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={patient.history.dtapPedCompleted}
                      onChange={(e) => updateHistory('dtapPedCompleted', e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>Completed Childhood DTaP Primary Series (doses at 2, 4, 6, 15-18 mos)</span>
                  </label>
                )}

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

                {/* Measles, Mumps, Rubella (MMR) */}
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={patient.history.mmrCompleted}
                    onChange={(e) => updateHistory('mmrCompleted', e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Documented MMR Immunity (2 doses, lab serology, or born before 1957)</span>
                </label>

                {/* Varicella (Chickenpox) */}
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={patient.history.varicellaCompleted}
                    onChange={(e) => updateHistory('varicellaCompleted', e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Documented Varicella Immunity (2 doses, prior chickenpox, or lab titer)</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={patient.history.ipvCompleted}
                    onChange={(e) => updateHistory('ipvCompleted', e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Completed Inactivated Polio (IPV) 4-Dose Series</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={patient.history.hepaCompleted}
                    onChange={(e) => updateHistory('hepaCompleted', e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Completed Hepatitis A (HepA) 2-Dose Series</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={patient.history.hepbCompleted}
                    onChange={(e) => updateHistory('hepbCompleted', e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Completed Hepatitis B Series</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={patient.history.hibReceived}
                    onChange={(e) => updateHistory('hibReceived', e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Documented Prior Hib Vaccine (Adult or Child Series)</span>
                </label>

                {ageInYears >= 9 && (
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={patient.history.hpvCompleted}
                      onChange={(e) => updateHistory('hpvCompleted', e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>Completed Human Papillomavirus (HPV) Series</span>
                  </label>
                )}

                {ageInYears >= 11 && (
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={patient.history.tdapWithin10Yrs}
                      onChange={(e) => updateHistory('tdapWithin10Yrs', e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>Received Tdap / Td within past 10 years</span>
                  </label>
                )}

                {(ageInYears >= 50 || isImmuno) && (
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={patient.history.shingrixCompleted}
                      onChange={(e) => updateHistory('shingrixCompleted', e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>Completed 2-Dose Shingrix (RZV) series</span>
                  </label>
                )}

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={patient.history.menAcwyCompleted}
                    onChange={(e) => updateHistory('menAcwyCompleted', e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Completed Initial MenACWY 2-Dose Series</span>
                </label>

                {ageInYears >= 10 && (
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={patient.history.menBCompleted}
                      onChange={(e) => updateHistory('menBCompleted', e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>Completed Initial MenB Series (Bexsero or Trumenba)</span>
                  </label>
                )}

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
                Warnings ({recommendations.filter(r => r.category === 'contraindicated' || r.category === 'deferred').length})
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
                const isDeferred = rec.category === 'deferred';
                const isRoutine = rec.category === 'routine';
                const isShared = rec.category === 'shared-decision';
                const isCompleted = rec.category === 'completed';

                return (
                  <div
                    key={rec.id}
                    className={`bg-white rounded-xl border p-4 transition shadow-xs print:border-slate-300 print:shadow-none ${
                      isContra
                        ? 'border-rose-300 bg-rose-50/40'
                        : isDeferred
                        ? 'border-sky-200 bg-sky-50/30'
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
                                : isDeferred
                                ? 'bg-sky-100 text-sky-800'
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
                              : isDeferred
                              ? 'Age-Based Restriction'
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
                        ) : isDeferred ? (
                          <Clock className="w-5 h-5 text-sky-600 shrink-0" />
                        ) : isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0" />
                        ) : isShared ? (
                          <Scale className="w-5 h-5 text-purple-600 shrink-0" />
                        ) : (
                          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                        )}
                      </div>
                    </div>

                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-[11px] text-slate-700 font-mono">
                      <span className="font-bold text-slate-900">FDA Age Approval:</span>
                      {rec.fdaAgeRange}
                    </div>

                    <div className="mt-2.5 bg-white/80 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed">
                      <span className="font-semibold text-slate-900">Dosing & Administration: </span>
                      {rec.schedule}
                    </div>

                    <div className="mt-2 text-xs text-slate-600 flex items-start gap-1.5 leading-relaxed">
                      <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{rec.rationale}</span>
                    </div>

                    {rec.contraindications && (
                      <div className={`mt-2 text-xs font-semibold flex items-center gap-1.5 p-2 rounded-md ${
                        isContra ? 'bg-rose-100/70 text-rose-700' : 'bg-sky-100/70 text-sky-800'
                      }`}>
                        {isContra ? <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" /> : <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                        <span>{rec.contraindications}</span>
                      </div>
                    )}

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
                <strong>General Rule for Inactivated Vaccines & Monoclonal Antibodies:</strong> Inactivated vaccines (Flu, COVID-19, Shingrix, Pneumococcal, Hepatitis B, Hepatitis A, Tdap, IPV, MenACWY, MenB, Hib) and Nirsevimab (RSV-mAb) can be co-administered simultaneously at separate anatomical injection sites during the same visit.
              </p>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
                <strong>Live Attenuated Spacing Rule (MMR, Varicella, Yellow Fever, LAIV3):</strong> Parenteral live virus vaccines must be administered on the same calendar day or spaced apart by at least 28 days (4 weeks) to avoid immune response blunting.
              </div>
              <p>
                <strong>Pneumococcal PCV & PPSV23 Spacing:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>If <strong>PCV20 or PCV21</strong> is administered, no subsequent dose of PPSV23 is needed; pneumococcal coverage is complete.</li>
                <li>If <strong>PCV15</strong> is given, it must be followed by a dose of <strong>PPSV23</strong> at least 1 year later in immunocompetent adults, or at least 8 weeks later in patients with asplenia or immunocompromising conditions.</li>
                <li><strong>PCV15 and PPSV23 should never be administered simultaneously at the same clinical visit.</strong></li>
              </ul>
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

      {/* Expanded Medical & Beta Disclaimer Footer */}
      <footer className="mt-12 pt-6 border-t border-slate-200 print:hidden">
        <div className="bg-slate-100 rounded-2xl p-5 border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Scale className="w-4 h-4 text-slate-600" />
            <h3>Medical & Regulatory Disclaimer</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md ml-1">
              Active Beta Testing
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>For Educational and Demonstration Reference Only:</strong> This application is currently undergoing active beta development and software validation. Algorithm recommendations are derived from published CDC and ACIP immunization schedules and manufacturer prescribing guidelines, but software bugs, calculation discrepancies, or algorithmic interpretation errors may occur.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            This tool does not constitute medical advice, diagnosis, or personalized patient orders. Licensed healthcare providers must independently confirm all indications, contraindications, and schedules using primary manufacturer package inserts and current CDC MMWR recommendations prior to clinical administration.
          </p>
        </div>
      </footer>
    </div>
  );
}
