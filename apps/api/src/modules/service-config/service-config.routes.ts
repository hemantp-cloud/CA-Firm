/**
 * Service Configuration API Routes
 * Provides endpoints for fetching service categories, types, sub-types, and document requirements
 */

import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// PUBLIC ENDPOINTS (No Auth Required for Master Data)
// ============================================

/**
 * GET /api/service-config/categories
 * Get all active service categories
 */
router.get('/categories', async (_req, res: Response): Promise<void> => {
    try {
        const categories = await prisma.serviceCategory.findMany({
            where: {
                isActive: true,
                firmId: null, // System defaults only for now
            },
            orderBy: { displayOrder: 'asc' },
            select: {
                id: true,
                code: true,
                name: true,
                icon: true,
                displayOrder: true,
            },
        });

        res.json({
            success: true,
            data: categories,
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories',
        });
    }
});

/**
 * GET /api/service-config/types
 * Get all service types, optionally filtered by category
 * Query params: categoryId, categoryCode
 */
router.get('/types', async (req, res: Response): Promise<void> => {
    try {
        const { categoryId, categoryCode } = req.query;

        let categoryFilter = {};

        if (categoryId) {
            categoryFilter = { categoryId: categoryId as string };
        } else if (categoryCode) {
            const category = await prisma.serviceCategory.findFirst({
                where: { code: categoryCode as string, firmId: null },
            });
            if (category) {
                categoryFilter = { categoryId: category.id };
            }
        }

        const types = await prisma.serviceTypeMaster.findMany({
            where: {
                isActive: true,
                firmId: null, // System defaults
                ...categoryFilter,
            },
            orderBy: [
                { category: { displayOrder: 'asc' } },
                { displayOrder: 'asc' },
            ],
            select: {
                id: true,
                code: true,
                name: true,
                description: true,
                frequency: true,
                deliverables: true,
                hasSubTypes: true,
                requiresFinancialYear: true,
                requiresAssessmentYear: true,
                requiresQuarter: true,
                requiresPeriod: true,
                defaultDueDays: true,
                defaultDueDate: true,
                defaultFee: true,
                displayOrder: true,
                category: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        icon: true,
                    },
                },
            },
        });

        res.json({
            success: true,
            data: types,
        });
    } catch (error) {
        console.error('Get types error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch service types',
        });
    }
});

/**
 * GET /api/service-config/sub-types
 * Get sub-types for a service type
 * Query params: serviceTypeId, serviceTypeCode
 */
router.get('/sub-types', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { serviceTypeId, serviceTypeCode } = req.query;
        const userFirmId = req.user?.firmId;

        let typeFilter = {};

        if (serviceTypeId) {
            typeFilter = { serviceTypeId: serviceTypeId as string };
        } else if (serviceTypeCode) {
            // Look for service type in both system and custom types
            const type = await prisma.serviceTypeMaster.findFirst({
                where: {
                    code: serviceTypeCode as string,
                    OR: [
                        { firmId: null },
                        ...(userFirmId ? [{ firmId: userFirmId }] : []),
                    ],
                },
            });
            if (type) {
                typeFilter = { serviceTypeId: type.id };
            }
        }

        if (Object.keys(typeFilter).length === 0) {
            res.status(400).json({
                success: false,
                message: 'serviceTypeId or serviceTypeCode is required',
            });
            return;
        }

        const subTypes = await prisma.serviceSubType.findMany({
            where: {
                isActive: true,
                OR: [
                    { firmId: null }, // System sub-types
                    ...(userFirmId ? [{ firmId: userFirmId }] : []), // Custom sub-types
                ],
                ...typeFilter,
            },
            orderBy: { displayOrder: 'asc' },
            select: {
                id: true,
                code: true,
                name: true,
                applicableTo: true,
                dueDateReference: true,
                deliverables: true,
                defaultFee: true,
                displayOrder: true,
                firmId: true, // Include to identify custom vs system
            },
        });

        // Add isSystem flag
        const subTypesWithFlag = subTypes.map(sub => ({
            ...sub,
            isSystem: sub.firmId === null,
        }));

        res.json({
            success: true,
            data: subTypesWithFlag,
        });
    } catch (error) {
        console.error('Get sub-types error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sub-types',
        });
    }
});

