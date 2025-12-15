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
const serviceTypes = {
    INCOME_TAX: [
        {
            code: 'ITR_FILING',
            name: 'ITR Filing',
            hasSubTypes: true,
            requiresFinancialYear: true,
            requiresAssessmentYear: true,
            defaultDueDate: 'July 31',
            displayOrder: 1,
        },
        {
            code: 'TDS_RETURN',
            name: 'TDS Return',
            hasSubTypes: true,
            requiresFinancialYear: true,
            requiresQuarter: true,
            displayOrder: 2,
        },
        {
            code: 'ADVANCE_TAX',
            name: 'Advance Tax',
            hasSubTypes: false,
            requiresFinancialYear: true,
            displayOrder: 3,
        },
        {
            code: 'TAX_PLANNING',
            name: 'Tax Planning & Advisory',
            hasSubTypes: false,
            requiresFinancialYear: true,
            displayOrder: 4,
        },
    ],
    GST: [
        {
            code: 'GST_REGISTRATION',
            name: 'GST Registration',
            hasSubTypes: true,
            requiresFinancialYear: false,
            displayOrder: 1,
        },
        {
            code: 'GST_RETURN',
            name: 'GST Return',
            hasSubTypes: true,
            requiresFinancialYear: false,
            requiresPeriod: true,
            displayOrder: 2,
        },
        {
            code: 'GST_COMPLIANCE',
            name: 'GST Compliance Services',
            hasSubTypes: true,
            requiresFinancialYear: false,
            displayOrder: 3,
        },
    ],
    ROC_MCA: [
        {
            code: 'COMPANY_INCORPORATION',
            name: 'Company Incorporation',
            hasSubTypes: true,
            requiresFinancialYear: false,
            displayOrder: 1,
        },
        {
            code: 'ROC_ANNUAL',
            name: 'Annual ROC Filings',
            hasSubTypes: true,
            requiresFinancialYear: true,
            displayOrder: 2,
        },
        {
            code: 'ROC_EVENT',
            name: 'Event-Based Filings',
            hasSubTypes: true,
            requiresFinancialYear: false,
            displayOrder: 3,
        },
    ],
    AUDIT: [
        {
            code: 'STATUTORY_AUDIT',
            name: 'Statutory Audit',
            hasSubTypes: false,
            requiresFinancialYear: true,
            displayOrder: 1,
        },
        {
            code: 'TAX_AUDIT',
            name: 'Tax Audit (Section 44AB)',
            hasSubTypes: false,
            requiresFinancialYear: true,
            defaultDueDate: 'September 30',
            displayOrder: 2,
        },
        {
            code: 'GST_AUDIT',
            name: 'GST Audit',
            hasSubTypes: false,
            requiresFinancialYear: true,
            defaultDueDate: 'December 31',
            displayOrder: 3,
        },
        {
            code: 'INTERNAL_AUDIT',
            name: 'Internal Audit',
            hasSubTypes: false,
            requiresFinancialYear: true,
            displayOrder: 4,
        },
    ],
    PAYROLL: [
        {
            code: 'PAYROLL_PROCESSING',
            name: 'Payroll Processing',
            hasSubTypes: false,
            requiresFinancialYear: false,
            requiresPeriod: true,
            displayOrder: 1,
        },
        {
            code: 'PF_COMPLIANCE',
            name: 'PF Compliance (EPFO)',
            hasSubTypes: false,
            requiresFinancialYear: false,
            requiresPeriod: true,
            displayOrder: 2,
        },
        {
            code: 'ESI_COMPLIANCE',
            name: 'ESI Compliance (ESIC)',
            hasSubTypes: false,
            requiresFinancialYear: false,
            requiresPeriod: true,
            displayOrder: 3,
        },
        {
            code: 'PROFESSIONAL_TAX',
            name: 'Professional Tax',
            hasSubTypes: false,
            requiresFinancialYear: false,
            requiresPeriod: true,
            displayOrder: 4,
        },
    ],
    OTHER: [
        {
            code: 'FEMA_COMPLIANCE',
            name: 'FEMA Compliance',
            hasSubTypes: false,
            requiresFinancialYear: false,
            displayOrder: 1,
        },
        {
            code: 'STARTUP_SERVICES',
            name: 'Startup Services',
            hasSubTypes: false,
            requiresFinancialYear: false,
            displayOrder: 2,
        },
        {
            code: 'TRADEMARK',
            name: 'Trademark & IP',
            hasSubTypes: false,
            requiresFinancialYear: false,
            displayOrder: 3,
        },
        {
            code: 'IMPORT_EXPORT',
            name: 'Import/Export',
            hasSubTypes: false,
            requiresFinancialYear: false,
            displayOrder: 4,
        },
        {
            code: 'CONSULTATION',
            name: 'Consultation',
            hasSubTypes: false,
            requiresFinancialYear: false,
            displayOrder: 5,
        },
        {
            code: 'BOOK_KEEPING',
            name: 'Book Keeping',
            hasSubTypes: false,
            requiresFinancialYear: true,
            requiresPeriod: true,
            displayOrder: 6,
        },
    ],
};

