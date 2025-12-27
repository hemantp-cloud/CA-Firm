"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
    ArrowLeft,
    Loader2,
    Save,
    FileText,
    Settings,
    Plus,
    X,
    Search,
    Check,
    Info
} from "lucide-react"
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
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import api from "@/lib/api"
import { toast } from "sonner"

// Types
interface SelectedDocumentItem {
    documentMasterId?: string
    name: string
    category: string
    isRequired: boolean
    isCustom: boolean
}

interface DocumentMasterItem {
    id: string
    code: string
    name: string
    category: string
    description?: string
}

const serviceSchema = z.object({
    title: z.string().min(1, "Service name is required"),
    description: z.string().optional(),
    type: z.enum([
        "ITR_FILING",
        "GST_REGISTRATION",
        "GST_RETURN",
        "TDS_RETURN",
        "TDS_COMPLIANCE",
        "ROC_FILING",
        "AUDIT",
        "BOOK_KEEPING",
        "PAYROLL",
        "CONSULTATION",
        "OTHER",
    ]),
    financialYear: z.string().optional(),
    assessmentYear: z.string().optional(),
    period: z.string().optional(),
    dueDate: z.string().min(1, "Due date is required"),
    feeAmount: z.string().optional(),
    notes: z.string().optional(),
})

type ServiceFormData = z.infer<typeof serviceSchema>

const SERVICE_TYPE_LABELS: Record<string, string> = {
    ITR_FILING: "ITR Filing",
    GST_REGISTRATION: "GST Registration",
    GST_RETURN: "GST Return",
    TDS_RETURN: "TDS Return",
    TDS_COMPLIANCE: "TDS Compliance",
    ROC_FILING: "ROC Filing",
    AUDIT: "Audit",
    BOOK_KEEPING: "Book Keeping",
    PAYROLL: "Payroll",
    CONSULTATION: "Consultation",
    OTHER: "Other",
}