/**
 * GET /api/service-config/document-requirements
 * Get document requirements for a service type/sub-type
 * Query params: serviceTypeId, serviceTypeCode, serviceSubTypeId, serviceSubTypeCode
 * Supports both system and custom service types
 */
router.get('/document-requirements', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { serviceTypeId, serviceTypeCode, serviceSubTypeId, serviceSubTypeCode } = req.query;
        const userFirmId = req.user?.firmId;

        let serviceTypeIdResolved: string | null = null;
        let serviceSubTypeIdResolved: string | null = null;

        // Resolve service type (search both system and custom)
        if (serviceTypeId) {
            serviceTypeIdResolved = serviceTypeId as string;
        } else if (serviceTypeCode) {
            const type = await prisma.serviceTypeMaster.findFirst({
                where: {
                    code: serviceTypeCode as string,
                    OR: [
                        { firmId: null }, // System types
                        ...(userFirmId ? [{ firmId: userFirmId }] : []), // Custom types
                    ],
                },
            });
            if (type) {
                serviceTypeIdResolved = type.id;
            }
        }

        // Resolve sub-type (search both system and custom)
        if (serviceSubTypeId) {
            serviceSubTypeIdResolved = serviceSubTypeId as string;
        } else if (serviceSubTypeCode) {
            const subType = await prisma.serviceSubType.findFirst({
                where: {
                    code: serviceSubTypeCode as string,
                    OR: [
                        { firmId: null }, // System sub-types
                        ...(userFirmId ? [{ firmId: userFirmId }] : []), // Custom sub-types
                    ],
                },
            });
            if (subType) {
                serviceSubTypeIdResolved = subType.id;
                // Also get the parent service type if not provided
                if (!serviceTypeIdResolved) {
                    serviceTypeIdResolved = subType.serviceTypeId;
                }
            }
        }

        if (!serviceTypeIdResolved) {
            // For custom types without document requirements, return empty
            res.json({
                success: true,
                data: {
                    all: [],
                    mandatory: [],
                    optional: [],
                },
            });
            return;
        }

        // Get documents for the service type (general requirements)
        const typeDocuments = await prisma.documentRequirement.findMany({
            where: {
                serviceTypeId: serviceTypeIdResolved,
                serviceSubTypeId: null, // General requirements for the type
                OR: [
                    { firmId: null },
                    ...(userFirmId ? [{ firmId: userFirmId }] : []),
                ],
            },
            orderBy: { displayOrder: 'asc' },
        });

        // Get documents for the specific sub-type (if provided)
        let subTypeDocuments: any[] = [];
        if (serviceSubTypeIdResolved) {
            subTypeDocuments = await prisma.documentRequirement.findMany({
                where: {
                    serviceSubTypeId: serviceSubTypeIdResolved,
                    OR: [
                        { firmId: null },
                        ...(userFirmId ? [{ firmId: userFirmId }] : []),
                    ],
                },
                orderBy: { displayOrder: 'asc' },
            });
        }

        // Combine: General + Sub-type specific
        const allDocuments = [...typeDocuments, ...subTypeDocuments];

        // Separate mandatory and optional
        const mandatory = allDocuments.filter(d => d.isMandatory);
        const optional = allDocuments.filter(d => !d.isMandatory);

        res.json({
            success: true,
            data: {
                all: allDocuments,
                mandatory,
                optional,
                totalCount: allDocuments.length,
                mandatoryCount: mandatory.length,
                optionalCount: optional.length,
            },
        });
    } catch (error) {
        console.error('Get document requirements error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch document requirements',
        });
    }
});

/**
 * GET /api/service-config/types-grouped
 * Get all service types grouped by category (for dropdown with sections)
 */
router.get('/types-grouped', async (_req, res: Response): Promise<void> => {
    try {
        const categories = await prisma.serviceCategory.findMany({
            where: {
                isActive: true,
                firmId: null,
            },
            orderBy: { displayOrder: 'asc' },
            include: {
                serviceTypes: {
                    where: { isActive: true, firmId: null },
                    orderBy: { displayOrder: 'asc' },
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        description: true,
                        frequency: true,
                        deliverables: true,
                        hasSubTypes: true,
                        requiresFinancialYear: true,
                        requiresAssessmentYear: true,
                        requiresQuarter: true,
                        requiresPeriod: true,
                        defaultDueDays: true,
                        defaultDueDate: true,
                        defaultFee: true,
                    },
                },
            },
        });

        res.json({
            success: true,
            data: categories,
        });
    } catch (error) {
        console.error('Get types grouped error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch service types',
        });
    }
});