// Sub-Types for services that need them
const subTypes = {
    ITR_FILING: [
        { code: 'ITR_1', name: 'ITR-1 (Sahaj)', applicableTo: 'Salaried (Income ≤ ₹50L), Resident Individual', dueDateReference: 'July 31' },
        { code: 'ITR_2', name: 'ITR-2', applicableTo: 'Individuals with Capital Gains, Foreign Income, Multiple House', dueDateReference: 'July 31' },
        { code: 'ITR_3', name: 'ITR-3', applicableTo: 'Individuals with Business/Profession Income', dueDateReference: 'July 31 or October 31 (Audit)' },
        { code: 'ITR_4', name: 'ITR-4 (Sugam)', applicableTo: 'Presumptive Taxation (Small Business/Profession)', dueDateReference: 'July 31' },
        { code: 'ITR_5', name: 'ITR-5', applicableTo: 'Partnership Firms, LLPs, AOPs, BOIs', dueDateReference: 'July 31 or October 31 (Audit)' },
        { code: 'ITR_6', name: 'ITR-6', applicableTo: 'Companies (except Sec 11)', dueDateReference: 'October 31' },
        { code: 'ITR_7', name: 'ITR-7', applicableTo: 'Trusts, Political Parties, Charitable Institutions', dueDateReference: 'October 31' },
    ],
    TDS_RETURN: [
        { code: '24Q', name: '24Q - TDS on Salary', applicableTo: 'Employers deducting TDS from salary', dueDateReference: 'Quarterly - 31st of month after quarter' },
        { code: '26Q', name: '26Q - TDS on Non-Salary', applicableTo: 'TDS on Interest, Commission, etc.', dueDateReference: 'Jul 31, Oct 31, Jan 31, May 31' },
        { code: '27Q', name: '27Q - TDS on NRI Payments', applicableTo: 'TDS on payments to Non-Residents', dueDateReference: 'Same as 26Q' },
        { code: '27EQ', name: '27EQ - TCS Return', applicableTo: 'Tax Collected at Source', dueDateReference: 'Same as 26Q' },
    ],
    GST_REGISTRATION: [
        { code: 'GST_REG_REGULAR', name: 'Regular Registration', applicableTo: 'Normal business, full compliance' },
        { code: 'GST_REG_COMPOSITION', name: 'Composition Scheme', applicableTo: 'Small business, 1-6% tax, quarterly return' },
        { code: 'GST_REG_CASUAL', name: 'Casual Registration', applicableTo: 'Temporary registration for events' },
        { code: 'GST_REG_NRI', name: 'Non-Resident Registration', applicableTo: 'Foreign businesses' },
        { code: 'GST_REG_SEZ', name: 'SEZ Registration', applicableTo: 'Special Economic Zone units' },
        { code: 'GST_REG_ISD', name: 'Input Service Distributor', applicableTo: 'ISD for distributing ITC' },
    ],
    GST_RETURN: [
        { code: 'GSTR_1', name: 'GSTR-1', applicableTo: 'Outward Supplies (Sales)', dueDateReference: '11th Monthly' },
        { code: 'GSTR_3B', name: 'GSTR-3B', applicableTo: 'Summary + Tax Payment', dueDateReference: '20th Monthly' },
        { code: 'GSTR_4', name: 'GSTR-4', applicableTo: 'Composition Return', dueDateReference: '18th Quarterly' },
        { code: 'GSTR_9', name: 'GSTR-9', applicableTo: 'Annual Return', dueDateReference: 'December 31' },
        { code: 'GSTR_9C', name: 'GSTR-9C', applicableTo: 'Reconciliation Statement (>₹5Cr)', dueDateReference: 'December 31' },
    ],
    GST_COMPLIANCE: [
        { code: 'ITC_RECONCILIATION', name: 'ITC Reconciliation', applicableTo: 'Match purchases with GSTR-2B' },
        { code: 'EWAY_BILL', name: 'E-Way Bill', applicableTo: 'Goods movement > ₹50,000' },
        { code: 'EINVOICING', name: 'E-Invoicing', applicableTo: 'Mandatory for turnover > ₹5Cr' },
        { code: 'LUT_FILING', name: 'LUT Filing', applicableTo: 'Letter of Undertaking for exporters' },
        { code: 'GST_REFUND', name: 'Refund Claims', applicableTo: 'Export refund, Inverted duty refund' },
        { code: 'GST_AMENDMENT', name: 'Amendment', applicableTo: 'Registration amendments' },
        { code: 'GST_CANCELLATION', name: 'Cancellation', applicableTo: 'GST cancellation on business closure' },
    ],
    COMPANY_INCORPORATION: [
        { code: 'PVT_LTD', name: 'Private Limited Company', applicableTo: 'Most common for startups and businesses' },
        { code: 'PUBLIC_LTD', name: 'Public Limited Company', applicableTo: 'Larger companies seeking public funding' },
        { code: 'OPC', name: 'One Person Company', applicableTo: 'Single owner companies' },
        { code: 'LLP', name: 'Limited Liability Partnership', applicableTo: 'Professionals and small businesses' },
        { code: 'SECTION_8', name: 'Section 8 Company (NGO)', applicableTo: 'Non-profit organizations' },
    ],
    ROC_ANNUAL: [
        { code: 'AOC_4', name: 'AOC-4 (Financial Statements)', applicableTo: 'All companies', dueDateReference: '30 days from AGM' },
        { code: 'MGT_7', name: 'MGT-7/7A (Annual Return)', applicableTo: 'All companies', dueDateReference: '60 days from AGM' },
        { code: 'ADT_1', name: 'ADT-1 (Auditor Appointment)', applicableTo: 'All companies', dueDateReference: '15 days from AGM' },
        { code: 'DIR_3_KYC', name: 'DIR-3 KYC (Director KYC)', applicableTo: 'All directors', dueDateReference: 'September 30' },
        { code: 'DPT_3', name: 'DPT-3 (Deposit Return)', applicableTo: 'Companies with deposits', dueDateReference: 'June 30' },
        { code: 'MSME_1', name: 'MSME-1 (Outstanding)', applicableTo: 'Companies with MSME payments', dueDateReference: 'Half-yearly' },
    ],
    ROC_EVENT: [
        { code: 'DIR_12', name: 'DIR-12 (Director Change)', applicableTo: 'Director Appointment/Resignation', dueDateReference: '30 days' },
        { code: 'SH_4', name: 'SH-4 (Share Transfer)', applicableTo: 'Transfer of shares', dueDateReference: '60 days' },
        { code: 'SH_7', name: 'SH-7 (Capital Increase)', applicableTo: 'Increase in authorized capital', dueDateReference: '30 days' },
        { code: 'INC_22', name: 'INC-22 (Office Change)', applicableTo: 'Change in Registered Office', dueDateReference: '30 days' },
        { code: 'CHG_1', name: 'CHG-1 (Charge Creation)', applicableTo: 'Creation/Modification of charges', dueDateReference: '30 days' },
        { code: 'CHG_4', name: 'CHG-4 (Charge Satisfaction)', applicableTo: 'Satisfaction of charges', dueDateReference: '30 days' },
    ],
};

