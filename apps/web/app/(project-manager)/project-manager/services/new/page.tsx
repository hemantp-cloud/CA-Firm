"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, Loader2, Search, X, FileText, CheckCircle2, Info, Clock, Plus, RotateCcw, Pencil, Trash2, AlertTriangle, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, User, Briefcase, Calendar, FolderOpen, Check, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectSeparator,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"
import api from "@/lib/api"

// ============================================
// TYPES
// ============================================

interface Client {
    id: string
    name: string
    email?: string
    phone?: string
}

interface ServiceCategory {
    id: string
    code: string
    name: string
    icon: string
    firmId?: string | null
    isSystem?: boolean
    serviceTypes?: ServiceType[]
}

interface ServiceType {
    id: string
    code: string
    name: string
    description?: string
    hasSubTypes: boolean
    requiresFinancialYear: boolean
    requiresAssessmentYear: boolean
    requiresQuarter: boolean
    requiresPeriod: boolean
    defaultDueDays?: number
    defaultDueDate?: string
    defaultFee?: number
    frequency?: string
    deliverables?: string[]
    firmId?: string | null
    isSystem?: boolean
    category?: {
        id: string
        code: string
        name: string
        icon: string
    }
}

interface ServiceSubType {
    id: string
    code: string
    name: string
    applicableTo?: string
    dueDateReference?: string
    deliverables?: string[]
    defaultFee?: number
    firmId?: string | null
    isSystem?: boolean
}

interface DocumentRequirement {
    id: string
    documentName: string
    description?: string
    category?: string
    isMandatory: boolean
}

// Universal Document Library item
interface DocumentMasterItem {
    id: string
    code: string
    name: string
    category: string
    description?: string
}

// Selected document for service creation
interface SelectedDocumentItem {
    documentMasterId?: string    // null if custom
    name: string
    category: string
    isRequired: boolean          // Required or Optional
    isCustom: boolean            // true if added via custom input
}

// ============================================
// SCHEMA
// ============================================

const serviceSchema = z.object({
    userId: z.string().uuid("Please select a client"),
    type: z.string().min(1, "Please select a service type"),
    subType: z.string().optional(),
    title: z.string().min(1, "Service name is required"),
    description: z.string().optional(),
    financialYear: z.string().optional(),
    assessmentYear: z.string().optional(),
    quarter: z.string().optional(),
    period: z.string().optional(), // NEW: For monthly services (YYYY-MM)
    dueDate: z.string().min(1, "Due date is required"),
    feeAmount: z.string().optional(),
    priority: z.string().optional(), // NEW: LOW, NORMAL, HIGH, URGENT
    clientNotes: z.string().optional(), // NEW: Notes visible to client
    internalNotes: z.string().optional(),
})

type ServiceFormData = z.infer<typeof serviceSchema>

// ============================================
// COMPONENT
// ============================================

