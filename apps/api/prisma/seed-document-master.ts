// ============================================
// UNIVERSAL DOCUMENT LIBRARY SEED SCRIPT
// ============================================
// This script seeds the DocumentMaster table with all possible documents
// that can be required for any CA/Tax/Compliance service in India
// NOW INCLUDES PURPOSES for multi-purpose document matching

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Universal Document Library - All possible documents with PURPOSES
const documentLibrary = [
    // ============================================
    // IDENTITY DOCUMENTS
    // ============================================
    {
        code: 'PAN_CARD',
        name: 'PAN Card',
        category: 'Identity',
        purposes: ['Identity', 'Tax', 'KYC', 'Name Proof', 'Financial'],
        description: 'Permanent Account Number card issued by Income Tax Department',
        displayOrder: 1
    },
    {
        code: 'AADHAR_CARD',
        name: 'Aadhar Card',
        category: 'Identity',
        purposes: ['Identity', 'Address Proof', 'KYC', 'Age Proof', 'Photo ID', 'DOB Proof'],
        description: 'Unique Identification Number issued by UIDAI',
        displayOrder: 2
    },
    {
        code: 'PASSPORT',
        name: 'Passport',
        category: 'Identity',
        purposes: ['Identity', 'Address Proof', 'Photo ID', 'DOB Proof', 'Travel', 'Name Proof'],
        description: 'For NRI/foreign income cases or identity verification',
        displayOrder: 3
    },
    {
        code: 'VOTER_ID',
        name: 'Voter ID Card',
        category: 'Identity',
        purposes: ['Identity', 'Address Proof', 'Age Proof', 'Photo ID'],
        description: 'Voter identity card for address/identity proof',
        displayOrder: 4
    },
    {
        code: 'DRIVING_LICENSE',
        name: 'Driving License',
        category: 'Identity',
        purposes: ['Identity', 'Address Proof', 'Photo ID', 'Age Proof'],
        description: 'Valid driving license for identity proof',
        displayOrder: 5
    },
    {
        code: 'DSC',
        name: 'Digital Signature Certificate',
        category: 'Identity',
        purposes: ['Identity', 'Digital Signing', 'E-Filing'],
        description: 'Class 2/3 DSC for e-filing and digital signing',
        displayOrder: 6
    },
    {
        code: 'PASSPORT_PHOTO',
        name: 'Passport Size Photos',
        category: 'Identity',
        purposes: ['Photo ID', 'Identity'],
        description: 'Recent passport size photographs',
        displayOrder: 7
    },

    // ============================================
    // FINANCIAL DOCUMENTS
    // ============================================
    {
        code: 'BANK_STATEMENTS',
        name: 'Bank Statements (all accounts)',
        category: 'Financial',
        purposes: ['Financial', 'Address Proof', 'Income Proof', 'Transaction Proof', 'Bank Proof'],
        description: 'Bank statements for all savings/current accounts',
        displayOrder: 10
    },
    {
        code: 'BANK_STATEMENTS_BUSINESS',
        name: 'Bank Statements (Business accounts)',
        category: 'Financial',
        purposes: ['Financial', 'Business', 'Income Proof', 'Transaction Proof'],
        description: 'Business/Current account statements',
        displayOrder: 11
    },
    {
        code: 'CANCELLED_CHEQUE',
        name: 'Cancelled Cheque',
        category: 'Financial',
        purposes: ['Financial', 'Bank Proof', 'Account Verification'],
        description: 'For bank account verification',
        displayOrder: 12
    },
    {
        code: 'PROFIT_LOSS',
        name: 'Profit & Loss Account',
        category: 'Financial',
        purposes: ['Financial', 'Business', 'Income Proof', 'Tax'],
        description: 'P&L statement for business income',
        displayOrder: 13
    },
    {
        code: 'BALANCE_SHEET',
        name: 'Balance Sheet',
        category: 'Financial',
        purposes: ['Financial', 'Business', 'Audit'],
        description: 'Balance sheet with all schedules',
        displayOrder: 14
    },
    {
        code: 'CASH_FLOW',
        name: 'Cash Flow Statement',
        category: 'Financial',
        purposes: ['Financial', 'Business', 'Audit'],
        description: 'Cash flow statement for companies',
        displayOrder: 15
    },
    {
        code: 'TRIAL_BALANCE',
        name: 'Trial Balance',
        category: 'Financial',
        purposes: ['Financial', 'Audit', 'Accounting'],
        description: 'Trial balance for accounting verification',
        displayOrder: 16
    },
    {
        code: 'STOCK_STATEMENT',
        name: 'Stock Statement',
        category: 'Financial',
        purposes: ['Financial', 'Business', 'Inventory'],
        description: 'Inventory/stock details as on date',
        displayOrder: 17
    },
    {
        code: 'FIXED_ASSET_REGISTER',
        name: 'Fixed Asset Register',
        category: 'Financial',
        purposes: ['Financial', 'Business', 'Tax', 'Depreciation'],
        description: 'Register of all fixed assets with depreciation',
        displayOrder: 18
    },
    {
        code: 'LOAN_DOCUMENTS',
        name: 'Loan Documents',
        category: 'Financial',
        purposes: ['Financial', 'Loan', 'Liability'],
        description: 'All loan agreements and sanction letters',
        displayOrder: 19
    },
    {
        code: 'HOME_LOAN_CERTIFICATE',
        name: 'Home Loan Interest Certificate',
        category: 'Financial',
        purposes: ['Financial', 'Tax', 'Loan', 'Deduction Proof'],
        description: 'Certificate for Section 24/80EE deduction',
        displayOrder: 20
    },
    {
        code: 'EDUCATION_LOAN_CERTIFICATE',
        name: 'Education Loan Interest Certificate',
        category: 'Financial',
        purposes: ['Financial', 'Tax', 'Loan', 'Deduction Proof'],
        description: 'Certificate for Section 80E deduction',
        displayOrder: 21
    },
    {
        code: 'PROPERTY_DOCUMENTS',
        name: 'Property Documents',
        category: 'Financial',
        purposes: ['Financial', 'Property', 'Address Proof', 'Ownership Proof'],
        description: 'Property ownership/purchase documents',
        displayOrder: 22
    },
    {
        code: 'RENT_RECEIPTS',
        name: 'Rent Receipts',
        category: 'Financial',
        purposes: ['Financial', 'Address Proof', 'Tax', 'HRA Proof'],
        description: 'Monthly rent receipts for HRA exemption',
        displayOrder: 23
    },
    {
        code: 'RENT_AGREEMENT',
        name: 'Rent Agreement',
        category: 'Financial',
        purposes: ['Financial', 'Address Proof', 'Tax', 'HRA Proof', 'Legal'],
        description: 'Rental agreement for HRA/deduction claims',
        displayOrder: 24
    },
    {
        code: 'DEBTORS_LIST',
        name: 'Debtors/Receivables List',
        category: 'Financial',
        purposes: ['Financial', 'Business', 'Audit'],
        description: 'List of trade receivables',
        displayOrder: 25
    },
    {
        code: 'CREDITORS_LIST',
        name: 'Creditors/Payables List',
        category: 'Financial',
        purposes: ['Financial', 'Business', 'Audit'],
        description: 'List of trade payables',
        displayOrder: 26
    },

    // ============================================
    // TAX DOCUMENTS
    // ============================================
    {
        code: 'FORM_16',
        name: 'Form 16 (from employer)',
        category: 'Tax',
        purposes: ['Tax', 'Income Proof', 'Employment Proof', 'TDS'],
        description: 'TDS certificate issued by employer for salary',
        displayOrder: 30
    },
    {
        code: 'FORM_16A',
        name: 'Form 16A',
        category: 'Tax',
        purposes: ['Tax', 'Income Proof', 'TDS'],
        description: 'TDS certificate for non-salary income',
        displayOrder: 31
    },
    {
        code: 'FORM_16B',
        name: 'Form 16B',
        category: 'Tax',
        purposes: ['Tax', 'Property', 'TDS', 'Capital Gains'],
        description: 'TDS certificate for property sale (Section 194IA)',
        displayOrder: 32
    },
    {
        code: 'FORM_16C',
        name: 'Form 16C',
        category: 'Tax',
        purposes: ['Tax', 'TDS', 'Rent'],
        description: 'TDS certificate for rent (Section 194IB)',
        displayOrder: 33
    },
    {
        code: 'FORM_26AS',
        name: 'Form 26AS',
        category: 'Tax',
        purposes: ['Tax', 'TDS', 'Tax Credit'],
        description: 'Annual Tax Credit Statement',
        displayOrder: 34
    },
    {
        code: 'AIS',
        name: 'Annual Information Statement (AIS)',
        category: 'Tax',
        purposes: ['Tax', 'Income Proof', 'Transaction Proof'],
        description: 'Comprehensive taxpayer information statement',
        displayOrder: 35
    },
    {
        code: 'TIS',
        name: 'Taxpayer Information Summary (TIS)',
        category: 'Tax',
        purposes: ['Tax', 'Summary'],
        description: 'Summary of taxpayer information',
        displayOrder: 36
    },
    {
        code: 'PREVIOUS_ITR',
        name: 'Previous Year ITR',
        category: 'Tax',
        purposes: ['Tax', 'Income Proof', 'Filing History'],
        description: 'Last year filed Income Tax Return',
        displayOrder: 37
    },
    {
        code: 'ITR_ACKNOWLEDGMENT',
        name: 'ITR Acknowledgment (ITR-V)',
        category: 'Tax',
        purposes: ['Tax', 'Filing Proof'],
        description: 'Previous filing acknowledgment receipt',
        displayOrder: 38
    },
    {
        code: 'INVESTMENT_PROOFS_80C',
        name: 'Investment Proofs - 80C',
        category: 'Tax',
        purposes: ['Tax', 'Deduction Proof', 'Investment'],
        description: 'PPF, ELSS, LIC, NSC, Sukanya, SCSS, etc.',
        displayOrder: 39
    },
    {
        code: 'INVESTMENT_PROOFS_80D',
        name: 'Health Insurance Premium (80D)',
        category: 'Tax',
        purposes: ['Tax', 'Deduction Proof', 'Insurance'],
        description: 'Medical insurance premium receipts',
        displayOrder: 40
    },
    {
        code: 'INVESTMENT_PROOFS_80E',
        name: 'Education Loan Interest (80E)',
        category: 'Tax',
        purposes: ['Tax', 'Deduction Proof', 'Loan'],
        description: 'Education loan interest certificate',
        displayOrder: 41
    },
    {
        code: 'INVESTMENT_PROOFS_80G',
        name: 'Donation Receipts (80G)',
        category: 'Tax',
        purposes: ['Tax', 'Deduction Proof', 'Donation'],
        description: 'Charitable donation receipts with 80G certificate',
        displayOrder: 42
    },
    {
        code: 'INVESTMENT_PROOFS_80TTA',
        name: 'Savings Interest (80TTA/80TTB)',
        category: 'Tax',
        purposes: ['Tax', 'Deduction Proof', 'Bank'],
        description: 'Bank interest certificates for deduction',
        displayOrder: 43
    },
    {
        code: 'TDS_CERTIFICATES',
        name: 'TDS Certificates (All)',
        category: 'Tax',
        purposes: ['Tax', 'TDS', 'Income Proof'],
        description: 'All TDS certificates received',
        displayOrder: 44
    },
    {
        code: 'ADVANCE_TAX_CHALLANS',
        name: 'Advance Tax Challans',
        category: 'Tax',
        purposes: ['Tax', 'Tax Payment', 'Challan'],
        description: 'Self-assessment/advance tax payment challans',
        displayOrder: 45
    },
    {
        code: 'TAN_CERTIFICATE',
        name: 'TAN Certificate',
        category: 'Tax',
        purposes: ['Tax', 'TDS', 'Identity'],
        description: 'Tax Deduction Account Number',
        displayOrder: 46
    },
    {
        code: 'TDS_PAYMENT_CHALLANS',
        name: 'TDS Payment Challans',
        category: 'Tax',
        purposes: ['Tax', 'TDS', 'Payment Proof'],
        description: 'Challan 281 for TDS payments',
        displayOrder: 47
    },
    {
        code: 'LOWER_TDS_CERTIFICATE',
        name: 'Lower TDS Certificate',
        category: 'Tax',
        purposes: ['Tax', 'TDS', 'Exemption'],
        description: 'Certificate for lower/nil TDS deduction',
        displayOrder: 48
    },

    // ============================================
    // GST DOCUMENTS
    // ============================================
    {
        code: 'GST_RETURNS',
        name: 'GST Returns (GSTR-1, 3B)',
        category: 'GST',
        purposes: ['GST', 'Tax', 'Compliance', 'Filing Proof'],
        description: 'All filed GST returns for the period',
        displayOrder: 50
    },
    {
        code: 'GSTR_2B',
        name: 'GSTR-2B',
        category: 'GST',
        purposes: ['GST', 'ITC', 'Tax Credit'],
        description: 'Auto-populated ITC statement',
        displayOrder: 51
    },
    {
        code: 'GSTIN_CERTIFICATE',
        name: 'GSTIN Certificate',
        category: 'GST',
        purposes: ['GST', 'Identity', 'Business', 'Registration Proof'],
        description: 'GST registration certificate',
        displayOrder: 52
    },
    {
        code: 'SALES_REGISTER',
        name: 'Sales Register (with HSN)',
        category: 'GST',
        purposes: ['GST', 'Business', 'Transaction Proof'],
        description: 'Sales register with HSN codes',
        displayOrder: 53
    },
    {
        code: 'PURCHASE_REGISTER',
        name: 'Purchase Register (with GSTIN)',
        category: 'GST',
        purposes: ['GST', 'Business', 'Transaction Proof', 'ITC'],
        description: 'Purchase register with supplier GSTIN',
        displayOrder: 54
    },
    {
        code: 'CREDIT_DEBIT_NOTES',
        name: 'Credit/Debit Notes',
        category: 'GST',
        purposes: ['GST', 'Business', 'Adjustment'],
        description: 'All credit and debit notes issued',
        displayOrder: 55
    },
    {
        code: 'EWAY_BILLS',
        name: 'E-way Bills',
        category: 'GST',
        purposes: ['GST', 'Transport', 'Goods Movement'],
        description: 'E-way bills for goods movement',
        displayOrder: 56
    },
    {
        code: 'ITC_REGISTER',
        name: 'Input Tax Credit Register',
        category: 'GST',
        purposes: ['GST', 'ITC', 'Tax Credit'],
        description: 'Register of all ITC claimed',
        displayOrder: 57
    },
    {
        code: 'EXPORT_DOCUMENTS',
        name: 'Export Documents',
        category: 'GST',
        purposes: ['GST', 'Export', 'Business'],
        description: 'Export invoices, shipping bills, BRC',
        displayOrder: 58
    },
    {
        code: 'LUT_BOND',
        name: 'Letter of Undertaking (LUT)',
        category: 'GST',
        purposes: ['GST', 'Export', 'Compliance'],
        description: 'LUT for zero-rated exports',
        displayOrder: 59
    },

    // ============================================
    // BUSINESS/COMPANY DOCUMENTS
    // ============================================
    {
        code: 'INCORPORATION_CERTIFICATE',
        name: 'Certificate of Incorporation',
        category: 'Business',
        purposes: ['Business', 'Identity', 'Legal', 'Registration Proof'],
        description: 'Company/LLP incorporation certificate',
        displayOrder: 60
    },
    {
        code: 'MOA_AOA',
        name: 'MOA / AOA',
        category: 'Business',
        purposes: ['Business', 'Legal', 'Company Constitution'],
        description: 'Memorandum & Articles of Association',
        displayOrder: 61
    },
    {
        code: 'PARTNERSHIP_DEED',
        name: 'Partnership Deed',
        category: 'Business',
        purposes: ['Business', 'Legal', 'Partnership'],
        description: 'Registered partnership deed',
        displayOrder: 62
    },
    {
        code: 'LLP_AGREEMENT',
        name: 'LLP Agreement',
        category: 'Business',
        purposes: ['Business', 'Legal', 'LLP'],
        description: 'Limited Liability Partnership Agreement',
        displayOrder: 63
    },
    {
        code: 'TRADE_LICENSE',
        name: 'Trade License',
        category: 'Business',
        purposes: ['Business', 'License', 'Compliance'],
        description: 'Municipal trade license',
        displayOrder: 64
    },
    {
        code: 'SHOP_ESTABLISHMENT',
        name: 'Shop & Establishment Certificate',
        category: 'Business',
        purposes: ['Business', 'License', 'Compliance', 'Address Proof'],
        description: 'Shop & Establishment registration',
        displayOrder: 65
    },
    {
        code: 'UDYAM_CERTIFICATE',
        name: 'Udyam Registration Certificate',
        category: 'Business',
        purposes: ['Business', 'MSME', 'Registration Proof'],
        description: 'MSME/Udyam registration',
        displayOrder: 66
    },
    {
        code: 'FSSAI_LICENSE',
        name: 'FSSAI License',
        category: 'Business',
        purposes: ['Business', 'License', 'Food Safety'],
        description: 'Food safety license (if applicable)',
        displayOrder: 67
    },
    {
        code: 'BOARD_RESOLUTION',
        name: 'Board Resolution',
        category: 'Business',
        purposes: ['Business', 'Corporate', 'Authorization'],
        description: 'Board meeting resolution',
        displayOrder: 68
    },
    {
        code: 'AGM_MINUTES',
        name: 'AGM Minutes',
        category: 'Business',
        purposes: ['Business', 'Corporate', 'Compliance'],
        description: 'Annual General Meeting minutes',
        displayOrder: 69
    },
    {
        code: 'EGM_MINUTES',
        name: 'EGM Minutes',
        category: 'Business',
        purposes: ['Business', 'Corporate', 'Compliance'],
        description: 'Extra-ordinary General Meeting minutes',
        displayOrder: 70
    },
    {
        code: 'DIRECTOR_DETAILS',
        name: 'Director KYC Details',
        category: 'Business',
        purposes: ['Business', 'KYC', 'Identity', 'Corporate'],
        description: 'DIR-3 KYC documents for directors',
        displayOrder: 71
    },
    {
        code: 'SHAREHOLDER_DETAILS',
        name: 'Shareholding Pattern',
        category: 'Business',
        purposes: ['Business', 'Corporate', 'Ownership'],
        description: 'Current shareholding details',
        displayOrder: 72
    },
    {
        code: 'SHARE_CERTIFICATES',
        name: 'Share Certificates',
        category: 'Business',
        purposes: ['Business', 'Ownership', 'Investment'],
        description: 'Physical/demat share certificates',
        displayOrder: 73
    },
    {
        code: 'STATUTORY_REGISTERS',
        name: 'Statutory Registers',
        category: 'Business',
        purposes: ['Business', 'Compliance', 'Corporate'],
        description: 'Register of members, directors, charges',
        displayOrder: 74
    },
    {
        code: 'AUDITOR_APPOINTMENT',
        name: 'Auditor Appointment Letter',
        category: 'Business',
        purposes: ['Business', 'Audit', 'Compliance'],
        description: 'Auditor consent and appointment letter',
        displayOrder: 75
    },
    {
        code: 'AUDIT_REPORT',
        name: 'Audit Report',
        category: 'Business',
        purposes: ['Business', 'Audit', 'Financial'],
        description: 'Previous year audit report',
        displayOrder: 76
    },

    // ============================================
    // CAPITAL GAINS DOCUMENTS
    // ============================================
    {
        code: 'STOCK_TRADING_STATEMENT',
        name: 'Stock Trading Statement',
        category: 'Capital Gains',
        purposes: ['Capital Gains', 'Investment', 'Tax'],
        description: 'Statement from broker/depository',
        displayOrder: 80
    },
    {
        code: 'DEMAT_STATEMENT',
        name: 'Demat Account Statement',
        category: 'Capital Gains',
        purposes: ['Capital Gains', 'Investment', 'Holdings'],
        description: 'Holdings and transactions statement',
        displayOrder: 81
    },
    {
        code: 'MUTUAL_FUND_STATEMENT',
        name: 'Mutual Fund Statement (CAS)',
        category: 'Capital Gains',
        purposes: ['Capital Gains', 'Investment', 'Tax'],
        description: 'Consolidated Account Statement',
        displayOrder: 82
    },
    {
        code: 'PROPERTY_SALE_DEED',
        name: 'Property Sale Deed',
        category: 'Capital Gains',
        purposes: ['Capital Gains', 'Property', 'Tax', 'Legal'],
        description: 'Sale deed for property sold',
        displayOrder: 83
    },
    {
        code: 'PROPERTY_PURCHASE_DEED',
        name: 'Property Purchase Deed',
        category: 'Capital Gains',
        purposes: ['Capital Gains', 'Property', 'Tax', 'Legal', 'Ownership Proof'],
        description: 'Purchase deed for property acquired',
        displayOrder: 84
    },
    {
        code: 'STAMP_DUTY_RECEIPT',
        name: 'Stamp Duty Receipt',
        category: 'Capital Gains',
        purposes: ['Capital Gains', 'Property', 'Tax'],
        description: 'Stamp duty and registration receipt',
        displayOrder: 85
    },
    {
        code: 'CAPITAL_GAIN_STATEMENT',
        name: 'Capital Gain Computation',
        category: 'Capital Gains',
        purposes: ['Capital Gains', 'Tax', 'Computation'],
        description: 'Computation sheet for capital gains',
        displayOrder: 86
    },
    {
        code: 'COST_INFLATION_INDEX',
        name: 'Cost Inflation Index Details',
        category: 'Capital Gains',
        purposes: ['Capital Gains', 'Tax', 'Computation'],
        description: 'For indexed cost calculation',
        displayOrder: 87
    },
    {
        code: 'SEC_54_INVESTMENT',
        name: 'Section 54 Investment Proof',
        category: 'Capital Gains',
        purposes: ['Capital Gains', 'Tax', 'Exemption', 'Property'],
        description: 'New property purchase for 54/54F exemption',
        displayOrder: 88
    },
    {
        code: 'SEC_54EC_BONDS',
        name: 'Section 54EC Bonds',
        category: 'Capital Gains',
        purposes: ['Capital Gains', 'Tax', 'Exemption', 'Investment'],
        description: 'NHAI/REC bonds for LTCG exemption',
        displayOrder: 89
    },
    {
        code: 'CGAS',
        name: 'Capital Gains Account Scheme',
        category: 'Capital Gains',
        purposes: ['Capital Gains', 'Tax', 'Exemption'],
        description: 'CGAS statement if amount deposited',
        displayOrder: 90
    },

    // ============================================
    // PROFESSIONAL/FREELANCE DOCUMENTS
    // ============================================
    {
        code: 'PROFESSIONAL_RECEIPTS',
        name: 'Professional Fee Receipts',
        category: 'Professional',
        purposes: ['Professional', 'Income Proof', 'Tax'],
        description: 'Fee receipts issued to clients',
        displayOrder: 95
    },
    {
        code: 'CLIENT_CONTRACTS',
        name: 'Client Contracts/Agreements',
        category: 'Professional',
        purposes: ['Professional', 'Legal', 'Business'],
        description: 'Service agreements with clients',
        displayOrder: 96
    },
    {
        code: 'FREELANCE_INVOICES',
        name: 'Freelance Invoices',
        category: 'Professional',
        purposes: ['Professional', 'Income Proof', 'Tax'],
        description: 'Invoices issued for freelance work',
        displayOrder: 97
    },
    {
        code: 'EXPENSE_VOUCHERS',
        name: 'Business Expense Vouchers',
        category: 'Professional',
        purposes: ['Professional', 'Expense Proof', 'Tax'],
        description: 'Vouchers for business expenses claimed',
        displayOrder: 98
    },
    {
        code: 'PROFESSIONAL_TAX',
        name: 'Professional Tax Receipt',
        category: 'Professional',
        purposes: ['Professional', 'Tax', 'Deduction Proof'],
        description: 'Professional tax payment receipt',
        displayOrder: 99
    },

    // ============================================
    // ADDRESS/OFFICE PROOF
    // ============================================
    {
        code: 'ELECTRICITY_BILL',
        name: 'Electricity Bill',
        category: 'Address Proof',
        purposes: ['Address Proof', 'Utility', 'Residence Proof'],
        description: 'Recent electricity bill (within 3 months)',
        displayOrder: 100
    },
    {
        code: 'TELEPHONE_BILL',
        name: 'Telephone/Mobile Bill',
        category: 'Address Proof',
        purposes: ['Address Proof', 'Utility'],
        description: 'Recent telephone bill (within 3 months)',
        displayOrder: 101
    },
    {
        code: 'WATER_BILL',
        name: 'Water Bill',
        category: 'Address Proof',
        purposes: ['Address Proof', 'Utility'],
        description: 'Recent water bill (within 3 months)',
        displayOrder: 102
    },
    {
        code: 'NOC_LANDLORD',
        name: 'NOC from Landlord',
        category: 'Address Proof',
        purposes: ['Address Proof', 'Business', 'Authorization'],
        description: 'No Objection Certificate from landlord',
        displayOrder: 103
    },
    {
        code: 'OFFICE_ADDRESS_PROOF',
        name: 'Office Address Proof',
        category: 'Address Proof',
        purposes: ['Address Proof', 'Business', 'Office Proof'],
        description: 'Utility bill or ownership proof',
        displayOrder: 104
    },
    {
        code: 'OWNERSHIP_DEED',
        name: 'Property Ownership Deed',
        category: 'Address Proof',
        purposes: ['Address Proof', 'Ownership Proof', 'Property', 'Legal'],
        description: 'Sale deed/title deed of property',
        displayOrder: 105
    },

    // ============================================
    // FOREIGN INCOME/NRI DOCUMENTS
    // ============================================
    {
        code: 'FOREIGN_INCOME_DOCS',
        name: 'Foreign Income Documents',
        category: 'Foreign/NRI',
        purposes: ['Foreign/NRI', 'Income Proof', 'Tax'],
        description: 'Income proof from foreign sources',
        displayOrder: 110
    },
    {
        code: 'FOREIGN_TAX_CREDIT',
        name: 'Foreign Tax Credit Certificate',
        category: 'Foreign/NRI',
        purposes: ['Foreign/NRI', 'Tax', 'Tax Credit'],
        description: 'Tax paid abroad certificate',
        displayOrder: 111
    },
    {
        code: 'FEMA_COMPLIANCE',
        name: 'FEMA Compliance Documents',
        category: 'Foreign/NRI',
        purposes: ['Foreign/NRI', 'Compliance', 'Legal'],
        description: 'Documents for FEMA reporting',
        displayOrder: 112
    },
    {
        code: 'NRO_NRE_STATEMENTS',
        name: 'NRO/NRE Account Statements',
        category: 'Foreign/NRI',
        purposes: ['Foreign/NRI', 'Bank Proof', 'Financial'],
        description: 'NRO/NRE bank statements',
        displayOrder: 113
    },
    {
        code: 'RESIDENTIAL_STATUS',
        name: 'Residential Status Proof',
        category: 'Foreign/NRI',
        purposes: ['Foreign/NRI', 'Tax', 'Residency Proof'],
        description: 'Travel history/visa stamps',
        displayOrder: 114
    },
    {
        code: 'DTAA_CERTIFICATE',
        name: 'DTAA Certificate',
        category: 'Foreign/NRI',
        purposes: ['Foreign/NRI', 'Tax', 'Treaty'],
        description: 'Tax residency certificate for treaty benefits',
        displayOrder: 115
    },
    {
        code: 'FORM_15CA_15CB',
        name: 'Form 15CA/15CB',
        category: 'Foreign/NRI',
        purposes: ['Foreign/NRI', 'Remittance', 'Tax'],
        description: 'Foreign remittance certificates',
        displayOrder: 116
    },

    // ============================================
    // PAYROLL DOCUMENTS
    // ============================================
    {
        code: 'SALARY_REGISTER',
        name: 'Salary Register',
        category: 'Payroll',
        purposes: ['Payroll', 'Employment', 'Tax'],
        description: 'Monthly salary register of employees',
        displayOrder: 120
    },
    {
        code: 'EMPLOYEE_DETAILS',
        name: 'Employee PAN/Aadhar Details',
        category: 'Payroll',
        purposes: ['Payroll', 'KYC', 'Identity'],
        description: 'Employee identity details',
        displayOrder: 121
    },
    {
        code: 'INVESTMENT_DECLARATION',
        name: 'Form 12BB Investment Declaration',
        category: 'Payroll',
        purposes: ['Payroll', 'Tax', 'Deduction Proof'],
        description: 'Employee investment declaration form',
        displayOrder: 122
    },
    {
        code: 'PF_ESI_CHALLAN',
        name: 'PF/ESI Challans',
        category: 'Payroll',
        purposes: ['Payroll', 'Compliance', 'Statutory'],
        description: 'PF and ESI payment challans',
        displayOrder: 123
    },
    {
        code: 'BONUS_DETAILS',
        name: 'Bonus Payment Details',
        category: 'Payroll',
        purposes: ['Payroll', 'Employment', 'Tax'],
        description: 'Bonus/incentive payment records',
        displayOrder: 124
    },

    // ============================================
    // IMPORT/EXPORT DOCUMENTS
    // ============================================
    {
        code: 'IEC_CERTIFICATE',
        name: 'IEC Certificate',
        category: 'Import/Export',
        purposes: ['Import/Export', 'License', 'Business'],
        description: 'Import Export Code certificate',
        displayOrder: 130
    },
    {
        code: 'SHIPPING_BILL',
        name: 'Shipping Bill',
        category: 'Import/Export',
        purposes: ['Import/Export', 'Export', 'Customs'],
        description: 'Export shipping bill',
        displayOrder: 131
    },
    {
        code: 'BILL_OF_ENTRY',
        name: 'Bill of Entry',
        category: 'Import/Export',
        purposes: ['Import/Export', 'Import', 'Customs'],
        description: 'Import bill of entry',
        displayOrder: 132
    },
    {
        code: 'BRC',
        name: 'Bank Realisation Certificate (BRC)',
        category: 'Import/Export',
        purposes: ['Import/Export', 'Export', 'Bank Proof'],
        description: 'Certificate of export proceeds realisation',
        displayOrder: 133
    },
    {
        code: 'CUSTOMS_DUTY_CHALLAN',
        name: 'Customs Duty Challan',
        category: 'Import/Export',
        purposes: ['Import/Export', 'Customs', 'Payment Proof'],
        description: 'Customs duty payment receipt',
        displayOrder: 134
    },

    // ============================================
    // MISCELLANEOUS
    // ============================================
    {
        code: 'POWER_OF_ATTORNEY',
        name: 'Power of Attorney',
        category: 'Other',
        purposes: ['Other', 'Legal', 'Authorization'],
        description: 'POA for authorized representation',
        displayOrder: 140
    },
    {
        code: 'SIGNATURE_SPECIMEN',
        name: 'Signature Specimen',
        category: 'Other',
        purposes: ['Other', 'Identity', 'Verification'],
        description: 'Signature specimen for verification',
        displayOrder: 141
    },
    {
        code: 'AFFIDAVIT',
        name: 'Affidavit/Declaration',
        category: 'Other',
        purposes: ['Other', 'Legal', 'Declaration'],
        description: 'Sworn affidavit or declaration',
        displayOrder: 142
    },
    {
        code: 'OTHER_DOCUMENT',
        name: 'Other Document',
        category: 'Other',
        purposes: ['Other', 'Miscellaneous'],
        description: 'Any other relevant document',
        displayOrder: 143
    },
];

async function seedDocumentMaster() {
    console.log('🌱 Starting Universal Document Library seeding with PURPOSES...\n');

    // Clear existing data
    console.log('🧹 Clearing existing document master data...');
    await prisma.documentMaster.deleteMany({});

    // Seed documents
    console.log('📄 Creating documents with purposes...\n');

    let count = 0;
    for (const doc of documentLibrary) {
        await prisma.documentMaster.create({
            data: {
                code: doc.code,
                name: doc.name,
                category: doc.category,
                purposes: doc.purposes,
                description: doc.description,
                displayOrder: doc.displayOrder,
                isActive: true,
            },
        });
        count++;
    }

    console.log(`✅ Created ${count} documents in Universal Library with purposes\n`);

    // Summary by category
    const categories = await prisma.documentMaster.groupBy({
        by: ['category'],
        _count: { id: true },
        orderBy: { category: 'asc' },
    });

    console.log('📊 Summary by Category:');
    categories.forEach(cat => {
        console.log(`   ${cat.category}: ${cat._count.id} documents`);
    });

    console.log('\n✅ Universal Document Library seeding complete with PURPOSES!');
}

// Run the seed
seedDocumentMaster()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