// Document Requirements by Service Type
const documentRequirements = {
    ITR_FILING: [
        { documentName: 'PAN Card', category: 'Identity', isMandatory: true },
        { documentName: 'Aadhar Card', category: 'Identity', isMandatory: true },
        { documentName: 'Bank Statements (all accounts)', category: 'Financial', isMandatory: true },
        { documentName: 'Previous Year ITR', category: 'Tax', isMandatory: false },
    ],
    // ITR-1 specific documents
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
        { documentName: 'Fixed Asset Register', category: 'Financial', isMandatory: false },
        { documentName: 'Loan Documents', category: 'Financial', isMandatory: false },
    ],
    ITR_6: [
        { documentName: 'Audited Financial Statements', category: 'Financial', isMandatory: true },
        { documentName: 'Tax Audit Report (3CD)', category: 'Tax', isMandatory: true },
        { documentName: 'GST Returns (all months)', category: 'Tax', isMandatory: true },
        { documentName: 'TDS Returns (all quarters)', category: 'Tax', isMandatory: true },
        { documentName: 'Board Resolution', category: 'Business', isMandatory: true },
    ],
    GST_REGISTRATION: [
        { documentName: 'PAN Card', category: 'Identity', isMandatory: true },
        { documentName: 'Aadhar Card', category: 'Identity', isMandatory: true },
        { documentName: 'Passport Photo', category: 'Identity', isMandatory: true },
        { documentName: 'Business Address Proof (Electricity Bill/Rent Agreement)', category: 'Business', isMandatory: true },
        { documentName: 'NOC from Landlord', category: 'Business', isMandatory: false },
        { documentName: 'Bank Statement / Cancelled Cheque', category: 'Financial', isMandatory: true },
        { documentName: 'Constitution Document (Partnership Deed/LLP Agreement/MOA-AOA)', category: 'Business', isMandatory: false },
    ],
    GST_RETURN: [
        { documentName: 'Sales Register (with HSN)', category: 'Financial', isMandatory: true },
        { documentName: 'Purchase Register (with GSTIN)', category: 'Financial', isMandatory: true },
        { documentName: 'Credit/Debit Notes', category: 'Financial', isMandatory: false },
        { documentName: 'RCM Details', category: 'Tax', isMandatory: false },
        { documentName: 'HSN Summary', category: 'Tax', isMandatory: false },
        { documentName: 'Previous month return', category: 'Tax', isMandatory: false },
    ],
    TDS_RETURN: [
        { documentName: 'TAN', category: 'Tax', isMandatory: true },
        { documentName: 'Deductee PAN details', category: 'Tax', isMandatory: true },
        { documentName: 'Payment details with dates', category: 'Financial', isMandatory: true },
        { documentName: 'TDS Challan details', category: 'Tax', isMandatory: true },
        { documentName: 'Previous quarter return', category: 'Tax', isMandatory: false },
    ],
    TAX_AUDIT: [
        { documentName: 'Books of Accounts', category: 'Financial', isMandatory: true },
        { documentName: 'Bank Statements (all accounts, full year)', category: 'Financial', isMandatory: true },
        { documentName: 'Stock Records', category: 'Financial', isMandatory: true },
        { documentName: 'Fixed Asset Register', category: 'Financial', isMandatory: true },
        { documentName: 'Loan Documents', category: 'Financial', isMandatory: false },
        { documentName: 'Expense Vouchers', category: 'Financial', isMandatory: false },
        { documentName: 'TDS/TCS Certificates', category: 'Tax', isMandatory: true },
    ],
    ROC_ANNUAL: [
        { documentName: 'Audited Financial Statements', category: 'Financial', isMandatory: true },
        { documentName: 'Director Details', category: 'Business', isMandatory: true },
        { documentName: 'Shareholding Pattern', category: 'Business', isMandatory: true },
        { documentName: 'Minutes of AGM', category: 'Business', isMandatory: true },
        { documentName: 'Minutes of Board Meetings', category: 'Business', isMandatory: true },
    ],
    COMPANY_INCORPORATION: [
        { documentName: 'Digital Signature (DSC)', category: 'Identity', isMandatory: true },
        { documentName: 'DIN (if existing)', category: 'Identity', isMandatory: false },
        { documentName: 'Director PAN Cards', category: 'Identity', isMandatory: true },
        { documentName: 'Director Aadhar Cards', category: 'Identity', isMandatory: true },
        { documentName: 'Director Address Proof', category: 'Identity', isMandatory: true },
        { documentName: 'Registered Office Proof', category: 'Business', isMandatory: true },
        { documentName: 'NOC from Owner', category: 'Business', isMandatory: true },
        { documentName: 'MOA/AOA Draft', category: 'Business', isMandatory: false },
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
                firmId: null, // System default
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

        for (const type of types) {
            const created = await prisma.serviceTypeMaster.create({
                data: {
                    categoryId,
                    code: type.code,
                    name: type.name,
                    hasSubTypes: type.hasSubTypes,
                    requiresFinancialYear: type.requiresFinancialYear,
                    requiresAssessmentYear: type.requiresAssessmentYear || false,
                    requiresQuarter: type.requiresQuarter || false,
                    requiresPeriod: type.requiresPeriod || false,
                    defaultDueDate: type.defaultDueDate,
                    displayOrder: type.displayOrder,
                    firmId: null, // System default
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
                    displayOrder: order++,
                    firmId: null, // System default
                },
            });
            subTypeMap[sub.code] = created.id;
            console.log(`  ✓ ${sub.name}`);
        }
    }

    // Create document requirements
    console.log('\n📎 Creating document requirements...');

    for (const [typeCode, docs] of Object.entries(documentRequirements)) {
        // Check if this is a service type or sub-type
        const serviceTypeId = serviceTypeMap[typeCode];
        const serviceSubTypeId = subTypeMap[typeCode];

        if (!serviceTypeId && !serviceSubTypeId) {
            console.log(`  ⚠ Skipping ${typeCode} - not found`);
            continue;
        }

        let order = 1;
        for (const doc of docs) {
            await prisma.documentRequirement.create({
                data: {
                    serviceTypeId: serviceTypeId || serviceTypeMap[Object.keys(subTypes).find(k =>
                        subTypes[k as keyof typeof subTypes].some(s => s.code === typeCode)
                    ) || ''] || '',
                    serviceSubTypeId: serviceSubTypeId || null,
                    documentName: doc.documentName,
                    description: doc.description,
                    category: doc.category,
                    isMandatory: doc.isMandatory,
                    displayOrder: order++,
                    firmId: null, // System default
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
