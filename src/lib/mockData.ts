export type Tender = {
  id: string;
  title: string;
  domain: string;
  estimated_value_lakhs: number;
  startup_exemption: boolean;
  deadline: string;
  summary: string;
  issuer: string;
  nit_number?: string | null;
  requirements_json: {
    mandatory_docs: string[];
    min_turnover_lakhs: number;
    min_years: number;
    certifications: string[];
    emd_lakhs: number;
  };
};

export type MsmeProfile = {
  id: string;
  company_name: string;
  domain_category: string;
  turnover_lakhs: number;
  years_in_business: number;
  certifications: string[];
};

export const mockMsmeProfile: MsmeProfile = {
  id: "msme-001",
  company_name: "TechVentures Pvt Ltd",
  domain_category: "IT & Software",
  turnover_lakhs: 180,
  years_in_business: 4,
  certifications: ["ISO 9001", "MSME Udyam"],
};

export const mockTenders: Tender[] = [
  {
    id: "tender-001",
    title: "Smart City IoT Infrastructure Deployment",
    domain: "IT & Software",
    estimated_value_lakhs: 250,
    startup_exemption: true,
    deadline: "2026-06-15",
    issuer: "Bangalore Smart City Limited",
    summary:
      "Deployment of 500+ IoT sensors across city intersections for real-time traffic and environment monitoring. Includes cloud dashboard and mobile app.",
    requirements_json: {
      mandatory_docs: ["PAN Card", "GST Registration", "Udyam Certificate", "Technical Proposal"],
      min_turnover_lakhs: 50,
      min_years: 2,
      certifications: ["ISO 9001"],
      emd_lakhs: 5,
    },
  },
  {
    id: "tender-002",
    title: "e-Governance Portal Development & Maintenance",
    domain: "IT & Software",
    estimated_value_lakhs: 120,
    startup_exemption: false,
    deadline: "2026-06-30",
    issuer: "Karnataka IT Department",
    summary:
      "Development of citizen-facing portal for 12 government services with multilingual support (Kannada, English, Hindi) and mobile-responsive design.",
    requirements_json: {
      mandatory_docs: [
        "PAN Card",
        "GST Registration",
        "Udyam Certificate",
        "Past Project Proof (3)",
        "Bank Solvency",
      ],
      min_turnover_lakhs: 150,
      min_years: 3,
      certifications: ["ISO 9001", "ISO 27001"],
      emd_lakhs: 2.5,
    },
  },
  {
    id: "tender-003",
    title: "Digital Literacy Training Program",
    domain: "Education & Training",
    estimated_value_lakhs: 80,
    startup_exemption: true,
    deadline: "2026-07-10",
    issuer: "Ministry of Electronics & IT",
    summary:
      "Training 10,000 rural citizens in digital payments, e-services, and cyber safety across 50 villages in Karnataka.",
    requirements_json: {
      mandatory_docs: ["PAN Card", "GST Registration", "Udyam Certificate"],
      min_turnover_lakhs: 20,
      min_years: 1,
      certifications: [],
      emd_lakhs: 1,
    },
  },
  {
    id: "tender-004",
    title: "Hospital Management Software System",
    domain: "IT & Software",
    estimated_value_lakhs: 340,
    startup_exemption: false,
    deadline: "2026-05-28",
    issuer: "NIMHANS Bangalore",
    summary:
      "Integrated HMS covering OPD, IPD, pharmacy, billing, and ABDM health records for a 600-bed tertiary care hospital.",
    requirements_json: {
      mandatory_docs: [
        "PAN Card",
        "GST Registration",
        "Udyam Certificate",
        "NABH Compliance Proof",
        "Past Project (Hospital)",
      ],
      min_turnover_lakhs: 300,
      min_years: 5,
      certifications: ["ISO 9001", "ISO 27001", "HIPAA Compliance"],
      emd_lakhs: 10,
    },
  },
  {
    id: "tender-005",
    title: "Cybersecurity Audit & Penetration Testing",
    domain: "IT & Software",
    estimated_value_lakhs: 45,
    startup_exemption: true,
    deadline: "2026-07-05",
    issuer: "KSRTC Digital Division",
    summary:
      "Comprehensive VAPT for 3 web applications, 2 mobile apps, and internal network infrastructure of state transport corporation.",
    requirements_json: {
      mandatory_docs: ["PAN Card", "GST Registration", "Udyam Certificate", "CERT-In Empanelment"],
      min_turnover_lakhs: 30,
      min_years: 2,
      certifications: ["ISO 27001"],
      emd_lakhs: 0.5,
    },
  },
  {
    id: "tender-006",
    title: "Construction of Rural Roads Phase IV",
    domain: "Civil Engineering",
    estimated_value_lakhs: 950,
    startup_exemption: false,
    deadline: "2026-06-20",
    issuer: "PMGSY Karnataka",
    summary:
      "Construction and maintenance of 85 km rural roads in Tumkur and Chitradurga districts under PMGSY Phase IV.",
    requirements_json: {
      mandatory_docs: ["PAN", "GST", "PWD Class-A Registration", "Completion Certificates"],
      min_turnover_lakhs: 800,
      min_years: 7,
      certifications: [],
      emd_lakhs: 25,
    },
  },
];

export const mockAdminStats = {
  activeTenders: 47,
  msmesRegistered: 1284,
  apiCallsToday: 328,
};

export const preGeneratedAnswers: Record<string, string> = {
  "What is the EMD amount?":
    "The Earnest Money Deposit (EMD) for this tender is ₹5 Lakhs, payable via Demand Draft or Bank Guarantee in favour of the issuing authority. Startups registered under DPIIT are exempt from EMD payment.",
  "What documents do I need?":
    "You need: (1) PAN Card copy, (2) GST Registration Certificate, (3) MSME Udyam Certificate, (4) Technical Proposal with methodology, (5) Last 3 years audited financials. All documents must be self-attested.",
  "Am I eligible as a startup?":
    "Yes! This tender has Startup Exemption. DPIIT-recognized startups are exempt from: Prior turnover requirement, EMD deposit, and experience clause. Submit your DPIIT recognition certificate instead.",
  "What is the project timeline?":
    "The project timeline is 18 months from the Letter of Award (LOA). Milestones: Phase 1 (sensor procurement & install) — 6 months, Phase 2 (dashboard deployment) — 4 months, Phase 3 (testing & handover) — 8 months.",
};