export default function EditServicePage() {
    const router = useRouter()
    const params = useParams()
    const serviceId = params.id as string

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState("details")

    // Document state
    const [selectedDocuments, setSelectedDocuments] = useState<SelectedDocumentItem[]>([])
    const [documentLibrary, setDocumentLibrary] = useState<DocumentMasterItem[]>([])
    const [documentSearch, setDocumentSearch] = useState("")
    const [customDocumentName, setCustomDocumentName] = useState("")
    const [isAddingCustomDoc, setIsAddingCustomDoc] = useState(false)
    const [documentCategoryFilter, setDocumentCategoryFilter] = useState("all")
    const [serviceName, setServiceName] = useState("")

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ServiceFormData>({
        resolver: zodResolver(serviceSchema),
    })

    useEffect(() => {
        if (serviceId) {
            fetchService()
            fetchDocumentLibrary()
        }
    }, [serviceId])

    const fetchService = async () => {
        try {
            setIsLoading(true)
            const response = await api.get(`/project-manager/services/${serviceId}`)
            if (response.data.success) {
                const service = response.data.data
                setServiceName(service.title)
                setValue("title", service.title)
                setValue("description", service.description || "")
                setValue("type", service.type)
                setValue("financialYear", service.financialYear || "")
                setValue("assessmentYear", service.assessmentYear || "")
                setValue("period", service.period || "")
                setValue(
                    "dueDate",
                    service.dueDate ? new Date(service.dueDate).toISOString().split("T")[0] : ""
                )
                setValue("feeAmount", service.feeAmount ? service.feeAmount.toString() : "")
                setValue("notes", service.internalNotes || "")

                // Load existing document requirements
                if (service.requiredDocuments && Array.isArray(service.requiredDocuments)) {
                    setSelectedDocuments(service.requiredDocuments)
                }
            }
        } catch (error) {
            console.error("Failed to fetch service:", error)
            setError("Failed to load service details")
        } finally {
            setIsLoading(false)
        }
    }

    const fetchDocumentLibrary = async () => {
        try {
            const response = await api.get("/project-manager/document-library")
            if (response.data.success) {
                setDocumentLibrary(response.data.data || [])
            }
        } catch (error) {
            console.error("Failed to fetch document library:", error)
            // Non-critical, continue without library
        }
    }

    // Document management functions
    const toggleDocumentSelection = (doc: DocumentMasterItem) => {
        const exists = selectedDocuments.some(d => d.name === doc.name)
        if (exists) {
            setSelectedDocuments(prev => prev.filter(d => d.name !== doc.name))
        } else {
            setSelectedDocuments(prev => [...prev, {
                documentMasterId: doc.id,
                name: doc.name,
                category: doc.category,
                isRequired: false,
                isCustom: false,
            }])
        }
    }

    const toggleDocumentRequired = (docName: string) => {
        setSelectedDocuments(prev =>
            prev.map(d =>
                d.name === docName
                    ? { ...d, isRequired: !d.isRequired }
                    : d
            )
        )
    }

    const removeDocument = (docName: string) => {
        setSelectedDocuments(prev => prev.filter(d => d.name !== docName))
    }

    const addCustomDocument = () => {
        if (!customDocumentName.trim()) return

        const exists = selectedDocuments.some(d =>
            d.name.toLowerCase() === customDocumentName.trim().toLowerCase()
        )
        if (exists) {
            toast.error("This document is already in the list")
            return
        }

        setSelectedDocuments(prev => [...prev, {
            documentMasterId: undefined,
            name: customDocumentName.trim(),
            category: 'Custom',
            isRequired: false,
            isCustom: true,
        }])
        setCustomDocumentName("")
        setIsAddingCustomDoc(false)
        toast.success("Custom document added")
    }

    const isDocumentSelected = (docName: string): boolean => {
        return selectedDocuments.some(d => d.name === docName)
    }

    // Get unique categories from document library
    const documentCategories = useMemo(() => {
        const categories = new Set(documentLibrary.map(d => d.category))
        return Array.from(categories).sort()
    }, [documentLibrary])

    // Filter document library
    const filteredDocumentLibrary = useMemo(() => {
        let filtered = documentLibrary

        if (documentCategoryFilter !== 'all') {
            filtered = filtered.filter(d => d.category === documentCategoryFilter)
        }

        if (documentSearch) {
            const searchLower = documentSearch.toLowerCase()
            filtered = filtered.filter(d =>
                d.name.toLowerCase().includes(searchLower) ||
                d.category.toLowerCase().includes(searchLower)
            )
        }

        return filtered
    }, [documentLibrary, documentCategoryFilter, documentSearch])

    // Group documents by category
    const groupedDocuments = useMemo(() => {
        const groups: Record<string, DocumentMasterItem[]> = {}
        filteredDocumentLibrary.forEach(doc => {
            if (!groups[doc.category]) {
                groups[doc.category] = []
            }
            groups[doc.category].push(doc)
        })
        return groups
    }, [filteredDocumentLibrary])

    const onSubmit = async (data: ServiceFormData) => {
        setIsSaving(true)
        setError(null)

        try {
            const payload = {
                ...data,
                feeAmount: data.feeAmount ? parseFloat(data.feeAmount) : null,
                dueDate: new Date(data.dueDate).toISOString(),
                requiredDocuments: selectedDocuments,
            }

            const response = await api.put(`/project-manager/services/${serviceId}`, payload)

            if (response.data.success) {
                toast.success("Service updated successfully")
                router.push(`/project-manager/services/${serviceId}`)
                router.refresh()
            } else {
                setError(response.data.message || "Failed to update service")
            }
        } catch (err: any) {
            console.error("Update service error:", err)
            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to update service. Please try again."
            )
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/project-manager/services/${serviceId}`}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Service</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {serviceName}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="details" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Service Details
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Documents
                        {selectedDocuments.length > 0 && (
                            <Badge variant="secondary" className="ml-1">
                                {selectedDocuments.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Service Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Service Type */}
                                    <div>
                                        <Label htmlFor="type">
                                            Service Type <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            value={watch("type") || ""}
                                            onValueChange={(value) => setValue("type", value as any)}
                                        >
                                            <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                                                <SelectValue placeholder="Select service type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                                                    <SelectItem key={value} value={value}>
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.type && (
                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                {errors.type.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Service Name */}
                                    <div>
                                        <Label htmlFor="title">
                                            Service Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="title"
                                            {...register("title")}
                                            className={errors.title ? "border-red-500" : ""}
                                        />
                                        {errors.title && (
                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                {errors.title.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Financial Year */}
                                    <div>
                                        <Label htmlFor="financialYear">Financial Year</Label>
                                        <Input
                                            id="financialYear"
                                            placeholder="e.g., 2024-25"
                                            {...register("financialYear")}
                                        />
                                    </div>

                                    {/* Assessment Year */}
                                    <div>
                                        <Label htmlFor="assessmentYear">Assessment Year</Label>
                                        <Input
                                            id="assessmentYear"
                                            placeholder="e.g., 2025-26"
                                            {...register("assessmentYear")}
                                        />
                                    </div>

                                    {/* Period */}
                                    <div>
                                        <Label htmlFor="period">Period</Label>
                                        <Input
                                            id="period"
                                            placeholder="e.g., Q1, November"
                                            {...register("period")}
                                        />
                                    </div>

                                    {/* Due Date */}
                                    <div>
                                        <Label htmlFor="dueDate">
                                            Due Date <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="dueDate"
                                            type="date"
                                            {...register("dueDate")}
                                            className={errors.dueDate ? "border-red-500" : ""}
                                        />
                                        {errors.dueDate && (
                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                {errors.dueDate.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Amount */}
                                    <div>
                                        <Label htmlFor="feeAmount">Fee Amount (₹)</Label>
                                        <Input
                                            id="feeAmount"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            {...register("feeAmount")}
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        rows={3}
                                        placeholder="Service description..."
                                        {...register("description")}
                                    />
                                </div>

                                {/* Internal Notes */}
                                <div>
                                    <Label htmlFor="notes">Internal Notes</Label>
                                    <Textarea
                                        id="notes"
                                        rows={3}
                                        placeholder="Internal notes (not visible to client)..."
                                        {...register("notes")}
                                    />
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: Document Library */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                    Document Library
                                </CardTitle>
                                <p className="text-sm text-gray-500 mt-1">
                                    Select documents the client needs to provide
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Search and Filter */}
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Search documents..."
                                            value={documentSearch}
                                            onChange={(e) => setDocumentSearch(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                    <Select value={documentCategoryFilter} onValueChange={setDocumentCategoryFilter}>
                                        <SelectTrigger className="w-40">
                                            <SelectValue placeholder="Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            {documentCategories.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Document List */}
                                <div className="max-h-96 overflow-y-auto space-y-3">
                                    {Object.entries(groupedDocuments).map(([category, docs]) => (
                                        <div key={category}>
                                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {category}
                                            </h4>
                                            <div className="space-y-1">
                                                {docs.map(doc => (
                                                    <div
                                                        key={doc.id}
                                                        onClick={() => toggleDocumentSelection(doc)}
                                                        className={`p-2 rounded-lg border cursor-pointer transition-colors ${isDocumentSelected(doc.name)
                                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300'
                                                                : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className={`h-5 w-5 rounded border flex items-center justify-center ${isDocumentSelected(doc.name)
                                                                    ? 'bg-blue-600 border-blue-600'
                                                                    : 'border-gray-300'
                                                                }`}>
                                                                {isDocumentSelected(doc.name) && (
                                                                    <Check className="h-3 w-3 text-white" />
                                                                )}
                                                            </div>
                                                            <span className="text-sm">{doc.name}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    {filteredDocumentLibrary.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                            <p className="text-sm">No documents found</p>
                                        </div>
                                    )}
                                </div>

                                {/* Add Custom Document */}
                                <div className="pt-4 border-t">
                                    {isAddingCustomDoc ? (
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Custom document name..."
                                                value={customDocumentName}
                                                onChange={(e) => setCustomDocumentName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && addCustomDocument()}
                                                autoFocus
                                            />
                                            <Button size="sm" onClick={addCustomDocument}>
                                                Add
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => {
                                                setIsAddingCustomDoc(false)
                                                setCustomDocumentName("")
                                            }}>
                                                Cancel
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => setIsAddingCustomDoc(true)}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Custom Document
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Right: Selected Documents */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Check className="h-5 w-5 text-green-600" />
                                    Selected Documents ({selectedDocuments.length})
                                </CardTitle>
                                <p className="text-sm text-gray-500 mt-1">
                                    Documents the client will see and upload
                                </p>
                            </CardHeader>
                            <CardContent>
                                {selectedDocuments.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                        <p className="text-sm font-medium">No documents selected</p>
                                        <p className="text-xs mt-1">Select documents from the library</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedDocuments.map((doc) => (
                                            <div
                                                key={doc.name}
                                                className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-gray-500" />
                                                        <span className="font-medium text-sm">{doc.name}</span>
                                                        {doc.isCustom && (
                                                            <Badge variant="outline" className="text-xs">Custom</Badge>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeDocument(doc.name)}
                                                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                                    <span className="text-xs text-gray-500">{doc.category}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-500">
                                                            {doc.isRequired ? 'Required' : 'Optional'}
                                                        </span>
                                                        <Switch
                                                            checked={doc.isRequired}
                                                            onCheckedChange={() => toggleDocumentRequired(doc.name)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Summary */}
                                        <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                                                <Info className="h-4 w-4" />
                                                <span className="text-sm font-medium">
                                                    Client will see: {selectedDocuments.filter(d => d.isRequired).length} Required,{' '}
                                                    {selectedDocuments.filter(d => !d.isRequired).length} Optional documents
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Bottom Action Bar */}
            <div className="flex gap-4 pt-4 border-t">
                <Button
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </>
                    )}
                </Button>
                <Button type="button" variant="outline" asChild>
                    <Link href={`/project-manager/services/${serviceId}`}>Cancel</Link>
                </Button>
            </div>
        </div>
    )
}