// ============================================
// CRUD OPERATIONS FOR SERVICE CONFIGURATION
// ============================================

/**
 * POST /api/service-config/categories
 * Create a new category (custom for the user's firm)
 * Requires authentication - firmId is taken from the authenticated user
 */
router.post('/categories', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { code, name, icon, description } = req.body;
        const userFirmId = req.user?.firmId; // Get firmId from authenticated user

        if (!code || !name) {
            res.status(400).json({
                success: false,
                message: 'Code and name are required',
            });
            return;
        }

        const category = await prisma.serviceCategory.create({
            data: {
                code: code.toUpperCase().replace(/\s+/g, '_'),
                name,
                icon: icon || 'MoreHorizontal',
                description,
                firmId: userFirmId || null, // Uses the authenticated user's firmId
                isActive: true,
            },
        });

        res.json({
            success: true,
            data: {
                ...category,
                isSystem: category.firmId === null, // Include isSystem flag in response
            },
            message: 'Category created successfully',
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create category',
        });
    }
});

/**
 * PUT /api/service-config/categories/:id
 * Update an existing category
 */
router.put('/categories/:id', async (req, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, icon, description, isActive } = req.body;

        const category = await prisma.serviceCategory.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(icon && { icon }),
                ...(description !== undefined && { description }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        res.json({
            success: true,
            data: category,
            message: 'Category updated successfully',
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update category',
        });
    }
});

/**
 * DELETE /api/service-config/categories/:id
 * Delete a category and its children
 */
router.delete('/categories/:id', async (req, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Delete in order: sub-types -> types -> category
        const types = await prisma.serviceTypeMaster.findMany({
            where: { categoryId: id },
            select: { id: true },
        });

        const typeIds = types.map(t => t.id);

        // Delete sub-types first
        await prisma.serviceSubType.deleteMany({
            where: { serviceTypeId: { in: typeIds } },
        });

        // Delete document requirements
        await prisma.documentRequirement.deleteMany({
            where: { serviceTypeId: { in: typeIds } },
        });

        // Delete types
        await prisma.serviceTypeMaster.deleteMany({
            where: { categoryId: id },
        });

        // Delete category
        await prisma.serviceCategory.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Category and all related items deleted successfully',
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete category',
        });
    }
});

/**
 * POST /api/service-config/types
 * Create a new service type (custom for the user's firm)
 * Requires authentication - firmId is taken from the authenticated user
 */
router.post('/types', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const {
            categoryId,
            code,
            name,
            description,
            defaultDueDate,
            frequency,
            hasSubTypes,
            requiresFinancialYear,
            requiresAssessmentYear,
            requiresQuarter,
            requiresPeriod,
            deliverables,
        } = req.body;
        const userFirmId = req.user?.firmId; // Get firmId from authenticated user

        if (!categoryId || !code || !name) {
            res.status(400).json({
                success: false,
                message: 'categoryId, code, and name are required',
            });
            return;
        }

        const serviceType = await prisma.serviceTypeMaster.create({
            data: {
                categoryId,
                code: code.toUpperCase().replace(/\s+/g, '_'),
                name,
                description,
                defaultDueDate,
                frequency,
                hasSubTypes: hasSubTypes || false,
                requiresFinancialYear: requiresFinancialYear || false,
                requiresAssessmentYear: requiresAssessmentYear || false,
                requiresQuarter: requiresQuarter || false,
                requiresPeriod: requiresPeriod || false,
                deliverables: deliverables || [],
                firmId: userFirmId || null, // Use authenticated user's firmId
                isActive: true,
            },
        });

        res.json({
            success: true,
            data: {
                ...serviceType,
                isSystem: serviceType.firmId === null, // Add isSystem flag
            },
            message: 'Service type created successfully',
        });
    } catch (error) {
        console.error('Create service type error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create service type',
        });
    }
});

/**
 * PUT /api/service-config/types/:id
 * Update an existing service type
 */
