/**
 * Seed Service Configuration Master Data
 * Based on implementation_Plan.md - Complete Service Catalog
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Service Categories (6 main categories)
const categories = [
    { code: 'INCOME_TAX', name: 'Income Tax Services', icon: 'Receipt', displayOrder: 1 },
    { code: 'GST', name: 'GST Services', icon: 'Calculator', displayOrder: 2 },
    { code: 'ROC_MCA', name: 'ROC/MCA Compliance', icon: 'Building2', displayOrder: 3 },
    { code: 'AUDIT', name: 'Audit Services', icon: 'ClipboardCheck', displayOrder: 4 },
    { code: 'PAYROLL', name: 'Payroll & HR Compliance', icon: 'Users', displayOrder: 5 },
    { code: 'OTHER', name: 'Other Services', icon: 'MoreHorizontal', displayOrder: 6 },
];

// Service Types per Category
const serviceTypes: Record<string, Array<{
    code: string;
    name: string;
    description: string;
    hasSubTypes: boolean;
    requiresFinancialYear: boolean;
    requiresAssessmentYear?: boolean;
    requiresQuarter?: boolean;
    requiresPeriod?: boolean;
    defaultDueDate?: string;
    frequency?: string;
    deliverables?: string[];
    displayOrder: number;
}>> = {
    INCOME_TAX: [
        {
            code: 'ITR_FILING',
            name: 'ITR Filing',
            description: 'Annual Income Tax Return filing for individuals, HUFs, firms & companies as per Income Tax Act, 1961',
            hasSubTypes: true,
            requiresFinancialYear: true,
            requiresAssessmentYear: true,
            defaultDueDate: 'July 31',
            frequency: 'Annual',
            deliverables: [
                'Form 16/16A collection & verification',
                'AIS & 26AS reconciliation',
                'Income computation with all heads',
                'Chapter VI-A deductions optimization',
                'ITR form selection & preparation',
                'E-filing with digital signature/EVC',
                'ITR-V acknowledgment receipt'
            ],
            displayOrder: 1,
        },
        {
            code: 'TDS_RETURN',
            name: 'TDS Return',
            description: 'Quarterly TDS/TCS return filing under Sections 192-206C for employers & deductors',
            hasSubTypes: true,
            requiresFinancialYear: true,
            requiresQuarter: true,
            defaultDueDate: 'Q1: July 31, Q2: Oct 31, Q3: Jan 31, Q4: May 31',
            frequency: 'Quarterly',
            deliverables: [
                'Challan-wise TDS payment reconciliation',
                'TRACES portal login & data validation',
                'Deductee PAN verification',
                'FVU file generation & validation',
                'Return filing on TRACES',
                'Form 16/16A generation for deductees',
                'Correction statement (if required)'
            ],
            displayOrder: 2,
        },
        {
            code: 'ADVANCE_TAX',
            name: 'Advance Tax',
            description: 'Quarterly advance tax computation & payment for taxpayers with liability exceeding ₹10,000/year',
            hasSubTypes: false,
            requiresFinancialYear: true,
            defaultDueDate: 'June 15, Sept 15, Dec 15, Mar 15',
            frequency: 'Quarterly',
            deliverables: [
                'Estimated income projection for FY',
                'Tax liability computation with surcharge & cess',
                'TDS credit adjustment from 26AS',
                'Challan 280 preparation',
                'Payment via e-Pay Tax portal',
                'Challan receipt & confirmation',
                'Interest u/s 234B & 234C calculation (if short)'
            ],
            displayOrder: 3,
        },
        {
            code: 'TAX_PLANNING',
            name: 'Tax Planning & Advisory',
            description: 'Strategic tax saving advisory considering old vs new regime, investments & business structure',
            hasSubTypes: false,
            requiresFinancialYear: true,
            defaultDueDate: 'Before March 31',
            frequency: 'Annual',
            deliverables: [
                'Old vs New regime comparison',
                '80C investments (PPF, ELSS, LIC) advisory',
                '80D health insurance optimization',
                'HRA exemption calculation & rent agreement',
                'Home loan interest (24b) & principal (80C)',
                'NPS contribution benefit (80CCD)',
                'Capital gains planning (54, 54EC, 54F)'
            ],
            displayOrder: 4,
        },
    ],
    GST: [
        {
            code: 'GST_REGISTRATION',
            name: 'GST Registration',
            description: 'New GSTIN registration for businesses crossing ₹40L (goods) / ₹20L (services) turnover threshold',
            hasSubTypes: true,
            requiresFinancialYear: false,
            defaultDueDate: 'Within 30 days of liability',
            frequency: 'One-time',
            deliverables: [
                'Aadhaar authentication & PAN verification',
                'Business address proof collection',
                'Bank account details with cancelled cheque',
                'GST REG-01 application filing',
                'ARN (Application Reference Number) generation',
                'Query response (if any) within 7 days',
                'GSTIN certificate download & delivery'
            ],
            displayOrder: 1,
        },
        {
            code: 'GST_RETURN',
            name: 'GST Return',
            description: 'Monthly/Quarterly GST return filing including outward supplies (GSTR-1) & tax payment (GSTR-3B)',
            hasSubTypes: true,
            requiresFinancialYear: false,
            requiresPeriod: true,
            defaultDueDate: 'GSTR-1: 11th, GSTR-3B: 20th',
            frequency: 'Monthly/Quarterly',
            deliverables: [
                'Sales register & invoice data collection',
                'GSTR-2B download & ITC reconciliation',
                'HSN/SAC code verification',
                'Tax liability computation (CGST, SGST, IGST)',
                'ITC utilization in proper order',
                'GSTR-1 & GSTR-3B e-filing',
                'Payment challan generation',
                'Filing acknowledgment & ARN'
            ],
            displayOrder: 2,
        },
        {
            code: 'GST_COMPLIANCE',
            name: 'GST Compliance Services',
            description: 'Ongoing GST compliance including E-Way Bill, E-Invoicing, ITC matching & annual return',
            hasSubTypes: true,
            requiresFinancialYear: false,
            defaultDueDate: 'As per transaction',
            frequency: 'Ongoing',
            deliverables: [
                'E-Way Bill generation (for goods > ₹50,000)',
                'E-Invoice generation on IRP portal',
                'GSTR-2A vs GSTR-3B reconciliation',
                'ITC mismatch identification & vendor follow-up',
                'Input reversal calculation (Rule 42/43)',
                'LUT filing for exporters',
                'GSTR-9 annual return preparation'
            ],
            displayOrder: 3,
        },
    ],
    ROC_MCA: [
        {
            code: 'COMPANY_INCORPORATION',
            name: 'Company Incorporation',
            description: 'New company/LLP registration with Ministry of Corporate Affairs under Companies Act, 2013',
            hasSubTypes: true,
            requiresFinancialYear: false,
            defaultDueDate: '15-20 working days',
            frequency: 'One-time',
            deliverables: [
                'Name reservation via RUN/SPICe+',
                'DSC (Digital Signature) procurement for directors',
                'DIN (Director Identification Number) generation',
                'MOA & AOA drafting',
                'SPICe+ form filing with MCA',
                'PAN & TAN application (integrated)',
                'Certificate of Incorporation (COI)',
                'Company Master Data (CMD) download'
            ],
            displayOrder: 1,
        },
        {
            code: 'ROC_ANNUAL',
            name: 'Annual ROC Filings',
            description: 'Mandatory yearly compliance filings with Registrar of Companies for all active companies',
            hasSubTypes: true,
            requiresFinancialYear: true,
            defaultDueDate: 'Within 30-60 days of AGM',
            frequency: 'Annual',
            deliverables: [
                'Board meeting minutes for accounts approval',
                'AGM notice & agenda preparation',
                'Directors Report drafting',
                'AOC-4 (Balance Sheet & P&L) filing',
                'MGT-7/7A (Annual Return) filing',
                'DIR-3 KYC for all directors (Sept 30)',
                'ADT-1 (Auditor Appointment) if applicable',
                'SRN (Service Request Number) & challan receipt'
            ],
            displayOrder: 2,
        },
        {
            code: 'ROC_EVENT',
            name: 'Event-Based Filings',
            description: 'ROC filings triggered by corporate events - director/shareholder/capital changes',
            hasSubTypes: true,
            requiresFinancialYear: false,
            defaultDueDate: 'Within 30 days of event',
            frequency: 'As required',
            deliverables: [
                'Board resolution drafting',
                'Shareholder consent (MGT-14 if needed)',
                'Form filing within statutory timeline',
                'Document attachment preparation',
                'Digital signature & certification',
                'MCA portal submission',
                'SRN tracking & confirmation',
                'Updated MCA Master Data'
            ],
            displayOrder: 3,
        },
    ],
    AUDIT: [
        {
            code: 'STATUTORY_AUDIT',
            name: 'Statutory Audit',
            description: 'Mandatory independent audit under Section 143 of Companies Act, 2013 for all companies',
            hasSubTypes: false,
            requiresFinancialYear: true,
            defaultDueDate: 'Before AGM (within 6 months of FY end)',
            frequency: 'Annual',
            deliverables: [
                'Audit planning & risk assessment',
                'Vouching & verification of transactions',
                'Fixed assets physical verification',
                'Debtors/Creditors confirmation',
                'Bank reconciliation review',
                'Independent Audit Report (Form 3CA)',
                'Audited Balance Sheet & P&L Statement',
                'CARO Report (Companies Auditor Report Order)',
                'Management Representation Letter'
            ],
            displayOrder: 1,
        },
        {
            code: 'TAX_AUDIT',
            name: 'Tax Audit (Section 44AB)',
            description: 'Mandatory audit for businesses (turnover > ₹1Cr) & professionals (receipts > ₹50L)',
            hasSubTypes: false,
            requiresFinancialYear: true,
            defaultDueDate: 'September 30',
            frequency: 'Annual',
            deliverables: [
                'Books of accounts verification',
                'TDS compliance check (all sections)',
                'GST reconciliation with books',
                'Expense disallowance review (40A, 43B)',
                'Depreciation calculation (IT vs Companies Act)',
                'Form 3CA/3CB (Audit Report)',
                'Form 3CD (44 clauses statement)',
                'E-filing on Income Tax Portal',
                'UDIN generation & linking'
            ],
            displayOrder: 2,
        },
        {
            code: 'GST_AUDIT',
            name: 'GST Audit',
            description: 'Self-certified reconciliation statement (GSTR-9C) for turnover exceeding ₹5 Crore',
            hasSubTypes: false,
            requiresFinancialYear: true,
            defaultDueDate: 'December 31',
            frequency: 'Annual',
            deliverables: [
                'Turnover reconciliation (Books vs GST returns)',
                'ITC claimed vs eligible reconciliation',
                'HSN-wise summary verification',
                'Tax rate-wise liability check',
                'Reverse charge compliance review',
                'GSTR-9 (Annual Return) preparation',
                'GSTR-9C (Reconciliation Statement)',
                'Additional liability computation (if any)'
            ],
            displayOrder: 3,
        },
        {
            code: 'INTERNAL_AUDIT',
            name: 'Internal Audit',
            description: 'Internal control evaluation for companies, NBFCs & entities requiring management oversight',
            hasSubTypes: false,
            requiresFinancialYear: true,
            defaultDueDate: 'As per company policy',
            frequency: 'Quarterly/Annual',
            deliverables: [
                'Process walkthrough & documentation',
                'Control testing (design & operating effectiveness)',
                'Compliance testing (policies & regulations)',
                'Fraud risk assessment',
                'Internal Audit Report with observations',
                'Root cause analysis',
                'Management Letter with recommendations',
                'Action Taken Report (ATR) follow-up'
            ],
            displayOrder: 4,
        },
    ],
    PAYROLL: [
        {
            code: 'PAYROLL_PROCESSING',
            name: 'Payroll Processing',
            description: 'Complete monthly salary processing including attendance, deductions, TDS & statutory compliance',
            hasSubTypes: false,
            requiresFinancialYear: false,
            requiresPeriod: true,
            defaultDueDate: '7th of following month',
            frequency: 'Monthly',
            deliverables: [
                'Attendance & leave data processing',
                'Gross salary computation (Basic, DA, HRA, etc.)',
                'Statutory deductions (PF, ESI, PT, TDS)',
                'Reimbursements & incentives processing',
                'Net pay calculation',
                'Payslips generation (PDF/Email)',
                'Bank transfer file (NEFT/RTGS format)',
                'Salary register & department-wise reports',
                'Monthly payroll MIS'
            ],
            displayOrder: 1,
        },
        {
            code: 'PF_COMPLIANCE',
            name: 'PF Compliance (EPFO)',
            description: 'Provident Fund compliance under EPF & MP Act, 1952 for establishments with 20+ employees',
            hasSubTypes: false,
            requiresFinancialYear: false,
            requiresPeriod: true,
            defaultDueDate: '15th of following month',
            frequency: 'Monthly',
            deliverables: [
                'PF wages identification (capped at ₹15,000)',
                'Employee share (12%) & Employer share (12%) calculation',
                'EPS (8.33%) & EDLI contribution',
                'Admin charges computation',
                'ECR file generation & upload on EPFO portal',
                'Challan payment via online mode',
                'UAN activation for new employees',
                'Annual Form 3A & 6A submission'
            ],
            displayOrder: 2,
        },
        {
            code: 'ESI_COMPLIANCE',
            name: 'ESI Compliance (ESIC)',
            description: 'Employee State Insurance for employees with gross salary ≤ ₹21,000/month in covered establishments',
            hasSubTypes: false,
            requiresFinancialYear: false,
            requiresPeriod: true,
            defaultDueDate: '15th of following month',
            frequency: 'Monthly',
            deliverables: [
                'ESI wages computation',
                'Employee contribution (0.75%)',
                'Employer contribution (3.25%)',
                'ESIC portal challan generation',
                'Online payment processing',
                'IP (Insured Person) registration',
                'Half-yearly return filing',
                'Accident report (if any)'
            ],
            displayOrder: 3,
        },
        {
            code: 'PROFESSIONAL_TAX',
            name: 'Professional Tax',
            description: 'State-level professional tax deduction & filing as per respective State PT Act',
            hasSubTypes: false,
            requiresFinancialYear: false,
            requiresPeriod: true,
            defaultDueDate: 'State-specific (usually monthly)',
            frequency: 'Monthly',
            deliverables: [
                'PT slab identification (state-wise)',
                'Monthly PT deduction from salary',
                'Employer PT liability calculation',
                'Online challan generation',
                'Payment on state portal',
                'Monthly/Quarterly return filing',
                'PT registration & enrollment certificate',
                'Annual PT return'
            ],
            displayOrder: 4,
        },
    ],
    OTHER: [
        {
            code: 'FEMA_COMPLIANCE',
            name: 'FEMA Compliance',
            description: 'Foreign Exchange Management Act compliance for FDI, ODI & cross-border transactions',
            hasSubTypes: true,
            requiresFinancialYear: false,
            defaultDueDate: 'Within 30 days of transaction',
            frequency: 'As required',
            deliverables: [
                'Transaction eligibility under FEMA',
                'Sectoral cap & pricing guidelines compliance',
                'FC-GPR (FDI reporting) to RBI',
                'FC-TRS (share transfer) filing',
                'Annual Return on Foreign Liabilities (FLA)',
                'ECB (External Commercial Borrowing) compliance',
                'ODI (Overseas Direct Investment) reporting',
                'Compounding application (if violation)'
            ],
            displayOrder: 1,
        },
        {
            code: 'STARTUP_SERVICES',
            name: 'Startup Services',
            description: 'DPIIT Startup India recognition, tax exemptions & funding support under Startup India scheme',
            hasSubTypes: true,
            requiresFinancialYear: false,
            defaultDueDate: 'Varies by application',
            frequency: 'One-time',
            deliverables: [
                'Entity eligibility assessment',
                'Innovation/scalability documentation',
                'DPIIT application on Startup India portal',
                'Recognition certificate issuance',
                '80IAC income tax exemption application',
                'Angel Tax exemption (Section 56) filing',
                'SIDBI Fund of Funds application',
                'State startup policy benefits'
            ],
            displayOrder: 2,
        },
        {
            code: 'TRADEMARK',
            name: 'Trademark & IP',
            description: 'Intellectual Property registration & protection under Trade Marks Act, 1999 & Copyright Act, 1957',
            hasSubTypes: true,
            requiresFinancialYear: false,
            defaultDueDate: 'Varies by application',
            frequency: 'One-time + Renewals',
            deliverables: [
                'TM search & availability report',
                'Class identification (Nice Classification)',
                'TM-A application drafting',
                'Filing on IP India portal',
                'Examination report response',
                'Publication in TM Journal',
                'Opposition proceedings (if any)',
                'Registration certificate',
                'Renewal reminder (every 10 years)'
            ],
            displayOrder: 3,
        },
        {
            code: 'IMPORT_EXPORT',
            name: 'Import/Export',
            description: 'Import Export Code, DGFT compliances & foreign trade facilitation under FTP 2023',
            hasSubTypes: true,
            requiresFinancialYear: false,
            defaultDueDate: 'Varies by filing',
            frequency: 'As required',
            deliverables: [
                'IEC (Import Export Code) registration',
                'RCMC (Registration cum Membership Certificate)',
                'DGFT portal registration',
                'License/Authorization application',
                'Shipping bill & Bill of Entry review',
                'Advance Authorization compliance',
                'EPCG scheme documentation',
                'Annual Return filing on DGFT'
            ],
            displayOrder: 4,
        },
        {
            code: 'CONSULTATION',
            name: 'Consultation',
            description: 'Expert advisory on tax, regulatory, business structuring & compliance matters',
            hasSubTypes: false,
            requiresFinancialYear: false,
            defaultDueDate: 'As scheduled',
            frequency: 'On-demand',
            deliverables: [
                'Issue understanding & scoping',
                'Fact gathering & document review',
                'Legal/regulatory research',
                'Expert consultation session',
                'Written advisory opinion with citations',
                'Action plan with timelines',
                'Follow-up clarifications',
                'Implementation support'
            ],
            displayOrder: 5,
        },
        {
            code: 'BOOK_KEEPING',
            name: 'Book Keeping',
            description: 'Regular accounting & books maintenance as per Indian Accounting Standards & Companies Act',
            hasSubTypes: false,
            requiresFinancialYear: true,
            requiresPeriod: true,
            defaultDueDate: '10th of following month',
            frequency: 'Monthly',
            deliverables: [
                'Sales & purchase voucher entry',
                'Receipt & payment recording',
                'Journal entries for adjustments',
                'Bank reconciliation statement',
                'Party-wise ledger maintenance',
                'Monthly trial balance',
                'TDS/GST provision entries',
                'Depreciation & amortization',
                'Monthly financial reports (P&L, BS)'
            ],
            displayOrder: 6,
        },
    ],
};

// Sub-Types for services that need them
const subTypes: Record<string, Array<{
    code: string;
    name: string;
    applicableTo: string;
    dueDateReference?: string;
    deliverables?: string[];
}>> = {
    ITR_FILING: [
        {
            code: 'ITR_1',
            name: 'ITR-1 (Sahaj)',
            applicableTo: 'Salaried (Income ≤ ₹50L), Resident Individual',
            dueDateReference: 'July 31',
            deliverables: [
                'Form 16 collection & verification',
                '26AS/AIS TDS reconciliation',
                'Salary income computation',
                'House property income (one property)',
                '80C, 80D, 80G deductions claim',
                'Bank interest & other sources',
                'ITR-1 e-filing with EVC/DSC',
                'ITR-V acknowledgment receipt'
            ]
        },
        {
            code: 'ITR_2',
            name: 'ITR-2',
            applicableTo: 'Individuals with Capital Gains, Foreign Income',
            dueDateReference: 'July 31',
            deliverables: [
                'Form 16 & other TDS certificates',
                'Capital gains computation (short/long term)',
                'Foreign income reporting (Schedule FA)',
                'Multiple house property income',
                'Exempt income disclosure',
                'Deductions under Chapter VI-A',
                'ITR-2 e-filing',
                'Verification & acknowledgment'
            ]
        },
        {
            code: 'ITR_3',
            name: 'ITR-3',
            applicableTo: 'Individuals with Business/Profession Income',
            dueDateReference: 'July 31 or October 31 (Audit)',
            deliverables: [
                'Profit & Loss account preparation',
                'Balance Sheet finalization',
                'Business income computation',
                'Depreciation schedule (IT Act)',
                'Section 44AD/44ADA presumptive check',
                'Partner remuneration/interest (if any)',
                'All heads of income consolidation',
                'ITR-3 e-filing with DSC',
                'Tax audit linkage (44AB if applicable)'
            ]
        },
        {
            code: 'ITR_4',
            name: 'ITR-4 (Sugam)',
            applicableTo: 'Presumptive Taxation (Small Business)',
            dueDateReference: 'July 31',
            deliverables: [
                'Turnover verification',
                '44AD/44ADA presumptive income @6%/8%/50%',
                'Gross receipts documentation',
                'Bank account details',
                'Chapter VI-A deductions',
                'Advance tax payment verification',
                'ITR-4 e-filing',
                'Acknowledgment receipt'
            ]
        },
        {
            code: 'ITR_5',
            name: 'ITR-5',
            applicableTo: 'Partnership Firms, LLPs, AOPs, BOIs',
            dueDateReference: 'July 31 or October 31 (Audit)',
            deliverables: [
                'Firm/LLP P&L preparation',
                'Balance Sheet with schedules',
                'Partner capital account reconciliation',
                'Interest & remuneration to partners',
                'Section 44AB audit compliance check',
                'MAT/AMT computation (if applicable)',
                'ITR-5 e-filing with firm DSC',
                'Partner-wise profit sharing statement'
            ]
        },
        {
            code: 'ITR_6',
            name: 'ITR-6',
            applicableTo: 'Companies (except Sec 11)',
            dueDateReference: 'October 31',
            deliverables: [
                'Audited financial statements',
                'Schedule-wise income computation',
                'Depreciation as per IT Act',
                'MAT (Minimum Alternate Tax) calculation',
                'Brought forward losses adjustment',
                'Tax audit report (Form 3CA/3CB/3CD)',
                'Transfer pricing report (if applicable)',
                'ITR-6 e-filing with company DSC',
                'Computation of total income booklet'
            ]
        },
        {
            code: 'ITR_7',
            name: 'ITR-7',
            applicableTo: 'Trusts, Political Parties, Charitable Institutions',
            dueDateReference: 'October 31',
            deliverables: [
                'Trust/Institution registration verification',
                'Section 11/12 exemption computation',
                'Application of income statement',
                'Accumulation for future (Form 10)',
                'Corpus donation segregation',
                'Audit report (Form 10B/10BB)',
                'ITR-7 e-filing',
                'Compliance with FCRA (if applicable)'
            ]
        },
    ],
    TDS_RETURN: [
        {
            code: '24Q',
            name: '24Q - TDS on Salary',
            applicableTo: 'Employers deducting TDS from salary',
            dueDateReference: 'Quarterly - 31st of month after quarter',
            deliverables: [
                'Employee salary data collection',
                'Form 12BB investment declaration',
                'TDS computation as per slab',
                'Challan payment verification (281)',
                '24Q return preparation',
                'TRACES validation & filing',
                'Form 16 generation (Part A & B)',
                'Employee-wise TDS certificate'
            ]
        },
        {
            code: '26Q',
            name: '26Q - TDS on Non-Salary',
            applicableTo: 'TDS on Interest, Commission, etc.',
            dueDateReference: 'Jul 31, Oct 31, Jan 31, May 31',
            deliverables: [
                'Vendor payment summary',
                'Section-wise TDS rate application',
                'Lower deduction certificate check',
                'Challan-wise payment matching',
                '26Q return preparation',
                'FVU validation & filing',
                'Form 16A generation',
                'Deductee-wise certificate'
            ]
        },
        {
            code: '27Q',
            name: '27Q - TDS on NRI Payments',
            applicableTo: 'TDS on payments to Non-Residents',
            dueDateReference: 'Same as 26Q',
            deliverables: [
                'Non-resident payment identification',
                'Section 195 applicability check',
                'DTAA benefit verification',
                'Higher TDS rate check (no PAN)',
                '27Q return preparation',
                'Form 15CA/15CB linkage',
                'Filing on TRACES',
                'NRI TDS certificate'
            ]
        },
        {
            code: '27EQ',
            name: '27EQ - TCS Return',
            applicableTo: 'Tax Collected at Source',
            dueDateReference: 'Same as 26Q',
            deliverables: [
                'TCS applicable transactions',
                'Scrap sale, timber, alcohol etc.',
                'TCS rate verification',
                'Challan payment matching',
                '27EQ return preparation',
                'Filing on TRACES',
                'Collectee certificate',
                'TCS reconciliation report'
            ]
        },
    ],
    GST_REGISTRATION: [
        {
            code: 'GST_REG_REGULAR',
            name: 'Regular Registration',
            applicableTo: 'Normal business, full compliance',
            deliverables: [
                'Aadhaar e-KYC verification',
                'Business constitution documents',
                'Address proof & NOC',
                'PAN/TAN verification',
                'Bank account proof',
                'GST REG-01 filing',
                'ARN generation',
                'GSTIN certificate'
            ]
        },
        {
            code: 'GST_REG_COMPOSITION',
            name: 'Composition Scheme',
            applicableTo: 'Small business, 1-6% tax, quarterly return',
            deliverables: [
                'Turnover eligibility check (< ₹1.5Cr)',
                'No interstate supply declaration',
                'GST CMP-01/02 filing',
                'Quarterly GSTR-4 awareness',
                'Display board format',
                'GSTIN with composition status',
                'Annual return (CMP-08) guidance'
            ]
        },
        {
            code: 'GST_REG_CASUAL',
            name: 'Casual Registration',
            applicableTo: 'Temporary registration for events',
            deliverables: [
                'Event/exhibition details',
                'Advance tax deposit',
                '90-day validity period',
                'GST REG-01 with casual option',
                'Extension if required',
                'Temporary GSTIN issuance'
            ]
        },
        {
            code: 'GST_REG_NRI',
            name: 'Non-Resident Registration',
            applicableTo: 'Foreign businesses',
            deliverables: [
                'Passport/ID verification',
                'Business proof in home country',
                'Authorized signatory in India',
                'Advance tax deposit estimation',
                'GST REG-09 filing',
                'GSTIN for non-resident'
            ]
        },
        {
            code: 'GST_REG_SEZ',
            name: 'SEZ Registration',
            applicableTo: 'Special Economic Zone units',
            deliverables: [
                'SEZ approval letter',
                'Zone location details',
                'Zero-rated supply setup',
                'GST REG-01 SEZ option',
                'LUT/Bond requirement',
                'SEZ GSTIN issuance'
            ]
        },
        {
            code: 'GST_REG_ISD',
            name: 'Input Service Distributor',
            applicableTo: 'ISD for distributing ITC',
            deliverables: [
                'Head office registration proof',
                'Branch GSTIN details',
                'ITC distribution ratio',
                'GST REG-01 ISD option',
                'GSTR-6 filing guidance',
                'ISD GSTIN issuance'
            ]
        },
    ],
    GST_RETURN: [
        {
            code: 'GSTR_1',
            name: 'GSTR-1',
            applicableTo: 'Outward Supplies (Sales)',
            dueDateReference: '11th Monthly',
            deliverables: [
                'Sales invoice data compilation',
                'B2B invoice-wise details',
                'B2C consolidated summary',
                'Credit/Debit note adjustment',
                'HSN summary preparation',
                'NIL rated & exempt supplies',
                'GSTR-1 filing on GST portal',
                'Amendment details (if any)'
            ]
        },
        {
            code: 'GSTR_3B',
            name: 'GSTR-3B',
            applicableTo: 'Summary + Tax Payment',
            dueDateReference: '20th Monthly',
            deliverables: [
                'Outward supply summary',
                'Inward supply (RCM) liability',
                'ITC available from GSTR-2B',
                'ITC utilization in proper order',
                'Tax liability computation',
                'Cash ledger balance check',
                'GSTR-3B filing',
                'Payment challan generation'
            ]
        },
        {
            code: 'GSTR_4',
            name: 'GSTR-4',
            applicableTo: 'Composition Return',
            dueDateReference: '18th Quarterly',
            deliverables: [
                'Turnover details for quarter',
                'Tax at composition rate (1-6%)',
                'Inward supplies (RCM if any)',
                'CMP-08 challan payment',
                'GSTR-4 quarterly filing',
                'Annual return (CMP-02)'
            ]
        },
        {
            code: 'GSTR_9',
            name: 'GSTR-9',
            applicableTo: 'Annual Return',
            dueDateReference: 'December 31',
            deliverables: [
                'GSTR-1 vs GSTR-3B reconciliation',
                'Part-wise data compilation',
                'Amendments of previous FY',
                'HSN-wise outward summary',
                'HSN-wise inward summary',
                'ITC reconciliation',
                'GSTR-9 e-filing',
                'Acknowledgment receipt'
            ]
        },
        {
            code: 'GSTR_9C',
            name: 'GSTR-9C',
            applicableTo: 'Reconciliation Statement (>₹5Cr)',
            dueDateReference: 'December 31',
            deliverables: [
                'Turnover as per books vs GST',
                'Tax paid reconciliation',
                'ITC claimed vs eligible',
                'Unreconciled differences',
                'Auditor certification (self)',
                'Additional liability (if any)',
                'GSTR-9C filing',
                'Payment of differential tax'
            ]
        },
    ],
    GST_COMPLIANCE: [
        {
            code: 'ITC_RECONCILIATION',
            name: 'ITC Reconciliation',
            applicableTo: 'Match purchases with GSTR-2B',
            deliverables: [
                'Purchase register download',
                'GSTR-2B download from portal',
                'Invoice-wise matching',
                'Mismatch identification',
                'Vendor follow-up for corrections',
                'ITC reversal computation',
                'Reconciliation report',
                'Action items for vendors'
            ]
        },
        {
            code: 'EWAY_BILL',
            name: 'E-Way Bill',
            applicableTo: 'Goods movement > ₹50,000',
            deliverables: [
                'Consignment details',
                'Transporter ID entry',
                'Vehicle number update',
                'EWB generation on portal',
                'Print & share with transporter',
                'Extension if required',
                'Cancellation (within 24 hrs)',
                'Multi-vehicle entry if consolidated'
            ]
        },
        {
            code: 'EINVOICING',
            name: 'E-Invoicing',
            applicableTo: 'Mandatory for turnover > ₹5Cr',
            deliverables: [
                'Invoice JSON preparation',
                'IRP portal submission',
                'IRN generation',
                'QR code on invoice',
                'Signed invoice download',
                'E-Way Bill auto-generation',
                'Cancellation (within 24 hrs)',
                'Monthly summary report'
            ]
        },
        {
            code: 'LUT_FILING',
            name: 'LUT Filing',
            applicableTo: 'Letter of Undertaking for exporters',
            deliverables: [
                'Export eligibility verification',
                'Previous LUT compliance check',
                'GST RFD-11 preparation',
                'LUT submission on portal',
                'LUT approval download',
                'Annual renewal reminder'
            ]
        },
        {
            code: 'GST_REFUND',
            name: 'Refund Claims',
            applicableTo: 'Export refund, Inverted duty refund',
            deliverables: [
                'Refund eligibility assessment',
                'Calculation (unutilized ITC/export)',
                'Statement-2 preparation',
                'GST RFD-01 filing',
                'Deficiency memo response',
                'SCN reply if issued',
                'Refund tracking',
                'Bank credit confirmation'
            ]
        },
        {
            code: 'GST_AMENDMENT',
            name: 'Registration Amendment',
            applicableTo: 'GST registration amendments',
            deliverables: [
                'Amendment type identification',
                'Supporting documents',
                'GST REG-14 filing',
                'Approval tracking',
                'Updated GSTIN certificate'
            ]
        },
        {
            code: 'GST_CANCELLATION',
            name: 'Cancellation',
            applicableTo: 'GST cancellation on business closure',
            deliverables: [
                'Final GSTR-3B filing',
                'Stock declaration',
                'ITC reversal on stock',
                'GST REG-16 filing',
                'Final return (GSTR-10)',
                'Cancellation confirmation'
            ]
        },
        {
            code: 'GST_AUDIT',
            name: 'GST Audit',
            applicableTo: 'For turnover > ₹5Cr (GSTR-9C)',
            deliverables: [
                'Books verification',
                'GSTR-9 preparation',
                'GSTR-9C reconciliation',
                'Self-certification',
                'Additional tax computation',
                'Filing & payment'
            ]
        },
    ],
    COMPANY_INCORPORATION: [
        {
            code: 'PVT_LTD',
            name: 'Private Limited Company',
            applicableTo: 'Most common for startups and businesses',
            deliverables: [
                'Name availability search (RUN)',
                'DSC for all directors',
                'DIN generation',
                'MOA & AOA drafting (Table F)',
                'SPICe+ Part A (Name)',
                'SPICe+ Part B (Incorporation)',
                'PAN & TAN (auto via SPICe+)',
                'Certificate of Incorporation',
                'GSTIN application',
                'Bank account opening letter'
            ]
        },
        {
            code: 'PUBLIC_LTD',
            name: 'Public Limited Company',
            applicableTo: 'Larger companies seeking public funding',
            deliverables: [
                'Minimum 7 shareholders check',
                'Minimum 3 directors',
                'Name search (Public Ltd)',
                'DSC & DIN for all directors',
                'MOA & AOA (wider objects)',
                'SPICe+ filing',
                'COI issuance',
                'Stock exchange compliance prep'
            ]
        },
        {
            code: 'OPC',
            name: 'One Person Company',
            applicableTo: 'Single owner companies',
            deliverables: [
                'Single shareholder/director check',
                'Nominee declaration (INC-3)',
                'DSC & DIN generation',
                'MOA & AOA (OPC format)',
                'SPICe+ with OPC type',
                'COI with OPC suffix',
                'Annual compliance briefing'
            ]
        },
        {
            code: 'LLP',
            name: 'Limited Liability Partnership',
            applicableTo: 'Professionals and small businesses',
            deliverables: [
                'Name reservation (RUN-LLP)',
                'DPIN for all partners',
                'LLP Agreement drafting',
                'FiLLiP form filing',
                'COI issuance (LLPIN)',
                'Partner capital contribution',
                'PAN & TAN application'
            ]
        },
        {
            code: 'SECTION_8',
            name: 'Section 8 Company (NGO)',
            applicableTo: 'Non-profit organizations',
            deliverables: [
                'Objects verification (charitable)',
                'License application (INC-12)',
                'Name with Foundation/Association',
                'MOA & AOA (Section 8 format)',
                'ROC approval processing',
                'License under Section 8',
                'COI issuance',
                '80G & 12A application guidance'
            ]
        },
    ],
    ROC_ANNUAL: [
        {
            code: 'AOC_4',
            name: 'AOC-4 (Financial Statements)',
            applicableTo: 'All companies',
            dueDateReference: '30 days from AGM',
            deliverables: [
                'Audited financial statements',
                'Directors Report attachment',
                'Auditors Report attachment',
                'Board resolution for approval',
                'AOC-4/AOC-4 CFS preparation',
                'Digital signature & certification',
                'MCA portal filing',
                'SRN & challan receipt'
            ]
        },
        {
            code: 'MGT_7',
            name: 'MGT-7/7A (Annual Return)',
            applicableTo: 'All companies',
            dueDateReference: '60 days from AGM',
            deliverables: [
                'Shareholding pattern',
                'Director details verification',
                'Indebtedness statement',
                'Transfer of shares summary',
                'CS certification (if applicable)',
                'MGT-7/7A preparation',
                'MCA portal filing',
                'SRN confirmation'
            ]
        },
        {
            code: 'ADT_1',
            name: 'ADT-1 (Auditor Appointment)',
            applicableTo: 'All companies',
            dueDateReference: '15 days from AGM',
            deliverables: [
                'Auditor consent letter',
                'Auditor eligibility check',
                'Board/AGM resolution',
                'ADT-1 form preparation',
                'MCA portal filing',
                'Appointment confirmation'
            ]
        },
        {
            code: 'DIR_3_KYC',
            name: 'DIR-3 KYC (Director KYC)',
            applicableTo: 'All directors',
            dueDateReference: 'September 30',
            deliverables: [
                'Director personal details',
                'Mobile & email verification',
                'Aadhaar/PAN linkage',
                'DIR-3 KYC/web form',
                'OTP verification',
                'KYC confirmation',
                'DIN status update'
            ]
        },
        {
            code: 'DPT_3',
            name: 'DPT-3 (Deposit Return)',
            applicableTo: 'Companies accepting deposits',
            dueDateReference: 'June 30',
            deliverables: [
                'Deposit/loan classification',
                'Outstanding amount details',
                'Interest payment compliance',
                'DPT-3 form preparation',
                'Auditor certification',
                'MCA portal filing'
            ]
        },
        {
            code: 'MSME_1',
            name: 'MSME-1 (MSME Outstanding)',
            applicableTo: 'Companies with MSME payments',
            dueDateReference: 'Half-yearly',
            deliverables: [
                'MSME vendor identification',
                'Outstanding dues summary',
                'Reason for delay',
                'MSME-1 form preparation',
                'MCA portal filing',
                'Payment plan documentation'
            ]
        },
    ],
    ROC_EVENT: [
        {
            code: 'DIR_12',
            name: 'DIR-12 (Director Change)',
            applicableTo: 'Director Appointment/Resignation',
            dueDateReference: '30 days',
            deliverables: [
                'Board resolution',
                'Director consent (DIR-2)',
                'DIN verification',
                'DIR-12 form preparation',
                'MCA portal filing',
                'Updated master data'
            ]
        },
        {
            code: 'SH_4',
            name: 'SH-4 (Share Transfer)',
            applicableTo: 'Transfer of shares',
            dueDateReference: '60 days',
            deliverables: [
                'Share transfer deed',
                'Board approval',
                'Stamp duty payment',
                'SH-4 form preparation',
                'MCA portal filing',
                'Updated register of members'
            ]
        },
        {
            code: 'SH_7',
            name: 'SH-7 (Capital Increase)',
            applicableTo: 'Increase in authorized capital',
            dueDateReference: '30 days',
            deliverables: [
                'Board resolution',
                'EGM/member approval',
                'Amended MOA/AOA',
                'SH-7 form preparation',
                'Stamp duty calculation',
                'MCA portal filing',
                'Updated COI'
            ]
        },
        {
            code: 'INC_22',
            name: 'INC-22 (Office Change)',
            applicableTo: 'Change in Registered Office',
            dueDateReference: '30 days',
            deliverables: [
                'New address proof',
                'NOC from landlord',
                'Board resolution',
                'INC-22 form preparation',
                'MCA portal filing',
                'Updated master data',
                'GST address amendment'
            ]
        },
        {
            code: 'CHG_1',
            name: 'CHG-1 (Charge Creation/Modification)',
            applicableTo: 'Charge creation or modification',
            dueDateReference: '30 days',
            deliverables: [
                'Loan/security agreement',
                'Charge holder details',
                'Property details',
                'CHG-1 form preparation',
                'MCA portal filing',
                'Charge registration certificate'
            ]
        },
        {
            code: 'CHG_4',
            name: 'CHG-4 (Charge Satisfaction)',
            applicableTo: 'Charge satisfaction',
            dueDateReference: '30 days',
            deliverables: [
                'No dues certificate from bank',
                'Board resolution',
                'CHG-4 form preparation',
                'MCA portal filing',
                'Charge satisfaction certificate'
            ]
        },
    ],
    FEMA_COMPLIANCE: [
        {
            code: 'FC_GPR',
            name: 'FC-GPR',
            applicableTo: 'Foreign investment reporting',
            deliverables: [
                'FDI transaction verification',
                'Sectoral cap compliance',
                'Pricing guidelines check',
                'Valuation report (if applicable)',
                'FC-GPR filing on FIRMS portal',
                'AD bank acknowledgment',
                'RBI reporting confirmation'
            ]
        },
        {
            code: 'FC_TRS',
            name: 'FC-TRS',
            applicableTo: 'Transfer of shares to non-resident',
            deliverables: [
                'Share transfer agreement',
                'Fair value determination',
                'FEMA pricing compliance',
                'FC-TRS filing on FIRMS',
                'AD bank certification',
                'ROC intimation (SH-4)'
            ]
        },
        {
            code: 'ODI',
            name: 'ODI Filing',
            applicableTo: 'Overseas Direct Investment',
            deliverables: [
                'ODI eligibility check',
                'Net worth verification',
                'Form ODI Part I',
                'RBI approval (if required)',
                'Annual Performance Report',
                'Disinvestment reporting'
            ]
        },
        {
            code: 'ECB',
            name: 'ECB Filing',
            applicableTo: 'External Commercial Borrowing',
            deliverables: [
                'ECB eligibility verification',
                'All-in-cost ceiling check',
                'Loan agreement review',
                'Form ECB filing',
                'Loan Registration Number',
                'Monthly ECB-2 return'
            ]
        },
    ],
    STARTUP_SERVICES: [
        {
            code: 'DPIIT_REG',
            name: 'DPIIT Registration',
            applicableTo: 'Startup India registration',
            deliverables: [
                'Eligibility assessment (< 10 years, < ₹100Cr)',
                'Innovation documentation',
                'Certificate of Incorporation',
                'Brief write-up on innovation',
                'Application on Startup India portal',
                'Recognition certificate',
                'Self-certification benefits'
            ]
        },
        {
            code: '80IAC_CERT',
            name: '80IAC Certification',
            applicableTo: 'Tax exemption for startups',
            deliverables: [
                'DPIIT recognition prerequisite',
                'Application to IMB',
                'Innovation verification docs',
                'Employment/revenue potential',
                '80IAC approval certificate',
                '3-year tax holiday activation'
            ]
        },
        {
            code: 'ANGEL_TAX_EXEMPTION',
            name: 'Angel Tax Exemption',
            applicableTo: 'Section 56(2)(viib) exemption',
            deliverables: [
                'DPIIT recognition',
                'Investor details & PAN',
                'Aggregate investment check (< ₹25Cr)',
                'Form 2 (Schedule III) filing',
                'CBDT notification compliance',
                'Exemption confirmation'
            ]
        },
        {
            code: 'SEED_FUND',
            name: 'Seed Fund Application',
            applicableTo: 'Startup India Seed Fund',
            deliverables: [
                'DPIIT recognition',
                'Incubator empanelment check',
                'Business plan & pitch deck',
                'Fund utilization plan',
                'Application submission',
                'Due diligence support',
                'Fund disbursement tracking'
            ]
        },
    ],
    TRADEMARK: [
        {
            code: 'TM_REGISTRATION',
            name: 'Trademark Registration',
            applicableTo: 'New trademark registration',
            deliverables: [
                'TM search & availability check',
                'Class identification (Nice)',
                'Logo/Wordmark finalization',
                'TM-A application drafting',
                'IP India portal filing',
                'Vienna codification (logo)',
                'Examination report response',
                'Journal publication',
                'Opposition handling (if any)',
                'Registration certificate'
            ]
        },
        {
            code: 'TM_RENEWAL',
            name: 'Trademark Renewal',
            applicableTo: 'Every 10 years renewal',
            deliverables: [
                'Registration validity check',
                'Renewal reminder (6 months before)',
                'TM-R application filing',
                'Renewal fee payment',
                'Updated registration certificate'
            ]
        },
        {
            code: 'COPYRIGHT_REG',
            name: 'Copyright Registration',
            applicableTo: 'Copyright protection',
            deliverables: [
                'Work categorization',
                'Author/creator details',
                'Statement of originality',
                'Copyright application filing',
                'Copyright Office processing',
                'Registration certificate'
            ]
        },
        {
            code: 'PATENT_FILING',
            name: 'Patent Filing',
            applicableTo: 'Patent application',
            deliverables: [
                'Patentability assessment',
                'Prior art search',
                'Patent specification drafting',
                'Claims drafting',
                'Patent application filing',
                'Publication (18 months)',
                'Examination request',
                'FER response',
                'Grant of patent'
            ]
        },
    ],
    IMPORT_EXPORT: [
        {
            code: 'IEC_REG',
            name: 'IEC Registration',
            applicableTo: 'Import Export Code registration',
            deliverables: [
                'PAN verification',
                'Bank account proof',
                'Business address proof',
                'DGFT portal registration',
                'IEC application filing',
                'Digital IEC certificate'
            ]
        },
        {
            code: 'DGFT_FILING',
            name: 'DGFT Filings',
            applicableTo: 'Export incentive claims',
            deliverables: [
                'Shipping bill verification',
                'MEIS/RoDTEP calculation',
                'Scrip application',
                'DGFT portal filing',
                'Scrip credit to account',
                'Utilization/transfer'
            ]
        },
        {
            code: 'CUSTOMS_COMPLIANCE',
            name: 'Customs Compliance',
            applicableTo: 'Customs documentation and compliance',
            deliverables: [
                'HS code classification',
                'Duty calculation',
                'Bill of Entry preparation',
                'Shipping Bill preparation',
                'Customs clearance support',
                'IGST refund tracking'
            ]
        },
    ],
};

// Document Requirements by Service Type
interface DocReq {
    documentName: string;
    category: string;
    isMandatory: boolean;
    description?: string;
}

const documentRequirements: Record<string, DocReq[]> = {
    ITR_FILING: [
        { documentName: 'PAN Card', category: 'Identity', isMandatory: true },
        { documentName: 'Aadhar Card', category: 'Identity', isMandatory: true },
        { documentName: 'Bank Statements (all accounts)', category: 'Financial', isMandatory: true },
        { documentName: 'Previous Year ITR', category: 'Tax', isMandatory: false },
    ],
    ITR_1: [
        { documentName: 'Form 16 (from employer)', category: 'Tax', isMandatory: true, description: 'TDS Certificate from employer' },
        { documentName: 'Investment Proofs (80C, 80D, 80E)', category: 'Tax', isMandatory: false },
        { documentName: 'Rent Receipts (if HRA claimed)', category: 'Financial', isMandatory: false },
        { documentName: 'Home Loan Certificate', category: 'Financial', isMandatory: false },
    ],
    ITR_3: [
        { documentName: 'Profit & Loss Account', category: 'Financial', isMandatory: true },
        { documentName: 'Balance Sheet', category: 'Financial', isMandatory: true },
        { documentName: 'GST Returns (all months)', category: 'Tax', isMandatory: false },
        { documentName: 'Stock Statement', category: 'Financial', isMandatory: false },
    ],
    GST_REGISTRATION: [
        { documentName: 'PAN Card', category: 'Identity', isMandatory: true },
        { documentName: 'Aadhar Card', category: 'Identity', isMandatory: true },
        { documentName: 'Passport Photo', category: 'Identity', isMandatory: true },
        { documentName: 'Business Address Proof', category: 'Business', isMandatory: true },
        { documentName: 'Bank Statement / Cancelled Cheque', category: 'Financial', isMandatory: true },
    ],
    GST_RETURN: [
        { documentName: 'Sales Register (with HSN)', category: 'Financial', isMandatory: true },
        { documentName: 'Purchase Register (with GSTIN)', category: 'Financial', isMandatory: true },
        { documentName: 'Credit/Debit Notes', category: 'Financial', isMandatory: false },
    ],
    TDS_RETURN: [
        { documentName: 'TAN', category: 'Tax', isMandatory: true },
        { documentName: 'Deductee PAN details', category: 'Tax', isMandatory: true },
        { documentName: 'Payment details with dates', category: 'Financial', isMandatory: true },
        { documentName: 'TDS Challan details', category: 'Tax', isMandatory: true },
    ],
    TAX_AUDIT: [
        { documentName: 'Books of Accounts', category: 'Financial', isMandatory: true },
        { documentName: 'Bank Statements (full year)', category: 'Financial', isMandatory: true },
        { documentName: 'Stock Records', category: 'Financial', isMandatory: true },
        { documentName: 'TDS/TCS Certificates', category: 'Tax', isMandatory: true },
    ],
    ROC_ANNUAL: [
        { documentName: 'Audited Financial Statements', category: 'Financial', isMandatory: true },
        { documentName: 'Director Details', category: 'Business', isMandatory: true },
        { documentName: 'Shareholding Pattern', category: 'Business', isMandatory: true },
        { documentName: 'Minutes of AGM', category: 'Business', isMandatory: true },
    ],
    COMPANY_INCORPORATION: [
        { documentName: 'Digital Signature (DSC)', category: 'Identity', isMandatory: true },
        { documentName: 'Director PAN Cards', category: 'Identity', isMandatory: true },
        { documentName: 'Director Aadhar Cards', category: 'Identity', isMandatory: true },
        { documentName: 'Registered Office Proof', category: 'Business', isMandatory: true },
        { documentName: 'NOC from Owner', category: 'Business', isMandatory: true },
    ],
};

async function seedServiceConfig() {
    console.log('🌱 Starting service configuration seeding...\n');

    // Clear existing data (system defaults only)
    console.log('🧹 Clearing existing system defaults...');
    await prisma.documentRequirement.deleteMany({ where: { firmId: null } });
    await prisma.serviceSubType.deleteMany({ where: { firmId: null } });
    await prisma.serviceTypeMaster.deleteMany({ where: { firmId: null } });
    await prisma.serviceCategory.deleteMany({ where: { firmId: null } });

    // Create categories
    console.log('\n📁 Creating service categories...');
    const categoryMap: Record<string, string> = {};

    for (const cat of categories) {
        const created = await prisma.serviceCategory.create({
            data: {
                code: cat.code,
                name: cat.name,
                icon: cat.icon,
                displayOrder: cat.displayOrder,
                firmId: null,
            },
        });
        categoryMap[cat.code] = created.id;
        console.log(`  ✓ ${cat.name}`);
    }

    // Create service types
    console.log('\n📋 Creating service types...');
    const serviceTypeMap: Record<string, string> = {};

    for (const [categoryCode, types] of Object.entries(serviceTypes)) {
        const categoryId = categoryMap[categoryCode];

        if (!categoryId) {
            console.log(`  ⚠️ Category ${categoryCode} not found, skipping types`);
            continue;
        }

        for (const type of types) {
            const created = await prisma.serviceTypeMaster.create({
                data: {
                    categoryId: categoryId as string,
                    code: type.code,
                    name: type.name,
                    description: type.description,
                    frequency: type.frequency,
                    deliverables: type.deliverables || [],
                    hasSubTypes: type.hasSubTypes,
                    requiresFinancialYear: type.requiresFinancialYear,
                    requiresAssessmentYear: type.requiresAssessmentYear || false,
                    requiresQuarter: type.requiresQuarter || false,
                    requiresPeriod: type.requiresPeriod || false,
                    defaultDueDate: type.defaultDueDate,
                    displayOrder: type.displayOrder,
                    firmId: null,
                },
            });
            serviceTypeMap[type.code] = created.id;
            console.log(`  ✓ ${type.name}`);
        }
    }

    // Create sub-types
    console.log('\n📄 Creating service sub-types...');
    const subTypeMap: Record<string, string> = {};

    for (const [serviceTypeCode, subs] of Object.entries(subTypes)) {
        const serviceTypeId = serviceTypeMap[serviceTypeCode];
        if (!serviceTypeId) continue;

        let order = 1;
        for (const sub of subs) {
            const created = await prisma.serviceSubType.create({
                data: {
                    serviceTypeId,
                    code: sub.code,
                    name: sub.name,
                    applicableTo: sub.applicableTo,
                    dueDateReference: sub.dueDateReference,
                    deliverables: sub.deliverables || [],
                    displayOrder: order++,
                    firmId: null,
                },
            });
            subTypeMap[sub.code] = created.id;
            console.log(`  ✓ ${sub.name}`);
        }
    }

    // Create document requirements
    console.log('\n📎 Creating document requirements...');

    for (const [typeCode, docs] of Object.entries(documentRequirements)) {
        const serviceTypeId = serviceTypeMap[typeCode];
        const serviceSubTypeId = subTypeMap[typeCode];

        if (!serviceTypeId && !serviceSubTypeId) {
            console.log(`  ⚠ Skipping ${typeCode} - not found`);
            continue;
        }

        let order = 1;
        for (const doc of docs) {
            // Find the parent service type for subtypes
            let parentServiceTypeId = serviceTypeId;
            if (!parentServiceTypeId && serviceSubTypeId) {
                const parentKey = Object.keys(subTypes).find(k =>
                    subTypes[k]?.some(s => s.code === typeCode)
                );
                if (parentKey) {
                    parentServiceTypeId = serviceTypeMap[parentKey] || '';
                }
            }

            await prisma.documentRequirement.create({
                data: {
                    serviceTypeId: parentServiceTypeId || '',
                    serviceSubTypeId: serviceSubTypeId || null,
                    documentName: doc.documentName,
                    description: doc.description,
                    category: doc.category,
                    isMandatory: doc.isMandatory,
                    displayOrder: order++,
                    firmId: null,
                },
            });
        }
        console.log(`  ✓ ${docs.length} documents for ${typeCode}`);
    }

    console.log('\n✅ Service configuration seeding complete!');

    // Summary
    const catCount = await prisma.serviceCategory.count({ where: { firmId: null } });
    const typeCount = await prisma.serviceTypeMaster.count({ where: { firmId: null } });
    const subCount = await prisma.serviceSubType.count({ where: { firmId: null } });
    const docCount = await prisma.documentRequirement.count({ where: { firmId: null } });

    console.log(`\n📊 Summary:`);
    console.log(`   Categories: ${catCount}`);
    console.log(`   Service Types: ${typeCount}`);
    console.log(`   Sub-Types: ${subCount}`);
    console.log(`   Document Requirements: ${docCount}`);
}

// Run the seed
seedServiceConfig()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