export default function NewServicePage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const preSelectedUserId = searchParams.get("userId")

    // Form state
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // NEW: Wizard step state (1-4)
    const [currentStep, setCurrentStep] = useState(1)
    const [completedSteps, setCompletedSteps] = useState<number[]>([])
    const [collapsedCategories, setCollapsedCategories] = useState<string[]>([])

    // Data state
    const [clients, setClients] = useState<Client[]>([])
    const [categoriesWithTypes, setCategoriesWithTypes] = useState<ServiceCategory[]>([])
    const [subTypes, setSubTypes] = useState<ServiceSubType[]>([])
    const [documentRequirements, setDocumentRequirements] = useState<DocumentRequirement[]>([])
    const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])

    // NEW: Universal Document Library state
    const [documentLibrary, setDocumentLibrary] = useState<DocumentMasterItem[]>([])
    const [documentLibraryGrouped, setDocumentLibraryGrouped] = useState<Record<string, DocumentMasterItem[]>>({})
    const [selectedDocumentItems, setSelectedDocumentItems] = useState<SelectedDocumentItem[]>([])
    const [documentSearch, setDocumentSearch] = useState("")
    const [customDocumentName, setCustomDocumentName] = useState("")
    const [isAddingCustomDoc, setIsAddingCustomDoc] = useState(false)
    const [documentCategoryFilter, setDocumentCategoryFilter] = useState("all")

    // Search state
    const [clientSearch, setClientSearch] = useState("")
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false)

    // Ref for click-outside detection
    const clientDropdownRef = useRef<HTMLDivElement>(null)
    const clientInputRef = useRef<HTMLInputElement>(null)

    // Selected state
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<string>("")
    const [selectedType, setSelectedType] = useState<ServiceType | null>(null)
    const [selectedSubType, setSelectedSubType] = useState<ServiceSubType | null>(null)

    // Modal state for adding custom category/type/subtype
    const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false)
    const [isAddTypeModalOpen, setIsAddTypeModalOpen] = useState(false)
    const [isAddSubTypeModalOpen, setIsAddSubTypeModalOpen] = useState(false)
    const [customCategoryName, setCustomCategoryName] = useState("")
    const [customTypeName, setCustomTypeName] = useState("")
    const [customSubTypeName, setCustomSubTypeName] = useState("")
    const [isAddingCustom, setIsAddingCustom] = useState(false)

    // Edit mode state
    const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null)
    const [editingType, setEditingType] = useState<ServiceType | null>(null)
    const [editingSubType, setEditingSubType] = useState<ServiceSubType | null>(null)

    // Delete confirmation state
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'type' | 'subType'; item: any } | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Extended modal fields for service type
    const [customTypeDescription, setCustomTypeDescription] = useState("")
    const [customTypeRequiresFY, setCustomTypeRequiresFY] = useState(false)
    const [customTypeRequiresAY, setCustomTypeRequiresAY] = useState(false)
    const [customTypeRequiresQuarter, setCustomTypeRequiresQuarter] = useState(false)
    const [customTypeRequiresPeriod, setCustomTypeRequiresPeriod] = useState(false)
    const [customTypeHasSubTypes, setCustomTypeHasSubTypes] = useState(false)
    const [customTypeDefaultDueDate, setCustomTypeDefaultDueDate] = useState("")
    const [customTypeFrequency, setCustomTypeFrequency] = useState("")

    // Extended modal fields for sub-type
    const [customSubTypeApplicableTo, setCustomSubTypeApplicableTo] = useState("")
    const [customSubTypeDueDateRef, setCustomSubTypeDueDateRef] = useState("")
    const [customSubTypeDefaultFee, setCustomSubTypeDefaultFee] = useState("")

    // Client-side only date options (to prevent hydration mismatch)
    const [fyOptions, setFyOptions] = useState<{ value: string; label: string }[]>([])
    const [ayOptions, setAyOptions] = useState<{ value: string; label: string }[]>([])
    const [periodOptions, setPeriodOptions] = useState<{ value: string; label: string }[]>([])

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ServiceFormData>({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            userId: preSelectedUserId || undefined,
        },
    })

    // ============================================
    // DATA FETCHING
    // ============================================

    useEffect(() => {
        fetchClients()
        fetchServiceTypesGrouped()
        fetchDocumentLibrary()
    }, [])

    // ============================================
    // CLICK OUTSIDE HANDLER - Close dropdown when clicking outside
    // ============================================
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Check if click is outside the dropdown container
            if (
                clientDropdownRef.current &&
                !clientDropdownRef.current.contains(event.target as Node)
            ) {
                setIsClientDropdownOpen(false)
            }
        }

        // Add event listener when dropdown is open
        if (isClientDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        // Cleanup
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isClientDropdownOpen])

    // ============================================
    // KEYBOARD HANDLER - Close on Escape, navigate with arrow keys
    // ============================================
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isClientDropdownOpen) return

            switch (event.key) {
                case 'Escape':
                    setIsClientDropdownOpen(false)
                    clientInputRef.current?.blur()
                    break
                case 'Tab':
                    // Allow default tab behavior but close dropdown
                    setIsClientDropdownOpen(false)
                    break
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isClientDropdownOpen])

    // ============================================
    // GENERATE DATE OPTIONS (Client-side only to prevent hydration mismatch)
    // ============================================
    useEffect(() => {
        const today = new Date()
        const currentMonth = today.getMonth() + 1
        const currentYear = today.getFullYear()
        // FY starts in April
        const currentFYStart = currentMonth >= 4 ? currentYear : currentYear - 1

        // Generate FY options (current + 3 previous)
        const fyOpts = Array.from({ length: 4 }, (_, i) => {
            const fyStart = currentFYStart - i
            const fyValue = `${fyStart}-${(fyStart + 1).toString().slice(-2)}`
            return {
                value: fyValue,
                label: i === 0 ? `FY ${fyValue} (Current)` : `FY ${fyValue}`
            }
        })
        setFyOptions(fyOpts)

        // Generate AY options (current + 4)
        const ayOpts = Array.from({ length: 5 }, (_, i) => {
            const ayStart = currentFYStart + 1 - i
            const ayValue = `${ayStart}-${(ayStart + 1).toString().slice(-2)}`
            return {
                value: ayValue,
                label: `AY ${ayValue}`
            }
        })
        setAyOptions(ayOpts)

        // Generate Period (Month) options (current + 12 previous months)
        const periodOpts = Array.from({ length: 13 }, (_, i) => {
            const date = new Date()
            date.setMonth(date.getMonth() - i)
            const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            const label = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
            return { value, label }
        })
        setPeriodOptions(periodOpts)
    }, []) // Empty deps - run once on mount

    useEffect(() => {
        if (preSelectedUserId && clients.length > 0) {
            const client = clients.find(c => c.id === preSelectedUserId)
            if (client) {
                setSelectedClient(client)
                setValue("userId", client.id)
            }
        }
    }, [preSelectedUserId, clients, setValue])

    // Fetch sub-types when service type changes
    useEffect(() => {
        if (selectedType?.hasSubTypes) {
            fetchSubTypes(selectedType.code)
        } else {
            setSubTypes([])
            setSelectedSubType(null)
        }
    }, [selectedType])

    // Fetch document requirements when type/subtype changes
    useEffect(() => {
        if (selectedType) {
            fetchDocumentRequirements(selectedType.code, selectedSubType?.code)
        }
    }, [selectedType, selectedSubType])

    // Auto-generate title when type/client changes
    useEffect(() => {
        if (selectedType && selectedClient) {
            const fy = watch("financialYear")
            const ay = watch("assessmentYear")

            let title = selectedSubType?.name || selectedType.name
            if (selectedClient.name) {
                title += ` - ${selectedClient.name}`
            }
            if (ay && selectedType.requiresAssessmentYear) {
                title += ` - AY ${ay}`
            } else if (fy && selectedType.requiresFinancialYear) {
                title += ` - FY ${fy}`
            }

            setValue("title", title)
        }
    }, [selectedType, selectedSubType, selectedClient, watch("financialYear"), watch("assessmentYear")])

    const fetchClients = async () => {
        try {
            const response = await api.get("/project-manager/clients")
            if (response.data.success) {
                setClients(response.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch clients:", error)
        }
    }

    const fetchServiceTypesGrouped = async () => {
        try {
            // Use types-grouped-with-custom to include custom categories/types with isSystem flag
            const response = await api.get("/service-config/types-grouped-with-custom")
            if (response.data.success) {
                setCategoriesWithTypes(response.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch service types:", error)
        }
    }

    const fetchSubTypes = async (serviceTypeCode: string) => {
        try {
            const response = await api.get(`/service-config/sub-types?serviceTypeCode=${serviceTypeCode}`)
            if (response.data.success) {
                setSubTypes(response.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch sub-types:", error)
        }
    }

    const fetchDocumentRequirements = async (typeCode: string, subTypeCode?: string) => {
        try {
            let url = `/service-config/document-requirements?serviceTypeCode=${typeCode}`
            if (subTypeCode) {
                url += `&serviceSubTypeCode=${subTypeCode}`
            }
            const response = await api.get(url)
            if (response.data.success) {
                const docs = response.data.data.all || []
                setDocumentRequirements(docs)
                // Auto-select mandatory documents and convert to SelectedDocumentItem format
                const suggestedDocs: SelectedDocumentItem[] = docs.map((d: DocumentRequirement) => ({
                    documentMasterId: d.id,
                    name: d.documentName,
                    category: d.category || 'Other',
                    isRequired: d.isMandatory,
                    isCustom: false,
                }))
                setSelectedDocumentItems(suggestedDocs.filter((d: SelectedDocumentItem) =>
                    docs.find((doc: DocumentRequirement) => doc.documentName === d.name && doc.isMandatory)
                ))
                // Keep old logic for backward compatibility
                const mandatoryIds = docs.filter((d: DocumentRequirement) => d.isMandatory).map((d: DocumentRequirement) => d.id)
                setSelectedDocuments(mandatoryIds)
            }
        } catch (error) {
            console.error("Failed to fetch document requirements:", error)
        }
    }

    const fetchDocumentLibrary = async () => {
        try {
            const response = await api.get("/service-config/document-library")
            if (response.data.success) {
                setDocumentLibrary(response.data.data.documents)
                setDocumentLibraryGrouped(response.data.data.groupedByCategory)
            }
        } catch (error) {
            console.error("Failed to fetch document library:", error)
        }
    }

    // ============================================
    // FILTERED DATA
    // ============================================

    const filteredClients = useMemo(() => {
        // Sort clients alphabetically by name
        const sortedClients = [...clients].sort((a, b) =>
            (a.name || '').localeCompare(b.name || '')
        )

        if (!clientSearch.trim()) {
            // When no search: show first 10 clients (alphabetically sorted)
            // In a real-world scenario, you might fetch "recent" clients from API
            // based on last service date or interaction timestamp
            return sortedClients.slice(0, 10)
        }

        // When searching: filter by name, email, or phone
        const search = clientSearch.toLowerCase()
        return sortedClients.filter(c =>
            c.name?.toLowerCase().includes(search) ||
            c.email?.toLowerCase().includes(search) ||
            c.phone?.includes(search)
        ).slice(0, 10)
    }, [clients, clientSearch])

    const typesForCategory = useMemo(() => {
        if (!selectedCategory) return []
        const category = categoriesWithTypes.find(c => c.code === selectedCategory)
        return category?.serviceTypes || []
    }, [selectedCategory, categoriesWithTypes])

    // ============================================
    // HANDLERS
    // ============================================

    const handleClientSelect = (client: Client) => {
        setSelectedClient(client)
        setValue("userId", client.id)
        setClientSearch("")
        setIsClientDropdownOpen(false)
    }

    const handleCategoryChange = (categoryCode: string) => {
        // Handle special values
        if (categoryCode === "__clear__") {
            setSelectedCategory("")
            setSelectedType(null)
            setSelectedSubType(null)
            setValue("type", "")
            setValue("subType", "")
            setDocumentRequirements([])
            return
        }
        if (categoryCode === "__add_custom__") {
            setIsAddCategoryModalOpen(true)
            return
        }

        setSelectedCategory(categoryCode)
        setSelectedType(null)
        setSelectedSubType(null)
        setValue("type", "")
        setValue("subType", "")
        setDocumentRequirements([])
    }

    const handleTypeChange = (typeCode: string) => {
        // Handle special values
        if (typeCode === "__clear__") {
            setSelectedType(null)
            setSelectedSubType(null)
            setValue("type", "")
            setValue("subType", "")
            setDocumentRequirements([])
            return
        }
        if (typeCode === "__add_custom__") {
            setIsAddTypeModalOpen(true)
            return
        }

        const type = typesForCategory.find(t => t.code === typeCode)
        if (type) {
            setSelectedType(type)
            setValue("type", type.code)
            setSelectedSubType(null)
            setValue("subType", "")

            // Set default fee if available
            if (type.defaultFee) {
                setValue("feeAmount", type.defaultFee.toString())
            }
        }
    }

    const handleSubTypeChange = (subTypeCode: string) => {
        // Handle special values
        if (subTypeCode === "__clear__") {
            setSelectedSubType(null)
            setValue("subType", "")
            return
        }
        if (subTypeCode === "__add_custom__") {
            setIsAddSubTypeModalOpen(true)
            return
        }

        const subType = subTypes.find(s => s.code === subTypeCode)
        if (subType) {
            setSelectedSubType(subType)
            setValue("subType", subType.code)

            // Override fee if sub-type has default
            if (subType.defaultFee) {
                setValue("feeAmount", subType.defaultFee.toString())
            }
        }
    }

    // Handler for adding custom category
    const handleAddCustomCategory = async () => {
        if (!customCategoryName.trim()) return

        setIsAddingCustom(true)
        try {
            if (editingCategory) {
                // UPDATE existing category
                const response = await api.put(`/service-config/categories/${editingCategory.id}`, {
                    name: customCategoryName,
                })
                console.log("Update category response:", response.data)
                if (response.data.success) {
                    setCategoriesWithTypes(prev =>
                        prev.map(cat => cat.id === editingCategory.id
                            ? { ...cat, name: customCategoryName }
                            : cat
                        )
                    )
                }
            } else {
                // CREATE new category - PERSIST TO DATABASE
                console.log("Creating category:", customCategoryName)
                const response = await api.post("/service-config/categories", {
                    code: customCategoryName.toUpperCase().replace(/\s+/g, '_'),
                    name: customCategoryName,
                    icon: 'MoreHorizontal',
                })
                console.log("Create category response:", response.data)
                if (response.data.success) {
                    const newCategory = {
                        ...response.data.data,
                        serviceTypes: [],
                        isSystem: false,
                    }
                    console.log("New category to add:", newCategory)
                    setCategoriesWithTypes(prev => {
                        console.log("Previous categories:", prev.length)
                        const updated = [...prev, newCategory]
                        console.log("Updated categories:", updated.length)
                        return updated
                    })
                    setSelectedCategory(newCategory.code)
                } else {
                    console.error("Category creation failed:", response.data.message)
                }
            }
            resetCategoryModal()
        } catch (error) {
            console.error("Failed to save custom category:", error)
        } finally {
            setIsAddingCustom(false)
        }
    }

    // Reset category modal
    const resetCategoryModal = () => {
        setCustomCategoryName("")
        setEditingCategory(null)
        setIsAddCategoryModalOpen(false)
    }

    // Open edit modal for category
    const openEditCategoryModal = (category: ServiceCategory) => {
        setEditingCategory(category)
        setCustomCategoryName(category.name)
        setIsAddCategoryModalOpen(true)
    }

    // Handler for adding/editing custom type
    const handleAddCustomType = async () => {
        if (!customTypeName.trim()) return

        setIsAddingCustom(true)
        try {
            const categoryId = categoriesWithTypes.find(c => c.code === selectedCategory)?.id

            if (editingType) {
                // UPDATE existing type
                const response = await api.put(`/service-config/types/${editingType.id}`, {
                    name: customTypeName,
                    description: customTypeDescription,
                    hasSubTypes: customTypeHasSubTypes,
                    requiresFinancialYear: customTypeRequiresFY,
                    requiresAssessmentYear: customTypeRequiresAY,
                    requiresQuarter: customTypeRequiresQuarter,
                    requiresPeriod: customTypeRequiresPeriod,
                    defaultDueDate: customTypeDefaultDueDate,
                    frequency: customTypeFrequency,
                })
                if (response.data.success) {
                    // Update in local state
                    setCategoriesWithTypes(prev =>
                        prev.map(cat => ({
                            ...cat,
                            serviceTypes: cat.serviceTypes?.map(t =>
                                t.id === editingType.id ? { ...t, ...response.data.data } : t
                            )
                        }))
                    )
                    if (selectedType?.id === editingType.id) {
                        setSelectedType({ ...selectedType, ...response.data.data })
                    }
                }
            } else {
                // CREATE new type
                const response = await api.post("/service-config/types", {
                    categoryId,
                    code: customTypeName.toUpperCase().replace(/\s+/g, '_'),
                    name: customTypeName,
                    description: customTypeDescription,
                    hasSubTypes: customTypeHasSubTypes,
                    requiresFinancialYear: customTypeRequiresFY,
                    requiresAssessmentYear: customTypeRequiresAY,
                    requiresQuarter: customTypeRequiresQuarter,
                    requiresPeriod: customTypeRequiresPeriod,
                    defaultDueDate: customTypeDefaultDueDate,
                    frequency: customTypeFrequency,
                })
                if (response.data.success) {
                    const newType = response.data.data
                    setCategoriesWithTypes(prev =>
                        prev.map(cat =>
                            cat.code === selectedCategory
                                ? { ...cat, serviceTypes: [...(cat.serviceTypes || []), newType] }
                                : cat
                        )
                    )
                    setSelectedType(newType)
                    setValue("type", newType.code)
                }
            }
            resetTypeModal()
        } catch (error) {
            console.error("Failed to save custom type:", error)
        } finally {
            setIsAddingCustom(false)
        }
    }

    // Handler for adding/editing custom sub-type
    const handleAddCustomSubType = async () => {
        if (!customSubTypeName.trim()) return

        setIsAddingCustom(true)
        try {
            if (editingSubType) {
                // UPDATE existing sub-type
                const response = await api.put(`/service-config/sub-types/${editingSubType.id}`, {
                    name: customSubTypeName,
                    applicableTo: customSubTypeApplicableTo,
                    dueDateReference: customSubTypeDueDateRef,
                    defaultFee: customSubTypeDefaultFee,
                })
                if (response.data.success) {
                    setSubTypes(prev =>
                        prev.map(s => s.id === editingSubType.id ? { ...s, ...response.data.data } : s)
                    )
                    if (selectedSubType?.id === editingSubType.id) {
                        setSelectedSubType({ ...selectedSubType, ...response.data.data })
                    }
                }
            } else {
                // CREATE new sub-type
                const response = await api.post("/service-config/sub-types", {
                    serviceTypeId: selectedType?.id,
                    code: customSubTypeName.toUpperCase().replace(/\s+/g, '_'),
                    name: customSubTypeName,
                    applicableTo: customSubTypeApplicableTo,
                    dueDateReference: customSubTypeDueDateRef,
                    defaultFee: customSubTypeDefaultFee,
                })
                if (response.data.success) {
                    const newSubType = response.data.data
                    setSubTypes(prev => [...prev, newSubType])
                    setSelectedSubType(newSubType)
                    setValue("subType", newSubType.code)
                }
            }
            resetSubTypeModal()
        } catch (error) {
            console.error("Failed to save custom sub-type:", error)
        } finally {
            setIsAddingCustom(false)
        }
    }

    // Reset modal state helpers
    const resetTypeModal = () => {
        setCustomTypeName("")
        setCustomTypeDescription("")
        setCustomTypeRequiresFY(false)
        setCustomTypeRequiresAY(false)
        setCustomTypeRequiresQuarter(false)
        setCustomTypeRequiresPeriod(false)
        setCustomTypeHasSubTypes(false)
        setCustomTypeDefaultDueDate("")
        setCustomTypeFrequency("")
        setEditingType(null)
        setIsAddTypeModalOpen(false)
    }

    const resetSubTypeModal = () => {
        setCustomSubTypeName("")
        setCustomSubTypeApplicableTo("")
        setCustomSubTypeDueDateRef("")
        setCustomSubTypeDefaultFee("")
        setEditingSubType(null)
        setIsAddSubTypeModalOpen(false)
    }

    // Open edit modal for type
    const openEditTypeModal = (type: ServiceType) => {
        setEditingType(type)
        setCustomTypeName(type.name)
        setCustomTypeDescription(type.description || "")
        setCustomTypeRequiresFY(type.requiresFinancialYear)
        setCustomTypeRequiresAY(type.requiresAssessmentYear)
        setCustomTypeRequiresQuarter(type.requiresQuarter)
        setCustomTypeRequiresPeriod(type.requiresPeriod)
        setCustomTypeHasSubTypes(type.hasSubTypes)
        setCustomTypeDefaultDueDate(type.defaultDueDate || "")
        setCustomTypeFrequency(type.frequency || "")
        setIsAddTypeModalOpen(true)
    }

    // Open edit modal for sub-type
    const openEditSubTypeModal = (subType: ServiceSubType) => {
        setEditingSubType(subType)
        setCustomSubTypeName(subType.name)
        setCustomSubTypeApplicableTo(subType.applicableTo || "")
        setCustomSubTypeDueDateRef(subType.dueDateReference || "")
        setCustomSubTypeDefaultFee(subType.defaultFee?.toString() || "")
        setIsAddSubTypeModalOpen(true)
    }

    // Delete handler
    const handleDelete = async () => {
        if (!deleteTarget) return

        setIsDeleting(true)
        try {
            let endpoint = ""
            if (deleteTarget.type === 'category') {
                endpoint = `/service-config/categories/${deleteTarget.item.id}`
            } else if (deleteTarget.type === 'type') {
                endpoint = `/service-config/types/${deleteTarget.item.id}`
            } else {
                endpoint = `/service-config/sub-types/${deleteTarget.item.id}`
            }

            const response = await api.delete(endpoint)
            if (response.data.success) {
                if (deleteTarget.type === 'category') {
                    setCategoriesWithTypes(prev => prev.filter(c => c.id !== deleteTarget.item.id))
                    if (selectedCategory === deleteTarget.item.code) {
                        setSelectedCategory("")
                        setSelectedType(null)
                    }
                } else if (deleteTarget.type === 'type') {
                    setCategoriesWithTypes(prev =>
                        prev.map(cat => ({
                            ...cat,
                            serviceTypes: cat.serviceTypes?.filter(t => t.id !== deleteTarget.item.id)
                        }))
                    )
                    if (selectedType?.id === deleteTarget.item.id) {
                        setSelectedType(null)
                        setSelectedSubType(null)
                    }
                } else {
                    setSubTypes(prev => prev.filter(s => s.id !== deleteTarget.item.id))
                    if (selectedSubType?.id === deleteTarget.item.id) {
                        setSelectedSubType(null)
                    }
                }
            }
            setIsDeleteConfirmOpen(false)
            setDeleteTarget(null)
        } catch (error) {
            console.error("Failed to delete:", error)
        } finally {
            setIsDeleting(false)
        }
    }

    // Open delete confirmation
    const confirmDelete = (type: 'category' | 'type' | 'subType', item: any) => {
        setDeleteTarget({ type, item })
        setIsDeleteConfirmOpen(true)
    }

    const toggleDocument = (docId: string) => {
        setSelectedDocuments(prev =>
            prev.includes(docId)
                ? prev.filter(id => id !== docId)
                : [...prev, docId]
        )
    }

    // NEW: Toggle document from universal library
    const toggleDocumentItem = (doc: DocumentMasterItem, isFromSuggested: boolean = false, isMandatory: boolean = false) => {
        setSelectedDocumentItems(prev => {
            const existingIndex = prev.findIndex(d => d.name === doc.name)
            if (existingIndex >= 0) {
                // Remove if already selected
                return prev.filter((_, i) => i !== existingIndex)
            } else {
                // Add new selection
                return [...prev, {
                    documentMasterId: doc.id,
                    name: doc.name,
                    category: doc.category,
                    isRequired: isMandatory,
                    isCustom: false,
                }]
            }
        })
    }

    // NEW: Toggle Required/Optional status
    const toggleDocumentRequired = (docName: string) => {
        setSelectedDocumentItems(prev =>
            prev.map(d =>
                d.name === docName
                    ? { ...d, isRequired: !d.isRequired }
                    : d
            )
        )
    }

    // NEW: Add custom document
    const addCustomDocument = () => {
        if (!customDocumentName.trim()) return

        // Check if already exists
        const exists = selectedDocumentItems.some(d =>
            d.name.toLowerCase() === customDocumentName.trim().toLowerCase()
        )
        if (exists) {
            alert("This document is already in the list")
            return
        }

        setSelectedDocumentItems(prev => [...prev, {
            documentMasterId: undefined,
            name: customDocumentName.trim(),
            category: 'Custom',
            isRequired: false,
            isCustom: true,
        }])
        setCustomDocumentName("")
        setIsAddingCustomDoc(false)
    }

    // NEW: Remove custom document
    const removeCustomDocument = (docName: string) => {
        setSelectedDocumentItems(prev => prev.filter(d => d.name !== docName || !d.isCustom))
    }

    // NEW: Check if document is selected
    const isDocumentSelected = (docName: string): boolean => {
        return selectedDocumentItems.some(d => d.name === docName)
    }

    // NEW: Get filtered document library based on search and category
    const filteredDocumentLibrary = useMemo(() => {
        let filtered = documentLibrary

        // Filter by category
        if (documentCategoryFilter !== 'all') {
            filtered = filtered.filter(d => d.category === documentCategoryFilter)
        }

        // Filter by search
        if (documentSearch) {
            const searchLower = documentSearch.toLowerCase()
            filtered = filtered.filter(d =>
                d.name.toLowerCase().includes(searchLower) ||
                d.category.toLowerCase().includes(searchLower)
            )
        }

        // Exclude already selected from suggestions
        filtered = filtered.filter(d =>
            !documentRequirements.some(req => req.documentName === d.name)
        )

        return filtered
    }, [documentLibrary, documentCategoryFilter, documentSearch, documentRequirements])

    // NEW: Get unique categories from document library
    const documentCategories = useMemo(() => {
        const categories = [...new Set(documentLibrary.map(d => d.category))]
        return categories.sort()
    }, [documentLibrary])

    // NEW: Group filtered documents by category for accordion view
    const filteredDocumentsByCategory = useMemo(() => {
        const grouped: Record<string, DocumentMasterItem[]> = {}
        filteredDocumentLibrary.forEach(doc => {
            if (!grouped[doc.category]) {
                grouped[doc.category] = []
            }
            grouped[doc.category].push(doc)
        })
        return grouped
    }, [filteredDocumentLibrary])

    const onSubmit = async (data: ServiceFormData) => {
        setIsLoading(true)
        setError(null)

        try {
            const payload = {
                ...data,
                feeAmount: data.feeAmount ? parseFloat(data.feeAmount) : null,
                dueDate: new Date(data.dueDate).toISOString(),
                // Include selected document names for the request (backward compatibility)
                requestedDocuments: selectedDocumentItems.map(d => d.name),
                // NEW: Include full document details with Required/Optional info
                requiredDocuments: selectedDocumentItems,
            }

            const response = await api.post("/project-manager/services", payload)

            if (response.data.success) {
                // Redirect to the newly created service's details page
                // The ?created=true param triggers a success toast
                const newServiceId = response.data.data?.id
                if (newServiceId) {
                    router.push(`/project-manager/services/${newServiceId}?created=true`)
                } else {
                    // Fallback to list if no ID returned
                    router.push(`/project-manager/services`)
                }
            } else {
                setError(response.data.message || "Failed to create service")
            }
        } catch (err: any) {
            console.error("Create service error:", err)
            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to create service. Please try again."
            )
        } finally {
            setIsLoading(false)
        }
    }

    // ============================================
    // WIZARD STEP CONFIGURATION
    // ============================================

    const steps = [
        { id: 1, title: "Select Client", icon: User, description: "Choose a client" },
        { id: 2, title: "Service Type", icon: Briefcase, description: "Select service category & type" },
        { id: 3, title: "Service Details", icon: Calendar, description: "Set dates, fees & notes" },
        { id: 4, title: "Documents", icon: FolderOpen, description: "Select required documents" },
    ]

    // Validate if can proceed to next step
    const canProceedFromStep = (step: number): boolean => {
        switch (step) {
            case 1:
                return !!selectedClient
            case 2:
                return !!selectedType
            case 3:
                const formValues = watch()
                return !!formValues.title && !!formValues.dueDate
            case 4:
                return true // Documents are optional
            default:
                return false
        }
    }

    const goToNextStep = () => {
        if (currentStep < 4 && canProceedFromStep(currentStep)) {
            setCompletedSteps(prev => [...prev.filter(s => s !== currentStep), currentStep])
            setCurrentStep(prev => prev + 1)
        }
    }

    const goToPrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1)
        }
    }

    const goToStep = (step: number) => {
        // Can only go to previous steps or already completed steps
        if (step < currentStep || completedSteps.includes(step) || step === currentStep + 1 && canProceedFromStep(currentStep)) {
            if (step > currentStep && canProceedFromStep(currentStep)) {
                setCompletedSteps(prev => [...prev.filter(s => s !== currentStep), currentStep])
            }
            setCurrentStep(step)
        }
    }

    const toggleCategory = (category: string) => {
        setCollapsedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        )
    }

    // Get step status
    const getStepStatus = (stepId: number): 'completed' | 'current' | 'upcoming' => {
        if (completedSteps.includes(stepId)) return 'completed'
        if (stepId === currentStep) return 'current'
        return 'upcoming'
    }

    // ============================================
    // RENDER
    // ============================================

    return (
        <div className="min-h-screen pb-24">
            {/* Header with Progress - scrolls with page */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-xl">
                <div className="max-w-6xl mx-auto px-4 py-3">
                    {/* Top Row: Back button, Title (left) and Progress (right) */}
                    <div className="flex items-center justify-between mb-4">
                        {/* Left side - Back button and Title */}
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="sm" asChild className="text-white hover:bg-white/10 -ml-2">
                                <Link href="/project-manager/services">
                                    <ArrowLeft className="h-4 w-4 mr-1" />
                                    Back
                                </Link>
                            </Button>
                            <div className="h-6 w-px bg-slate-700" />
                            <div>
                                <h1 className="text-lg font-bold text-white">Create New Service</h1>
                                <p className="text-slate-400 text-xs">
                                    Step {currentStep} of 4 — {steps[currentStep - 1].description}
                                </p>
                            </div>
                        </div>

                        {/* Right side - Progress */}
                        <div className="text-right">
                            <div className="text-xs text-slate-400">Progress</div>
                            <div className="text-xl font-bold text-emerald-400">
                                {Math.round(((currentStep - 1 + (currentStep === 4 ? 1 : 0)) / 4) * 100)}%
                            </div>
                        </div>
                    </div>

                    {/* Compact Step Progress Indicator */}
                    <div className="flex items-center justify-between relative pb-1">
                        {/* Progress Line Background */}
                        <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-700 mx-10" />
                        {/* Progress Line Fill */}
                        <div
                            className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 mx-10 transition-all duration-500"
                            style={{ width: `${((currentStep - 1) / 3) * 100}%`, maxWidth: 'calc(100% - 5rem)' }}
                        />

                        {steps.map((step, index) => {
                            const status = getStepStatus(step.id)
                            const StepIcon = step.icon
                            const isClickable = step.id <= currentStep || completedSteps.includes(step.id) || (step.id === currentStep + 1 && canProceedFromStep(currentStep))

                            return (
                                <button
                                    key={step.id}
                                    type="button"
                                    onClick={() => goToStep(step.id)}
                                    disabled={!isClickable}
                                    className={`flex flex-col items-center group relative z-10 transition-all duration-300 ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                                        }`}
                                >
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${status === 'completed'
                                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                                            : status === 'current'
                                                ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-500/30'
                                                : 'bg-slate-700 text-slate-400'
                                            } ${isClickable && status !== 'current' ? 'group-hover:scale-110' : ''}`}
                                    >
                                        {status === 'completed' ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            <StepIcon className="h-4 w-4" />
                                        )}
                                    </div>
                                    <span className={`mt-1 text-xs font-medium transition-colors ${status === 'current'
                                        ? 'text-white'
                                        : status === 'completed'
                                            ? 'text-emerald-400'
                                            : 'text-slate-500'
                                        }`}>
                                        {step.title}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content Area - with more top padding to account for header */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Step 1: Select Client */}
                    {currentStep === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                                <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                                            <User className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">Select Client</CardTitle>
                                            <CardDescription>Choose the client for this service</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0 space-y-4">
                                    {/* Search Bar - Always Visible */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Search clients by name, email, or phone..."
                                            value={clientSearch}
                                            onChange={(e) => setClientSearch(e.target.value)}
                                            className="pl-10 h-11 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                                        />
                                        {clientSearch && (
                                            <button
                                                type="button"
                                                onClick={() => setClientSearch("")}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                            >
                                                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Selected Client Display */}
                                    {selectedClient && (
                                        <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border-2 border-cyan-500 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                                                    {selectedClient.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-white">{selectedClient.name}</div>
                                                    {selectedClient.email && (
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">{selectedClient.email}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-cyan-500 text-white">Selected</Badge>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedClient(null)
                                                        setValue("userId", "")
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Client Grid - Always Visible */}
                                    {!selectedClient && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                                <span>
                                                    {clientSearch
                                                        ? `${filteredClients.length} results for "${clientSearch}"`
                                                        : `All Clients (${filteredClients.length})`
                                                    }
                                                </span>
                                            </div>

                                            <div className="max-h-[400px] overflow-y-auto border rounded-xl bg-gray-50 dark:bg-slate-800/50">
                                                {filteredClients.length === 0 ? (
                                                    <div className="p-12 text-center">
                                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                            <User className="h-8 w-8 text-gray-400" />
                                                        </div>
                                                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">No clients found</h3>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {clientSearch ? `No matches for "${clientSearch}"` : "No clients available"}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
                                                        {filteredClients.map((client) => (
                                                            <button
                                                                key={client.id}
                                                                type="button"
                                                                onClick={() => handleClientSelect(client)}
                                                                className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all duration-200 text-left group"
                                                            >
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium group-hover:from-cyan-500 group-hover:to-blue-600 group-hover:text-white transition-all">
                                                                    {client.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-medium text-gray-900 dark:text-white truncate">
                                                                        {client.name}
                                                                    </div>
                                                                    {client.email && (
                                                                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                                            {client.email}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-cyan-500 transition-colors" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {errors.userId && (
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            {errors.userId.message}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Step 1 Navigation */}
                            <div className="flex justify-end mt-6">
                                <Button
                                    type="button"
                                    onClick={goToNextStep}
                                    disabled={!canProceedFromStep(1)}
                                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Continue to Service Type
                                    <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Select Service Type */}
                    {currentStep === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                                <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-600" />
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                                            <Briefcase className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">Select Service Type</CardTitle>
                                            <CardDescription>Choose the category and type of service</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Three-column grid for selections */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Category Field */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium flex items-center gap-2">
                                                <div className="w-5 h-5 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                                    <FolderOpen className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                                                </div>
                                                Category
                                            </Label>
                                            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                                                <SelectTrigger className="h-11 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {/* Clear option - only show if something is selected */}
                                                    {selectedCategory && (
                                                        <>
                                                            <SelectItem value="__clear__" className="text-gray-500">
                                                                <span className="flex items-center gap-2">
                                                                    <RotateCcw className="h-3.5 w-3.5" />
                                                                    Clear Selection
                                                                </span>
                                                            </SelectItem>
                                                            <SelectSeparator />
                                                        </>
                                                    )}

                                                    {/* Categories list */}
                                                    {categoriesWithTypes.map((cat) => (
                                                        <SelectItem key={cat.code} value={cat.code}>
                                                            {cat.name}
                                                        </SelectItem>
                                                    ))}

                                                    {/* Add Custom option */}
                                                    <SelectSeparator />
                                                    <SelectItem value="__add_custom__" className="text-primary font-medium">
                                                        <span className="flex items-center gap-2">
                                                            <Plus className="h-3.5 w-3.5" />
                                                            Add Custom Category
                                                        </span>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {/* Edit/Delete buttons for selected custom category */}
                                            {selectedCategory && (() => {
                                                const cat = categoriesWithTypes.find(c => c.code === selectedCategory)
                                                return cat && cat.isSystem === false ? (
                                                    <div className="flex gap-1 ml-1">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-9 w-9 p-0 text-gray-500 hover:text-primary"
                                                            onClick={() => openEditCategoryModal(cat)}
                                                            title="Edit Category"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-9 w-9 p-0 text-gray-500 hover:text-red-500"
                                                            onClick={() => confirmDelete('category', cat)}
                                                            title="Delete Category"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : null
                                            })()}
                                        </div>

                                        {/* Service Type Field */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium flex items-center gap-2">
                                                <div className="w-5 h-5 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                                    <Briefcase className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                                                </div>
                                                Service Type <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={selectedType?.code || ""}
                                                onValueChange={handleTypeChange}
                                                disabled={!selectedCategory}
                                            >
                                                <SelectTrigger className={`h-11 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 ${errors.type ? "border-red-500" : ""}`}>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {/* Clear option - only show if something is selected */}
                                                    {selectedType && (
                                                        <>
                                                            <SelectItem value="__clear__" className="text-gray-500">
                                                                <span className="flex items-center gap-2">
                                                                    <RotateCcw className="h-3.5 w-3.5" />
                                                                    Clear Selection
                                                                </span>
                                                            </SelectItem>
                                                            <SelectSeparator />
                                                        </>
                                                    )}

                                                    {/* Types list */}
                                                    {typesForCategory.length === 0 && !selectedCategory ? (
                                                        <div className="px-2 py-3 text-sm text-gray-500 text-center">
                                                            Select a category first
                                                        </div>
                                                    ) : typesForCategory.length === 0 ? (
                                                        <div className="px-2 py-3 text-sm text-gray-500 text-center">
                                                            No types in this category
                                                        </div>
                                                    ) : (
                                                        typesForCategory.map((type) => (
                                                            <SelectItem
                                                                key={type.code}
                                                                value={type.code}
                                                            >
                                                                {type.name}
                                                            </SelectItem>
                                                        ))
                                                    )}

                                                    {/* Add Custom option - only if category selected */}
                                                    {selectedCategory && (
                                                        <>
                                                            <SelectSeparator />
                                                            <SelectItem value="__add_custom__" className="text-primary font-medium">
                                                                <span className="flex items-center gap-2">
                                                                    <Plus className="h-3.5 w-3.5" />
                                                                    Add Custom Service Type
                                                                </span>
                                                            </SelectItem>
                                                        </>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {/* Edit/Delete buttons for selected custom service type */}
                                            {selectedType && selectedType.isSystem === false && (
                                                <div className="flex gap-1 ml-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-9 w-9 p-0 text-gray-500 hover:text-primary"
                                                        onClick={() => openEditTypeModal(selectedType)}
                                                        title="Edit Service Type"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-9 w-9 p-0 text-gray-500 hover:text-red-500"
                                                        onClick={() => confirmDelete('type', selectedType)}
                                                        title="Delete Service Type"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                            {errors.type && (
                                                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                                            )}
                                        </div>

                                        {/* Sub Type Field - Always show column for consistent layout */}
                                        <div className="space-y-2">
                                            <Label className={`text-sm font-medium flex items-center gap-2 ${!selectedType?.hasSubTypes ? "text-gray-400" : ""}`}>
                                                <div className={`w-5 h-5 rounded flex items-center justify-center ${!selectedType?.hasSubTypes ? "bg-gray-100 dark:bg-gray-800" : "bg-purple-100 dark:bg-purple-900/30"}`}>
                                                    <FileText className={`h-3 w-3 ${!selectedType?.hasSubTypes ? "text-gray-400" : "text-purple-600 dark:text-purple-400"}`} />
                                                </div>
                                                Sub-Type
                                            </Label>
                                            <Select
                                                value={selectedSubType?.code || ""}
                                                onValueChange={handleSubTypeChange}
                                                disabled={!selectedType?.hasSubTypes}
                                            >
                                                <SelectTrigger className={`h-11 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 ${!selectedType?.hasSubTypes ? "opacity-50" : ""}`}>
                                                    <SelectValue placeholder={selectedType?.hasSubTypes ? "Select sub-type" : "N/A"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {/* Clear option - only show if something is selected */}
                                                    {selectedSubType && (
                                                        <>
                                                            <SelectItem value="__clear__" className="text-gray-500">
                                                                <span className="flex items-center gap-2">
                                                                    <RotateCcw className="h-3.5 w-3.5" />
                                                                    Clear Selection
                                                                </span>
                                                            </SelectItem>
                                                            <SelectSeparator />
                                                        </>
                                                    )}

                                                    {/* Sub-types list */}
                                                    {subTypes.length === 0 ? (
                                                        <div className="px-2 py-3 text-sm text-gray-500 text-center">
                                                            No sub-types available
                                                        </div>
                                                    ) : (
                                                        subTypes.map((sub) => (
                                                            <SelectItem
                                                                key={sub.code}
                                                                value={sub.code}
                                                            >
                                                                {sub.name}
                                                            </SelectItem>
                                                        ))
                                                    )}

                                                    {/* Add Custom option */}
                                                    {selectedType?.hasSubTypes && (
                                                        <>
                                                            <SelectSeparator />
                                                            <SelectItem value="__add_custom__" className="text-primary font-medium">
                                                                <span className="flex items-center gap-2">
                                                                    <Plus className="h-3.5 w-3.5" />
                                                                    Add Custom Sub-Type
                                                                </span>
                                                            </SelectItem>
                                                        </>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {/* Edit/Delete buttons for selected custom sub-type */}
                                            {selectedSubType && selectedSubType.isSystem === false && (
                                                <div className="flex gap-1 ml-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-9 w-9 p-0 text-gray-500 hover:text-primary"
                                                        onClick={() => openEditSubTypeModal(selectedSubType)}
                                                        title="Edit Sub-Type"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-9 w-9 p-0 text-gray-500 hover:text-red-500"
                                                        onClick={() => confirmDelete('subType', selectedSubType)}
                                                        title="Delete Sub-Type"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Service Type Info Card */}
                                    {selectedType && (
                                        <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-primary" />
                                                        {selectedType.name}
                                                        {/* Show Custom badge for non-system types */}
                                                        {selectedType.isSystem === false && (
                                                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                                                                Custom
                                                            </Badge>
                                                        )}
                                                    </h4>
                                                    {selectedType.description && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                            {selectedType.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {/* Edit/Delete buttons for custom types */}
                                                    {selectedType.isSystem === false && (
                                                        <div className="flex gap-1 mr-2">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 w-7 p-0 text-gray-500 hover:text-primary"
                                                                onClick={() => openEditTypeModal(selectedType)}
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 w-7 p-0 text-gray-500 hover:text-red-500"
                                                                onClick={() => confirmDelete('type', selectedType)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                    <div className="flex flex-wrap gap-1">
                                                        {selectedType.frequency && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                {selectedType.frequency}
                                                            </Badge>
                                                        )}
                                                        {selectedType.defaultDueDate && (
                                                            <Badge variant="outline" className="text-xs">
                                                                Due: {selectedType.defaultDueDate}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Deliverables - Progressive Disclosure */}
                                            {/* Case 1: Service WITHOUT sub-types - show deliverables immediately */}
                                            {selectedType.deliverables && selectedType.deliverables.length > 0 && !selectedType.hasSubTypes && (
                                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                                        What's Included:
                                                    </p>
                                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                                        {selectedType.deliverables.map((item, index) => (
                                                            <li key={index} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                                                                {item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Case 2: Service WITH sub-types but no sub-type selected - show hint */}
                                            {selectedType.hasSubTypes && !selectedSubType && (
                                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                                                        <Info className="h-4 w-4 flex-shrink-0" />
                                                        <span>Select a sub-type to see detailed deliverables</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Case 3: Sub-type selected - show sub-type specific deliverables */}
                                            {selectedSubType && selectedSubType.deliverables && selectedSubType.deliverables.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                                    <div className="mb-2 flex items-start justify-between">
                                                        <div>
                                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
                                                                {selectedSubType.name} - What's Included:
                                                                {/* Show Custom badge for non-system sub-types */}
                                                                {selectedSubType.isSystem === false && (
                                                                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 normal-case">
                                                                        Custom
                                                                    </Badge>
                                                                )}
                                                            </p>
                                                            {selectedSubType.applicableTo && (
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                    For: {selectedSubType.applicableTo}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {/* Edit/Delete buttons for custom sub-types */}
                                                        {selectedSubType.isSystem === false && (
                                                            <div className="flex gap-1">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0 text-gray-500 hover:text-primary"
                                                                    onClick={() => openEditSubTypeModal(selectedSubType)}
                                                                >
                                                                    <Pencil className="h-3 w-3" />
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0 text-gray-500 hover:text-red-500"
                                                                    onClick={() => confirmDelete('subType', selectedSubType)}
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                                        {selectedSubType.deliverables.map((item, index) => (
                                                            <li key={index} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                                                                {item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    {selectedSubType.dueDateReference && (
                                                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                                            <Badge variant="outline" className="text-xs">
                                                                Due: {selectedSubType.dueDateReference}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Requirements badges */}
                                            {(selectedType.requiresFinancialYear || selectedType.requiresAssessmentYear || selectedType.requiresQuarter) && (
                                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex flex-wrap gap-2">
                                                    {selectedType.requiresFinancialYear && (
                                                        <Badge variant="secondary" className="text-xs">Requires Financial Year</Badge>
                                                    )}
                                                    {selectedType.requiresAssessmentYear && (
                                                        <Badge variant="secondary" className="text-xs">Requires Assessment Year</Badge>
                                                    )}
                                                    {selectedType.requiresQuarter && (
                                                        <Badge variant="secondary" className="text-xs">Quarterly Service</Badge>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Helper text */}
                                    {!selectedType && (
                                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-2">
                                            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                            <div className="text-sm text-blue-700 dark:text-blue-300">
                                                <p><strong>Need a custom service?</strong> Use the "+ Add Custom" option at the bottom of each dropdown to add services not in our catalog.</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Step 2 Navigation */}
                            <div className="flex justify-between mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={goToPrevStep}
                                    className="px-6"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    onClick={goToNextStep}
                                    disabled={!canProceedFromStep(2)}
                                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-2 shadow-lg"
                                >
                                    Continue to Details
                                    <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Service Details */}
                    {currentStep === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                                <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                                            <Calendar className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">Service Details</CardTitle>
                                            <CardDescription>Enter the service information</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Service Name */}
                                        <div className="md:col-span-2 space-y-2">
                                            <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                                                <div className="w-5 h-5 rounded bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                                    <FileText className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                                                </div>
                                                Service Name <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="title"
                                                {...register("title")}
                                                placeholder="Auto-generated based on selections"
                                                className={`h-11 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 ${errors.title ? "border-red-500" : ""}`}
                                            />
                                            {errors.title && (
                                                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                                            )}
                                        </div>

                                        {/* Financial Year - Show only if required */}
                                        {selectedType?.requiresFinancialYear && (
                                            <div>
                                                <Label htmlFor="financialYear">
                                                    Financial Year {selectedType.requiresFinancialYear && <span className="text-red-500">*</span>}
                                                </Label>
                                                <Select onValueChange={(v) => {
                                                    setValue("financialYear", v)
                                                    // Auto-set Assessment Year if required
                                                    if (selectedType?.requiresAssessmentYear) {
                                                        const [startYear] = v.split('-')
                                                        const ayStart = parseInt(startYear) + 1
                                                        setValue("assessmentYear", `${ayStart}-${(ayStart + 1).toString().slice(-2)}`)
                                                    }
                                                }}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select FY" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {/* Use pre-generated options from state */}
                                                        {fyOptions.map((opt) => (
                                                            <SelectItem key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {/* Assessment Year - Show only if required */}
                                        {selectedType?.requiresAssessmentYear && (
                                            <div>
                                                <Label htmlFor="assessmentYear">
                                                    Assessment Year <span className="text-red-500">*</span>
                                                </Label>
                                                <Select onValueChange={(v) => setValue("assessmentYear", v)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select AY" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {/* Use pre-generated options from state */}
                                                        {ayOptions.map((opt) => (
                                                            <SelectItem key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {/* Quarter - Show only if required */}
                                        {selectedType?.requiresQuarter && (
                                            <div>
                                                <Label htmlFor="quarter">Quarter</Label>
                                                <Select onValueChange={(v) => setValue("quarter", v)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Quarter" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Q1">Q1 (Apr-Jun)</SelectItem>
                                                        <SelectItem value="Q2">Q2 (Jul-Sep)</SelectItem>
                                                        <SelectItem value="Q3">Q3 (Oct-Dec)</SelectItem>
                                                        <SelectItem value="Q4">Q4 (Jan-Mar)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {/* Period (Month) - Show only if required */}
                                        {selectedType?.requiresPeriod && (
                                            <div>
                                                <Label htmlFor="period">Period (Month)</Label>
                                                <Select onValueChange={(v) => setValue("period", v)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Month" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {/* Use pre-generated options from state */}
                                                        {periodOptions.map((opt) => (
                                                            <SelectItem key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {/* Internal Target Date */}
                                        <div className="space-y-2">
                                            <Label htmlFor="dueDate" className="text-sm font-medium flex items-center gap-2">
                                                <div className="w-5 h-5 rounded bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                                    <Calendar className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                                                </div>
                                                Internal Target Date <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="dueDate"
                                                type="date"
                                                {...register("dueDate")}
                                                className={`h-11 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 ${errors.dueDate ? "border-red-500" : ""}`}
                                            />
                                            {selectedType?.defaultDueDate && (
                                                <p className="text-xs text-amber-600 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    Statutory deadline: {selectedType.defaultDueDate}
                                                </p>
                                            )}
                                            {errors.dueDate && (
                                                <p className="text-sm text-red-600">{errors.dueDate.message}</p>
                                            )}
                                        </div>

                                        {/* Fee Amount */}
                                        <div className="space-y-2">
                                            <Label htmlFor="feeAmount" className="text-sm font-medium flex items-center gap-2">
                                                <div className="w-5 h-5 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                    <span className="text-xs font-bold text-green-600 dark:text-green-400">₹</span>
                                                </div>
                                                Fee Amount
                                            </Label>
                                            <Input
                                                id="feeAmount"
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                {...register("feeAmount")}
                                                className="h-11 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                                            />
                                        </div>

                                        {/* Priority */}
                                        <div className="space-y-2">
                                            <Label htmlFor="priority" className="text-sm font-medium flex items-center gap-2">
                                                <div className="w-5 h-5 rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                                    <AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400" />
                                                </div>
                                                Priority
                                            </Label>
                                            <Select onValueChange={(v) => setValue("priority", v)} defaultValue="NORMAL">
                                                <SelectTrigger className="h-11 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                                                    <SelectValue placeholder="Select Priority" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="LOW">Low</SelectItem>
                                                    <SelectItem value="NORMAL">Normal</SelectItem>
                                                    <SelectItem value="HIGH">High</SelectItem>
                                                    <SelectItem value="URGENT">Urgent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                                            <div className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                <FileText className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            Description
                                        </Label>
                                        <Textarea
                                            id="description"
                                            rows={2}
                                            placeholder="General description of this service..."
                                            {...register("description")}
                                            className="bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 min-h-[80px]"
                                        />
                                    </div>

                                    {/* Client Notes - Visible to client */}
                                    <div className="space-y-2">
                                        <Label htmlFor="clientNotes" className="text-sm font-medium flex items-center gap-2">
                                            <div className="w-5 h-5 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                <User className="h-3 w-3 text-green-600 dark:text-green-400" />
                                            </div>
                                            Client Notes
                                            <Badge variant="outline" className="text-xs ml-1 bg-green-50 border-green-200 text-green-600">Visible to client</Badge>
                                        </Label>
                                        <Textarea
                                            id="clientNotes"
                                            rows={2}
                                            placeholder="Notes that the client will see on their portal..."
                                            {...register("clientNotes")}
                                            className="bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 min-h-[80px]"
                                        />
                                    </div>

                                    {/* Internal Notes - Team only */}
                                    <div className="space-y-2">
                                        <Label htmlFor="internalNotes" className="text-sm font-medium flex items-center gap-2">
                                            <div className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                <Info className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                                            </div>
                                            Internal Notes
                                            <Badge variant="outline" className="text-xs ml-1 bg-gray-50 border-gray-200 text-gray-600">Team only</Badge>
                                        </Label>
                                        <Textarea
                                            id="internalNotes"
                                            rows={2}
                                            placeholder="Private notes for team members only..."
                                            {...register("internalNotes")}
                                            className="bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 min-h-[80px]"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Step 3 Navigation */}
                            <div className="flex justify-between mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={goToPrevStep}
                                    className="px-6"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    onClick={goToNextStep}
                                    disabled={!canProceedFromStep(3)}
                                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-2 shadow-lg"
                                >
                                    Continue to Documents
                                    <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Document Requirements - ENHANCED */}
                    {currentStep === 4 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                                <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                                            <FolderOpen className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">Required Documents</CardTitle>
                                            <CardDescription>Select documents needed for this service</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Suggested Documents for System Services */}
                                    {documentRequirements.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                Suggested for {selectedType?.name || "this service"}
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {documentRequirements.map((doc) => {
                                                    const isSelected = isDocumentSelected(doc.documentName)
                                                    const selectedDoc = selectedDocumentItems.find(d => d.name === doc.documentName)
                                                    return (
                                                        <div
                                                            key={doc.id}
                                                            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isSelected
                                                                ? "bg-primary/5 border-primary"
                                                                : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                                                }`}
                                                        >
                                                            <label className="flex items-center gap-3 flex-1 cursor-pointer">
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    onCheckedChange={() => {
                                                                        const docAsLibrary: DocumentMasterItem = {
                                                                            id: doc.id,
                                                                            code: doc.id,
                                                                            name: doc.documentName,
                                                                            category: doc.category || 'Other',
                                                                            description: doc.description,
                                                                        }
                                                                        toggleDocumentItem(docAsLibrary, true, doc.isMandatory)
                                                                    }}
                                                                />
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-medium text-gray-900 dark:text-white text-sm">
                                                                            {doc.documentName}
                                                                        </span>
                                                                        {doc.isMandatory && (
                                                                            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                                                                                Suggested
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    {doc.category && (
                                                                        <span className="text-xs text-gray-500">{doc.category}</span>
                                                                    )}
                                                                </div>
                                                            </label>
                                                            {isSelected && (
                                                                <Select
                                                                    value={selectedDoc?.isRequired ? "required" : "optional"}
                                                                    onValueChange={(val) => toggleDocumentRequired(doc.documentName)}
                                                                >
                                                                    <SelectTrigger className="w-[110px] h-8 text-xs">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="required">
                                                                            <span className="text-red-600">Required</span>
                                                                        </SelectItem>
                                                                        <SelectItem value="optional">
                                                                            <span className="text-gray-600">Optional</span>
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Universal Document Library */}
                                    <div className="space-y-3 border-t pt-4">
                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Search className="h-4 w-4" />
                                            {documentRequirements.length > 0 ? "Add More Documents" : "Select Documents from Library"}
                                        </h4>

                                        {/* Search and Filter */}
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    placeholder="Search documents..."
                                                    value={documentSearch}
                                                    onChange={(e) => setDocumentSearch(e.target.value)}
                                                    className="pl-9"
                                                />
                                                {documentSearch && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setDocumentSearch("")}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                                    >
                                                        <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                                    </button>
                                                )}
                                            </div>
                                            <Select value={documentCategoryFilter} onValueChange={setDocumentCategoryFilter}>
                                                <SelectTrigger className="w-[160px]">
                                                    <SelectValue placeholder="All Categories" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Categories</SelectItem>
                                                    {documentCategories.map(cat => (
                                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Document List - Grouped by Category */}
                                        <div className="max-h-[400px] overflow-y-auto border rounded-lg bg-gray-50 dark:bg-slate-800/50">
                                            {Object.keys(filteredDocumentsByCategory).length === 0 ? (
                                                <div className="p-8 text-center text-gray-500">
                                                    <FolderOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                                    {documentSearch ? "No documents match your search" : "No more documents available"}
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                                    {Object.entries(filteredDocumentsByCategory).map(([category, docs]) => {
                                                        const isCollapsed = collapsedCategories.includes(category)
                                                        const selectedCount = docs.filter(d => isDocumentSelected(d.name)).length

                                                        return (
                                                            <div key={category}>
                                                                {/* Category Header */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleCategory(category)}
                                                                    className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors sticky top-0 z-10"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedCount > 0
                                                                            ? 'bg-emerald-100 dark:bg-emerald-900/30'
                                                                            : 'bg-gray-100 dark:bg-gray-800'
                                                                            }`}>
                                                                            <FolderOpen className={`h-4 w-4 ${selectedCount > 0
                                                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                                                : 'text-gray-500'
                                                                                }`} />
                                                                        </div>
                                                                        <div className="text-left">
                                                                            <span className="font-medium text-gray-900 dark:text-white text-sm">
                                                                                {category}
                                                                            </span>
                                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                                <span className="text-xs text-gray-500">{docs.length} documents</span>
                                                                                {selectedCount > 0 && (
                                                                                    <Badge className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                                                        {selectedCount} selected
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    {isCollapsed ? (
                                                                        <ChevronRight className="h-5 w-5 text-gray-400" />
                                                                    ) : (
                                                                        <ChevronDown className="h-5 w-5 text-gray-400" />
                                                                    )}
                                                                </button>

                                                                {/* Category Documents */}
                                                                {!isCollapsed && (
                                                                    <div className="bg-white dark:bg-slate-900/50 border-t border-gray-100 dark:border-gray-800">
                                                                        {docs.map((doc) => {
                                                                            const isSelected = isDocumentSelected(doc.name)
                                                                            const selectedDoc = selectedDocumentItems.find(d => d.name === doc.name)
                                                                            return (
                                                                                <div
                                                                                    key={doc.id}
                                                                                    className={`flex items-center justify-between px-4 py-2.5 pl-14 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-b-0 ${isSelected ? "bg-emerald-50/50 dark:bg-emerald-900/10" : ""
                                                                                        }`}
                                                                                >
                                                                                    <label className="flex items-center gap-3 flex-1 cursor-pointer">
                                                                                        <Checkbox
                                                                                            checked={isSelected}
                                                                                            onCheckedChange={() => toggleDocumentItem(doc)}
                                                                                            className={isSelected ? "border-emerald-500 data-[state=checked]:bg-emerald-500" : ""}
                                                                                        />
                                                                                        <span className={`text-sm ${isSelected ? "font-medium text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                                                                                            {doc.name}
                                                                                        </span>
                                                                                    </label>
                                                                                    {isSelected && (
                                                                                        <Select
                                                                                            value={selectedDoc?.isRequired ? "required" : "optional"}
                                                                                            onValueChange={() => toggleDocumentRequired(doc.name)}
                                                                                        >
                                                                                            <SelectTrigger className="w-[100px] h-7 text-xs border-0 bg-gray-100 dark:bg-gray-800">
                                                                                                <SelectValue />
                                                                                            </SelectTrigger>
                                                                                            <SelectContent>
                                                                                                <SelectItem value="required">
                                                                                                    <span className="text-red-600 font-medium">Required</span>
                                                                                                </SelectItem>
                                                                                                <SelectItem value="optional">
                                                                                                    <span className="text-gray-600">Optional</span>
                                                                                                </SelectItem>
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                    )}
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Custom Documents Section */}
                                    <div className="space-y-3 border-t pt-4">
                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Plus className="h-4 w-4" />
                                            Custom Documents
                                        </h4>

                                        {/* Display custom documents */}
                                        {selectedDocumentItems.filter(d => d.isCustom).map((doc) => (
                                            <div
                                                key={doc.name}
                                                className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Checkbox checked={true} disabled />
                                                    <span className="text-sm font-medium">{doc.name}</span>
                                                    <Badge className="bg-orange-100 text-orange-700 text-xs">Custom</Badge>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Select
                                                        value={doc.isRequired ? "required" : "optional"}
                                                        onValueChange={() => toggleDocumentRequired(doc.name)}
                                                    >
                                                        <SelectTrigger className="w-[110px] h-8 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="required">
                                                                <span className="text-red-600">Required</span>
                                                            </SelectItem>
                                                            <SelectItem value="optional">
                                                                <span className="text-gray-600">Optional</span>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeCustomDocument(doc.name)}
                                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add Custom Document Input */}
                                        {isAddingCustomDoc ? (
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Enter custom document name..."
                                                    value={customDocumentName}
                                                    onChange={(e) => setCustomDocumentName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault()
                                                            addCustomDocument()
                                                        }
                                                    }}
                                                    autoFocus
                                                />
                                                <Button type="button" onClick={addCustomDocument} size="sm">
                                                    Add
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setIsAddingCustomDoc(false)
                                                        setCustomDocumentName("")
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsAddingCustomDoc(true)}
                                                className="w-full"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Custom Document
                                            </Button>
                                        )}
                                    </div>

                                    {/* Selection Summary */}
                                    {selectedDocumentItems.length > 0 && (
                                        <div className="border-t pt-4 space-y-3">
                                            <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4" />
                                                Selected Documents ({selectedDocumentItems.length})
                                            </h4>
                                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {selectedDocumentItems.map((doc) => (
                                                        <div key={doc.name} className="flex items-center justify-between text-sm">
                                                            <span className="flex items-center gap-2">
                                                                <span className={doc.isRequired ? "text-red-600" : "text-gray-600"}>
                                                                    {doc.isRequired ? "●" : "○"}
                                                                </span>
                                                                <span className="text-gray-800 dark:text-gray-200">{doc.name}</span>
                                                                {doc.isCustom && (
                                                                    <Badge className="text-xs bg-orange-100 text-orange-700">Custom</Badge>
                                                                )}
                                                            </span>
                                                            <span className={`text-xs ${doc.isRequired ? "text-red-600" : "text-gray-500"}`}>
                                                                {doc.isRequired ? "Required" : "Optional"}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400">
                                                    Client will see: {selectedDocumentItems.filter(d => d.isRequired).length} Required, {selectedDocumentItems.filter(d => !d.isRequired).length} Optional documents
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Info Box */}
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-2">
                                        <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            Documents marked as "Required" will be highlighted for the client. All selected documents will be requested after service creation.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Step 4 Navigation - Final Submit */}
                            <div className="flex justify-between mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={goToPrevStep}
                                    className="px-6"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    Back
                                </Button>
                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" asChild>
                                        <Link href="/project-manager/services">Cancel</Link>
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-2 shadow-lg min-w-[160px]"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                                Create Service
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </div>

            {/* Modal for adding/editing custom category */}
            <Dialog open={isAddCategoryModalOpen} onOpenChange={(open) => { if (!open) resetCategoryModal() }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Edit' : 'Add'} Category</DialogTitle>
                        <DialogDescription>
                            {editingCategory
                                ? `Editing "${editingCategory.name}"`
                                : 'Create a new service category for your firm. This will be available for all future services.'
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="customCategory">Category Name *</Label>
                            <Input
                                id="customCategory"
                                placeholder="e.g., Legal Services, Advisory"
                                value={customCategoryName}
                                onChange={(e) => setCustomCategoryName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={resetCategoryModal}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddCustomCategory}
                            disabled={!customCategoryName.trim() || isAddingCustom}
                        >
                            {isAddingCustom ? (
                                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
                            ) : editingCategory ? (
                                <><CheckCircle2 className="h-4 w-4 mr-2" /> Save Changes</>
                            ) : (
                                <><Plus className="h-4 w-4 mr-2" /> Add Category</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal for adding/editing custom service type */}
            <Dialog open={isAddTypeModalOpen} onOpenChange={(open) => { if (!open) resetTypeModal() }}>
                <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingType ? 'Edit' : 'Add'} Service Type</DialogTitle>
                        <DialogDescription>
                            {editingType
                                ? `Editing "${editingType.name}"`
                                : `Create a new service type under "${categoriesWithTypes.find(c => c.code === selectedCategory)?.name || 'selected category'}".`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="customType">Service Type Name *</Label>
                            <Input
                                id="customType"
                                placeholder="e.g., Special Audit, Custom Compliance"
                                value={customTypeName}
                                onChange={(e) => setCustomTypeName(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="customTypeDesc">Description</Label>
                            <Textarea
                                id="customTypeDesc"
                                placeholder="Brief description of this service type"
                                value={customTypeDescription}
                                onChange={(e) => setCustomTypeDescription(e.target.value)}
                                rows={2}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="customTypeFreq">Frequency</Label>
                                <Select value={customTypeFrequency} onValueChange={setCustomTypeFrequency}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select frequency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ONE_TIME">One-time</SelectItem>
                                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                                        <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                                        <SelectItem value="ANNUALLY">Annual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="customTypeDue">Default Due Date</Label>
                                <Input
                                    id="customTypeDue"
                                    placeholder="e.g., July 31, 20th of month"
                                    value={customTypeDefaultDueDate}
                                    onChange={(e) => setCustomTypeDefaultDueDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-medium">This service requires:</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <Checkbox
                                        checked={customTypeRequiresFY}
                                        onCheckedChange={(v) => setCustomTypeRequiresFY(!!v)}
                                    />
                                    <span className="text-sm">Financial Year</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <Checkbox
                                        checked={customTypeRequiresAY}
                                        onCheckedChange={(v) => setCustomTypeRequiresAY(!!v)}
                                    />
                                    <span className="text-sm">Assessment Year</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <Checkbox
                                        checked={customTypeRequiresQuarter}
                                        onCheckedChange={(v) => setCustomTypeRequiresQuarter(!!v)}
                                    />
                                    <span className="text-sm">Quarter (Q1-Q4)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <Checkbox
                                        checked={customTypeRequiresPeriod}
                                        onCheckedChange={(v) => setCustomTypeRequiresPeriod(!!v)}
                                    />
                                    <span className="text-sm">Period (Month)</span>
                                </label>
                            </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer border-t pt-3">
                            <Checkbox
                                checked={customTypeHasSubTypes}
                                onCheckedChange={(v) => setCustomTypeHasSubTypes(!!v)}
                            />
                            <span className="text-sm">This service has sub-types</span>
                        </label>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={resetTypeModal}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddCustomType}
                            disabled={!customTypeName.trim() || isAddingCustom}
                        >
                            {isAddingCustom ? (
                                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
                            ) : editingType ? (
                                <><CheckCircle2 className="h-4 w-4 mr-2" /> Save Changes</>
                            ) : (
                                <><Plus className="h-4 w-4 mr-2" /> Add Service Type</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal for adding/editing custom sub-type */}
            <Dialog open={isAddSubTypeModalOpen} onOpenChange={(open) => { if (!open) resetSubTypeModal() }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingSubType ? 'Edit' : 'Add'} Sub-Type</DialogTitle>
                        <DialogDescription>
                            {editingSubType
                                ? `Editing "${editingSubType.name}"`
                                : `Create a new sub-type for "${selectedType?.name || 'selected service type'}".`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="customSubType">Sub-Type Name *</Label>
                            <Input
                                id="customSubType"
                                placeholder="e.g., ITR-1A, Custom Form"
                                value={customSubTypeName}
                                onChange={(e) => setCustomSubTypeName(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="customSubTypeApplicable">Applicable To</Label>
                            <Input
                                id="customSubTypeApplicable"
                                placeholder="e.g., Salaried individuals, Companies"
                                value={customSubTypeApplicableTo}
                                onChange={(e) => setCustomSubTypeApplicableTo(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="customSubTypeDue">Due Date Reference</Label>
                                <Input
                                    id="customSubTypeDue"
                                    placeholder="e.g., July 31"
                                    value={customSubTypeDueDateRef}
                                    onChange={(e) => setCustomSubTypeDueDateRef(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="customSubTypeFee">Default Fee (₹)</Label>
                                <Input
                                    id="customSubTypeFee"
                                    type="number"
                                    placeholder="0.00"
                                    value={customSubTypeDefaultFee}
                                    onChange={(e) => setCustomSubTypeDefaultFee(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={resetSubTypeModal}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddCustomSubType}
                            disabled={!customSubTypeName.trim() || isAddingCustom}
                        >
                            {isAddingCustom ? (
                                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
                            ) : editingSubType ? (
                                <><CheckCircle2 className="h-4 w-4 mr-2" /> Save Changes</>
                            ) : (
                                <><Plus className="h-4 w-4 mr-2" /> Add Sub-Type</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Confirm Delete
                        </DialogTitle>
                        <DialogDescription>
                            {deleteTarget?.type === 'category' && (
                                <>Are you sure you want to delete the category <strong>"{deleteTarget.item.name}"</strong>?
                                    This will also delete all service types and sub-types under it.</>
                            )}
                            {deleteTarget?.type === 'type' && (
                                <>Are you sure you want to delete the service type <strong>"{deleteTarget.item.name}"</strong>?
                                    This will also delete all sub-types under it.</>
                            )}
                            {deleteTarget?.type === 'subType' && (
                                <>Are you sure you want to delete the sub-type <strong>"{deleteTarget.item.name}"</strong>?</>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <p className="text-sm text-red-700 dark:text-red-300">
                                ⚠️ This action cannot be undone. Existing services using this configuration will not be affected.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Deleting...</>
                            ) : (
                                <><Trash2 className="h-4 w-4 mr-2" /> Delete</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