router.put('/types/:id', async (req, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            defaultDueDate,
            frequency,
            hasSubTypes,
            requiresFinancialYear,
            requiresAssessmentYear,
            requiresQuarter,
            requiresPeriod,
            deliverables,
            isActive,
        } = req.body;

        const serviceType = await prisma.serviceTypeMaster.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(defaultDueDate !== undefined && { defaultDueDate }),
                ...(frequency !== undefined && { frequency }),
                ...(hasSubTypes !== undefined && { hasSubTypes }),
                ...(requiresFinancialYear !== undefined && { requiresFinancialYear }),
                ...(requiresAssessmentYear !== undefined && { requiresAssessmentYear }),
                ...(requiresQuarter !== undefined && { requiresQuarter }),
                ...(requiresPeriod !== undefined && { requiresPeriod }),
                ...(deliverables !== undefined && { deliverables }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        res.json({
            success: true,
            data: serviceType,
            message: 'Service type updated successfully',
        });
    } catch (error) {
        console.error('Update service type error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update service type',
        });
    }
});

/**
 * DELETE /api/service-config/types/:id
 * Delete a service type and its sub-types
 */
router.delete('/types/:id', async (req, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Delete sub-types first
        await prisma.serviceSubType.deleteMany({
            where: { serviceTypeId: id },
        });

        // Delete document requirements
        await prisma.documentRequirement.deleteMany({
            where: { serviceTypeId: id },
        });

        // Delete type
        await prisma.serviceTypeMaster.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Service type and all sub-types deleted successfully',
        });
    } catch (error) {
        console.error('Delete service type error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete service type',
        });
    }
});

/**
 * POST /api/service-config/sub-types
 * Create a new sub-type (custom for the user's firm)
 * Requires authentication - firmId is taken from the authenticated user
 */
router.post('/sub-types', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const {
            serviceTypeId,
            code,
            name,
            applicableTo,
            dueDateReference,
            deliverables,
            defaultFee,
        } = req.body;
        const userFirmId = req.user?.firmId; // Get firmId from authenticated user

        if (!serviceTypeId || !code || !name) {
            res.status(400).json({
                success: false,
                message: 'serviceTypeId, code, and name are required',
            });
            return;
        }

        const subType = await prisma.serviceSubType.create({
            data: {
                serviceTypeId,
                code: code.toUpperCase().replace(/\s+/g, '_'),
                name,
                applicableTo,
                dueDateReference,
                deliverables: deliverables || [],
                defaultFee: defaultFee ? parseFloat(defaultFee) : null,
                firmId: userFirmId || null, // Use authenticated user's firmId
                isActive: true,
            },
        });

        res.json({
            success: true,
            data: {
                ...subType,
                isSystem: subType.firmId === null, // Add isSystem flag
            },
            message: 'Sub-type created successfully',
        });
    } catch (error) {
        console.error('Create sub-type error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create sub-type',
        });
    }
});

/**
 * PUT /api/service-config/sub-types/:id
 * Update an existing sub-type
 */
router.put('/sub-types/:id', async (req, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const {
            name,
            applicableTo,
            dueDateReference,
            deliverables,
            defaultFee,
            isActive,
        } = req.body;

        const subType = await prisma.serviceSubType.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(applicableTo !== undefined && { applicableTo }),
                ...(dueDateReference !== undefined && { dueDateReference }),
                ...(deliverables !== undefined && { deliverables }),
                ...(defaultFee !== undefined && { defaultFee: defaultFee ? parseFloat(defaultFee) : null }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        res.json({
            success: true,
            data: subType,
            message: 'Sub-type updated successfully',
        });
    } catch (error) {
        console.error('Update sub-type error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update sub-type',
        });
    }
});

/**
 * DELETE /api/service-config/sub-types/:id
 * Delete a sub-type
 */
router.delete('/sub-types/:id', async (req, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Delete document requirements for this sub-type
        await prisma.documentRequirement.deleteMany({
            where: { serviceSubTypeId: id },
        });

        // Delete sub-type
        await prisma.serviceSubType.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Sub-type deleted successfully',
        });
    } catch (error) {
        console.error('Delete sub-type error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete sub-type',
        });
    }
});

/**
 * GET /api/service-config/types-grouped-with-custom
 * Get all service types grouped by category including custom ones
 * Requires authentication - uses user's firmId to include their custom services
 */
router.get('/types-grouped-with-custom', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // Get firmId from authenticated user OR from query param (fallback)
        const firmId = req.user?.firmId || (req.query.firmId as string);

        // Get system categories + firm custom categories
        const categories = await prisma.serviceCategory.findMany({
            where: {
                isActive: true,
                OR: [
                    { firmId: null }, // System categories
                    ...(firmId ? [{ firmId: firmId }] : []), // Firm custom categories
                ],
            },
            orderBy: [
                { firmId: 'asc' }, // System first, then custom
                { displayOrder: 'asc' },
            ],
            include: {
                serviceTypes: {
                    where: {
                        isActive: true,
                        OR: [
                            { firmId: null },
                            ...(firmId ? [{ firmId: firmId as string }] : []),
                        ],
                    },
                    orderBy: { displayOrder: 'asc' },
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        description: true,
                        hasSubTypes: true,
                        requiresFinancialYear: true,
                        requiresAssessmentYear: true,
                        requiresQuarter: true,
                        requiresPeriod: true,
                        defaultDueDate: true,
                        frequency: true,
                        deliverables: true,
                        firmId: true, // Include to identify custom vs system
                    },
                },
            },
        });

        // Add isSystem flag to each item
        const categoriesWithFlag = categories.map(cat => ({
            ...cat,
            isSystem: cat.firmId === null,
            serviceTypes: cat.serviceTypes.map(type => ({
                ...type,
                isSystem: type.firmId === null,
            })),
        }));

        res.json({
            success: true,
            data: categoriesWithFlag,
        });
    } catch (error) {
        console.error('Get types grouped with custom error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch service types',
        });
    }
});

/**
 * GET /api/service-config/sub-types-with-custom
 * Get sub-types for a service type including custom ones
 * Query params: serviceTypeId, firmId
 */
router.get('/sub-types-with-custom', async (req, res: Response): Promise<void> => {
    try {
        const { serviceTypeId, firmId } = req.query;

        if (!serviceTypeId) {
            res.status(400).json({
                success: false,
                message: 'serviceTypeId is required',
            });
            return;
        }

        const subTypes = await prisma.serviceSubType.findMany({
            where: {
                serviceTypeId: serviceTypeId as string,
                isActive: true,
                OR: [
                    { firmId: null },
                    ...(firmId ? [{ firmId: firmId as string }] : []),
                ],
            },
            orderBy: [
                { firmId: 'asc' },
                { displayOrder: 'asc' },
            ],
            select: {
                id: true,
                code: true,
                name: true,
                applicableTo: true,
                dueDateReference: true,
                deliverables: true,
                defaultFee: true,
                firmId: true,
            },
        });

        // Add isSystem flag
        const subTypesWithFlag = subTypes.map(sub => ({
            ...sub,
            isSystem: sub.firmId === null,
        }));

        res.json({
            success: true,
            data: subTypesWithFlag,
        });
    } catch (error) {
        console.error('Get sub-types with custom error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sub-types',
        });
    }
});

// ============================================
// UNIVERSAL DOCUMENT LIBRARY ENDPOINTS
// ============================================

/**
 * GET /api/service-config/document-library
 * Get all documents from the Universal Document Library
 * Query params: search (optional), category (optional)
 */
router.get('/document-library', async (req, res: Response): Promise<void> => {
    try {
        const { search, category } = req.query;

        let whereClause: any = {
            isActive: true,
        };

        // Filter by category if provided
        if (category && category !== 'all') {
            whereClause.category = category as string;
        }

        // Search by name if provided
        if (search) {
            whereClause.name = {
                contains: search as string,
                mode: 'insensitive',
            };
        }

        const documents = await prisma.documentMaster.findMany({
            where: whereClause,
            orderBy: [
                { category: 'asc' },
                { displayOrder: 'asc' },
            ],
            select: {
                id: true,
                code: true,
                name: true,
                category: true,
                description: true,
                displayOrder: true,
            },
        });

        // Group by category for easier frontend rendering
        const groupedByCategory: Record<string, any[]> = {};
        documents.forEach(doc => {
            if (!groupedByCategory[doc.category]) {
                groupedByCategory[doc.category] = [];
            }
            groupedByCategory[doc.category].push(doc);
        });

        res.json({
            success: true,
            data: {
                documents,
                groupedByCategory,
                totalCount: documents.length,
            },
        });
    } catch (error) {
        console.error('Get document library error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch document library',
        });
    }
});

/**
 * GET /api/service-config/document-library/categories
 * Get all unique document categories
 */
router.get('/document-library/categories', async (_req, res: Response): Promise<void> => {
    try {
        const categories = await prisma.documentMaster.groupBy({
            by: ['category'],
            _count: { id: true },
            orderBy: { category: 'asc' },
        });

        const categoryList = categories.map(cat => ({
            name: cat.category,
            count: cat._count.id,
        }));

        res.json({
            success: true,
            data: categoryList,
        });
    } catch (error) {
        console.error('Get document categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch document categories',
        });
    }
});

/**
 * GET /api/service-config/suggested-documents
 * Get suggested documents for a specific service type/sub-type
 * Query params: serviceTypeId (required), serviceSubTypeId (optional)
 */
router.get('/suggested-documents', async (req, res: Response): Promise<void> => {
    try {
        const { serviceTypeId, serviceSubTypeId } = req.query;

        if (!serviceTypeId) {
            res.status(400).json({
                success: false,
                message: 'serviceTypeId is required',
            });
            return;
        }

        // First, try to find by code (for custom types that might have string IDs)
        let resolvedServiceTypeId = serviceTypeId as string;

        // Check if serviceTypeId is a code instead of UUID
        const serviceType = await prisma.serviceTypeMaster.findFirst({
            where: {
                OR: [
                    { id: serviceTypeId as string },
                    { code: serviceTypeId as string },
                ],
            },
        });

        if (!serviceType) {
            // If no service type found, return empty suggestions
            res.json({
                success: true,
                data: {
                    suggested: [],
                    message: 'No suggestions available for this service type',
                },
            });
            return;
        }

        resolvedServiceTypeId = serviceType.id;

        // Get suggested documents for the service type
        let subTypeId: string | null = null;

        if (serviceSubTypeId) {
            const subType = await prisma.serviceSubType.findFirst({
                where: {
                    OR: [
                        { id: serviceSubTypeId as string },
                        { code: serviceSubTypeId as string },
                    ],
                },
            });
            subTypeId = subType?.id || null;
        }

        // Get documents from DocumentRequirement table
        const documentRequirements = await prisma.documentRequirement.findMany({
            where: {
                serviceTypeId: resolvedServiceTypeId,
                ...(subTypeId ? { serviceSubTypeId: subTypeId } : {}),
                OR: [
                    { firmId: null }, // System defaults
                ],
            },
            orderBy: [
                { isMandatory: 'desc' }, // Mandatory first
                { displayOrder: 'asc' },
            ],
            select: {
                id: true,
                documentName: true,
                description: true,
                category: true,
                isMandatory: true,
                displayOrder: true,
            },
        });

        // Also get general type-level documents if we have a sub-type
        let generalDocuments: any[] = [];
        if (subTypeId) {
            generalDocuments = await prisma.documentRequirement.findMany({
                where: {
                    serviceTypeId: resolvedServiceTypeId,
                    serviceSubTypeId: null, // General type-level docs
                    firmId: null,
                },
                orderBy: [
                    { isMandatory: 'desc' },
                    { displayOrder: 'asc' },
                ],
                select: {
                    id: true,
                    documentName: true,
                    description: true,
                    category: true,
                    isMandatory: true,
                    displayOrder: true,
                },
            });
        }

        // Combine and deduplicate (sub-type specific + general)
        const allDocuments = [...generalDocuments, ...documentRequirements];
        const uniqueDocuments = allDocuments.reduce((acc, doc) => {
            if (!acc.find((d: any) => d.documentName === doc.documentName)) {
                acc.push(doc);
            }
            return acc;
        }, [] as any[]);

        // Separate mandatory and optional
        const mandatory = uniqueDocuments.filter((d: any) => d.isMandatory);
        const optional = uniqueDocuments.filter((d: any) => !d.isMandatory);

        res.json({
            success: true,
            data: {
                suggested: uniqueDocuments,
                mandatory,
                optional,
                serviceType: {
                    id: serviceType.id,
                    code: serviceType.code,
                    name: serviceType.name,
                },
            },
        });
    } catch (error) {
        console.error('Get suggested documents error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch suggested documents',
        });
    }
});

export default router;

