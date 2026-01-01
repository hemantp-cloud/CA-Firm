"use client"

import { useState, useEffect } from "react"
import {
    FileText,
    Loader2,
    Plus,
    Eye,
    Mail,
    Calendar,
    MessageSquare,
    ChevronDown,
    ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { toast } from "sonner"
import api from "@/lib/api"

// Types
interface DocumentSlot {
    id: string
    documentName: string
    category: string | null
    isRequired: boolean
    isCustom: boolean
    status: string
    linkedDocument?: {
        id: string
        fileName: string
        uploadedAt: string
        fileUrl?: string
    } | null
}

interface ClientDocument {
    id: string
    fileName: string
    fileType: string
    documentType: string | null
    uploadedAt: string
    fileUrl?: string
}

interface SlotAction {
    slotId: string
    action: 'LINK' | 'REQUEST' | 'SKIP'
    linkedDocumentId?: string
}

interface RequestDocumentsDialogProps {
    serviceId: string
    serviceName: string
    clientName: string
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export default function RequestDocumentsDialog({
    serviceId,
    serviceName,
    clientName,
    open,
    onOpenChange,
    onSuccess
}: RequestDocumentsDialogProps) {
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [slots, setSlots] = useState<DocumentSlot[]>([])
    const [clientDocs, setClientDocs] = useState<ClientDocument[]>([])
    const [actions, setActions] = useState<Record<string, SlotAction>>({})
    const [globalDeadline, setGlobalDeadline] = useState("")
    const [globalNote, setGlobalNote] = useState("")
    const [addDocsOpen, setAddDocsOpen] = useState(false)
    const [customDocName, setCustomDocName] = useState("")
    const [customDocCategory, setCustomDocCategory] = useState("Other")
    const [customDocRequired, setCustomDocRequired] = useState(true)

    useEffect(() => {
        if (open && serviceId) {
            loadData()
        }
    }, [open, serviceId])

    // State for document library with purposes
    const [documentLibrary, setDocumentLibrary] = useState<Array<{
        code: string
        name: string
        category: string
        purposes: string[]
    }>>([])

    const loadData = async () => {
        setLoading(true)
        try {
            const [slotsRes, docsRes, libraryRes] = await Promise.all([
                api.get(`/document-slots/services/${serviceId}/slots`),
                api.get(`/document-slots/services/${serviceId}/client-documents`),
                api.get(`/project-manager/document-library`)
            ])

            // Load document library with purposes
            if (libraryRes.data.success) {
                setDocumentLibrary(libraryRes.data.data || [])
            }

            if (slotsRes.data.success) {
                setSlots(slotsRes.data.data)
                const initialActions: Record<string, SlotAction> = {}
                const library = libraryRes.data.data || []
                slotsRes.data.data.forEach((slot: DocumentSlot) => {
                    if (slot.status === 'NOT_STARTED') {
                        const matchingDoc = findMatchingDocWithPurposes(slot, docsRes.data.data || [], library)
                        initialActions[slot.id] = {
                            slotId: slot.id,
                            action: matchingDoc ? 'LINK' : (slot.isRequired ? 'REQUEST' : 'SKIP'),
                            linkedDocumentId: matchingDoc?.id
                        }
                    }
                })
                setActions(initialActions)
            }

            if (docsRes.data.success) {
                setClientDocs(docsRes.data.data || [])
            }
        } catch (error) {
            console.error("Error loading data:", error)
            toast.error("Failed to load documents")
        } finally {
            setLoading(false)
        }
    }
    // Helper: Get document purposes from library
    const getDocumentPurposes = (docType: string, library?: typeof documentLibrary): string[] => {
        const lib = library || documentLibrary
        const doc = lib.find(d => d.code.toUpperCase() === docType.toUpperCase())
        return doc?.purposes || []
    }

    // NEW: Purpose-based matching function
    const findMatchingDocWithPurposes = (
        slot: DocumentSlot,
        docs: ClientDocument[],
        library: typeof documentLibrary
    ): ClientDocument | null => {
        const slotNameLower = slot.documentName.toLowerCase()
        const slotCategory = slot.category || ''

        // Priority 1: Exact document type match
        const exactMatch = docs.find(doc => {
            const docType = doc.documentType?.toUpperCase() || 'OTHER'
            const slotCode = slot.documentName.toUpperCase().replace(/\s+/g, '_')
            return docType === slotCode
        })
        if (exactMatch) return exactMatch

        // Priority 2: OTHER type with description match
        const otherDescMatch = docs.find(doc => {
            if (doc.documentType?.toUpperCase() !== 'OTHER') return false
            // Check if document description matches slot name
            const docDesc = (doc as any).description?.toLowerCase() || ''
            return docDesc.includes(slotNameLower) || slotNameLower.includes(docDesc)
        })
        if (otherDescMatch) return otherDescMatch

        // Priority 3: Purpose-based match (NEW - dynamic from database)
        const purposeMatch = docs.find(doc => {
            const docType = doc.documentType?.toUpperCase() || 'OTHER'
            const purposes = getDocumentPurposes(docType, library)
            // Check if any of the document's purposes match the slot's category
            return purposes.some(purpose =>
                purpose.toLowerCase() === slotCategory.toLowerCase()
            )
        })
        if (purposeMatch) return purposeMatch

        // Priority 4: Filename contains slot name
        const filenameMatch = docs.find(doc =>
            doc.fileName.toLowerCase().includes(slotNameLower)
        )
        return filenameMatch || null
    }

    // For backward compatibility (uses stored library)
    const findMatchingDoc = (slot: DocumentSlot, docs: ClientDocument[]) => {
        return findMatchingDocWithPurposes(slot, docs, documentLibrary)
    }

    // Enhanced: Get documents grouped by match priority (NEW - uses purposes)
    const getGroupedDocsForSlot = (slot: DocumentSlot) => {
        const slotNameLower = slot.documentName.toLowerCase()
        const slotCategory = slot.category?.toLowerCase() || 'other'
        const slotCode = slot.documentName.toUpperCase().replace(/\s+/g, '_')

        const exactMatches: ClientDocument[] = []
        const categoryMatches: ClientDocument[] = []
        const otherDocs: ClientDocument[] = []

        clientDocs.forEach(doc => {
            const docType = doc.documentType?.toUpperCase() || 'OTHER'
            const purposes = getDocumentPurposes(docType)

            // Check for exact type match or filename match
            if (docType === slotCode ||
                doc.fileName.toLowerCase().includes(slotNameLower)) {
                exactMatches.push(doc)
            }
            // Check for OTHER type with matching description
            else if (docType === 'OTHER' && (doc as any).description) {
                const docDesc = (doc as any).description.toLowerCase()
                if (docDesc.includes(slotNameLower) || slotNameLower.includes(docDesc)) {
                    exactMatches.push(doc)
                } else {
                    otherDocs.push(doc)
                }
            }
            // Check for purpose-based match (NEW - dynamic from database)
            else if (purposes.some(p => p.toLowerCase() === slotCategory)) {
                categoryMatches.push(doc)
            }
            // Other available documents
            else {
                otherDocs.push(doc)
            }
        })

        return { exactMatches, categoryMatches, otherDocs }
    }

    // Filter documents by slot's category (updated to use purposes)
    const getFilteredDocsForSlot = (slot: DocumentSlot) => {
        const slotCategory = slot.category?.toLowerCase() || 'other'

        return clientDocs.filter(doc => {
            const docType = doc.documentType?.toUpperCase() || 'OTHER'
            const purposes = getDocumentPurposes(docType)

            // Show documents that have the slot's category in their purposes
            // OR are 'Other' type OR slot is 'Other' category
            const hasPurposeMatch = purposes.some(p => p.toLowerCase() === slotCategory)
            return hasPurposeMatch || docType === 'OTHER' || slotCategory === 'other'
        })
    }

    const updateAction = (slotId: string, action: 'LINK' | 'REQUEST' | 'SKIP', linkedDocId?: string) => {
        setActions(prev => ({
            ...prev,
            [slotId]: {
                slotId,
                action,
                linkedDocumentId: action === 'LINK' ? linkedDocId : undefined
            }
        }))
    }

    const addCustomDocument = async () => {
        if (!customDocName.trim()) {
            toast.error("Please enter a document name")
            return
        }

        try {
            const response = await api.post(`/document-slots/services/${serviceId}/slots`, {
                name: customDocName,
                category: customDocCategory,
                isRequired: customDocRequired,
                isCustom: true
            })

            if (response.data.success) {
                const newSlot = response.data.data
                setSlots(prev => [...prev, newSlot])
                setActions(prev => ({
                    ...prev,
                    [newSlot.id]: { slotId: newSlot.id, action: 'REQUEST' }
                }))
                setCustomDocName("")
                toast.success("Document added")
            }
        } catch (error) {
            toast.error("Failed to add document")
        }
    }

    const handleSubmit = async () => {
        const slotActions = Object.values(actions)
        const requestCount = slotActions.filter(a => a.action === 'REQUEST').length
        const linkCount = slotActions.filter(a => a.action === 'LINK').length

        if (requestCount === 0 && linkCount === 0) {
            toast.error("Please select at least one document to link or request")
            return
        }

        const finalActions = slotActions.map(action => ({
            ...action,
            deadline: action.action === 'REQUEST' && globalDeadline ? globalDeadline : undefined,
            instructions: action.action === 'REQUEST' && globalNote ? globalNote : undefined
        }))

        setSubmitting(true)
        try {
            const response = await api.post(`/document-slots/services/${serviceId}/process-actions`, {
                actions: finalActions,
                globalMessage: globalNote || undefined
            })

            if (response.data.success) {
                toast.success(`Request sent: ${requestCount} documents requested, ${linkCount} linked`)
                onSuccess()
                onOpenChange(false)
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to process request")
        } finally {
            setSubmitting(false)
        }
    }

    // Calculate summary
    const pendingSlots = slots.filter(s => s.status === 'NOT_STARTED')
    const requestCount = Object.values(actions).filter(a => a.action === 'REQUEST').length
    const linkCount = Object.values(actions).filter(a => a.action === 'LINK').length
    const skipCount = Object.values(actions).filter(a => a.action === 'SKIP').length

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl w-[90vw] p-0 gap-0 overflow-hidden max-h-[85vh] flex flex-col">
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b bg-slate-50 dark:bg-slate-900 flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Document Request
                    </DialogTitle>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Service: <span className="font-medium text-slate-900 dark:text-white">{serviceName}</span>
                        <span className="mx-2">•</span>
                        Client: <span className="font-medium">{clientName}</span>
                    </p>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        <span className="ml-2 text-slate-500">Loading...</span>
                    </div>
                ) : (
                    <>
                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {/* Documents Section */}
                            <div className="border rounded-lg overflow-hidden">
                                {/* Header */}
                                <div className="flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-800 border-b">
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                                        Documents ({pendingSlots.length})
                                    </span>
                                    <span className="text-sm">
                                        {requestCount > 0 && <span className="text-orange-600 font-medium">{requestCount} to request</span>}
                                        {requestCount > 0 && (linkCount > 0 || skipCount > 0) && <span className="mx-2 text-slate-400">•</span>}
                                        {linkCount > 0 && <span className="text-blue-600 font-medium">{linkCount} linked</span>}
                                        {linkCount > 0 && skipCount > 0 && <span className="mx-2 text-slate-400">•</span>}
                                        {skipCount > 0 && <span className="text-slate-500">{skipCount} skip</span>}
                                    </span>
                                </div>

                                {/* Document List - Simple flex layout instead of table */}
                                <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                    {pendingSlots.length === 0 ? (
                                        <div className="px-4 py-10 text-center text-slate-500">
                                            No pending documents. Use "Add More Documents" below.
                                        </div>
                                    ) : (
                                        pendingSlots.map((slot) => {
                                            const action = actions[slot.id]
                                            const matchingDoc = findMatchingDoc(slot, clientDocs)

                                            return (
                                                <div
                                                    key={slot.id}
                                                    className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                                >
                                                    {/* Status Indicator */}
                                                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${action?.action === 'LINK' ? 'bg-blue-500' :
                                                        action?.action === 'REQUEST' ? 'bg-orange-400' :
                                                            'bg-slate-300'
                                                        }`} />

                                                    {/* Document Name - Flexible width */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-slate-900 dark:text-white truncate">
                                                                {slot.documentName}
                                                            </span>
                                                            {slot.isRequired && (
                                                                <span className="text-red-500 flex-shrink-0">*</span>
                                                            )}
                                                            {matchingDoc && action?.action !== 'LINK' && (
                                                                <span className="flex-shrink-0 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                                                    Available
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Category Badge */}
                                                    <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full flex-shrink-0">
                                                        {slot.category || 'General'}
                                                    </span>

                                                    {/* Action Dropdown */}
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <Select
                                                            value={action?.action || 'REQUEST'}
                                                            onValueChange={(value) => {
                                                                const newAction = value as 'LINK' | 'REQUEST' | 'SKIP'
                                                                updateAction(
                                                                    slot.id,
                                                                    newAction,
                                                                    newAction === 'LINK' ? matchingDoc?.id : undefined
                                                                )
                                                            }}
                                                        >
                                                            <SelectTrigger className="w-28 h-9">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="REQUEST">
                                                                    <span className="text-orange-600 font-medium">Request</span>
                                                                </SelectItem>
                                                                <SelectItem value="LINK">
                                                                    <span className="text-blue-600 font-medium">Link</span>
                                                                </SelectItem>
                                                                <SelectItem value="SKIP">
                                                                    <span className="text-slate-500">Skip</span>
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>

                                                        {/* Link Document Selector */}
                                                        {action?.action === 'LINK' && (
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-9 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                    >
                                                                        <Eye className="h-4 w-4 mr-1" />
                                                                        <span className="max-w-16 truncate text-xs">
                                                                            {action.linkedDocumentId
                                                                                ? clientDocs.find(d => d.id === action.linkedDocumentId)?.fileName?.slice(0, 10) + '...'
                                                                                : 'Select'
                                                                            }
                                                                        </span>
                                                                        <ChevronDown className="h-3 w-3 ml-1 flex-shrink-0" />
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-96 p-0" align="end">
                                                                    <div className="p-3 border-b bg-slate-50 dark:bg-slate-800">
                                                                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                                            Link Document to: {slot.documentName}
                                                                        </div>
                                                                        <div className="text-xs text-slate-500 mt-0.5">
                                                                            Category: {slot.category || 'General'}
                                                                        </div>
                                                                    </div>
                                                                    {(() => {
                                                                        const { exactMatches, categoryMatches, otherDocs } = getGroupedDocsForSlot(slot)
                                                                        const hasAnyDocs = exactMatches.length > 0 || categoryMatches.length > 0 || otherDocs.length > 0

                                                                        if (!hasAnyDocs) {
                                                                            return (
                                                                                <div className="p-6 text-center">
                                                                                    <FileText className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                                                                                    <p className="text-sm text-slate-500">No documents available</p>
                                                                                    <p className="text-xs text-slate-400 mt-1">
                                                                                        Request this from client instead
                                                                                    </p>
                                                                                </div>
                                                                            )
                                                                        }

                                                                        return (
                                                                            <div className="max-h-64 overflow-y-auto">
                                                                                {/* Exact Matches Section */}
                                                                                {exactMatches.length > 0 && (
                                                                                    <div className="p-2">
                                                                                        <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-green-700 dark:text-green-400">
                                                                                            <span className="text-yellow-500">⭐</span>
                                                                                            EXACT MATCH
                                                                                        </div>
                                                                                        {exactMatches.map(doc => (
                                                                                            <div
                                                                                                key={doc.id}
                                                                                                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${action.linkedDocumentId === doc.id
                                                                                                    ? 'bg-green-50 border-2 border-green-400 dark:bg-green-900/30'
                                                                                                    : 'hover:bg-green-50 dark:hover:bg-green-900/20 border border-transparent'
                                                                                                    }`}
                                                                                                onClick={() => updateAction(slot.id, 'LINK', doc.id)}
                                                                                            >
                                                                                                <div className="flex-1 min-w-0 pr-2">
                                                                                                    <span className="text-sm font-medium truncate block">{doc.fileName}</span>
                                                                                                    <span className="text-xs text-slate-500">
                                                                                                        {doc.documentType?.replace(/_/g, ' ') || 'Unspecified'}
                                                                                                    </span>
                                                                                                </div>
                                                                                                {action.linkedDocumentId === doc.id && (
                                                                                                    <span className="text-green-600 text-xs font-medium">✓ Selected</span>
                                                                                                )}
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                )}

                                                                                {/* Same Category Section */}
                                                                                {categoryMatches.length > 0 && (
                                                                                    <div className="p-2 border-t border-slate-100 dark:border-slate-700">
                                                                                        <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                                                                                            📂 SAME CATEGORY ({slot.category})
                                                                                        </div>
                                                                                        {categoryMatches.map(doc => (
                                                                                            <div
                                                                                                key={doc.id}
                                                                                                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${action.linkedDocumentId === doc.id
                                                                                                    ? 'bg-blue-50 border-2 border-blue-400 dark:bg-blue-900/30'
                                                                                                    : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent'
                                                                                                    }`}
                                                                                                onClick={() => updateAction(slot.id, 'LINK', doc.id)}
                                                                                            >
                                                                                                <div className="flex-1 min-w-0 pr-2">
                                                                                                    <span className="text-sm truncate block">{doc.fileName}</span>
                                                                                                    <span className="text-xs text-slate-500">
                                                                                                        {doc.documentType?.replace(/_/g, ' ') || 'Unspecified'}
                                                                                                    </span>
                                                                                                </div>
                                                                                                {action.linkedDocumentId === doc.id && (
                                                                                                    <span className="text-blue-600 text-xs font-medium">✓ Selected</span>
                                                                                                )}
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                )}

                                                                                {/* Other Documents Section */}
                                                                                {otherDocs.length > 0 && (
                                                                                    <div className="p-2 border-t border-slate-100 dark:border-slate-700">
                                                                                        <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-slate-500">
                                                                                            📁 OTHER AVAILABLE
                                                                                        </div>
                                                                                        {otherDocs.slice(0, 5).map(doc => (
                                                                                            <div
                                                                                                key={doc.id}
                                                                                                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${action.linkedDocumentId === doc.id
                                                                                                    ? 'bg-slate-100 border-2 border-slate-400'
                                                                                                    : 'hover:bg-slate-50 border border-transparent'
                                                                                                    }`}
                                                                                                onClick={() => updateAction(slot.id, 'LINK', doc.id)}
                                                                                            >
                                                                                                <div className="flex-1 min-w-0 pr-2">
                                                                                                    <span className="text-sm truncate block text-slate-600">{doc.fileName}</span>
                                                                                                    <span className="text-xs text-slate-400">
                                                                                                        {doc.documentType?.replace(/_/g, ' ') || 'Unspecified'}
                                                                                                    </span>
                                                                                                </div>
                                                                                                {action.linkedDocumentId === doc.id && (
                                                                                                    <span className="text-slate-600 text-xs font-medium">✓ Selected</span>
                                                                                                )}
                                                                                            </div>
                                                                                        ))}
                                                                                        {otherDocs.length > 5 && (
                                                                                            <p className="text-xs text-slate-400 text-center py-1">
                                                                                                +{otherDocs.length - 5} more documents
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )
                                                                    })()}

                                                                    {/* Request Instead Option */}
                                                                    <div className="p-2 border-t bg-slate-50 dark:bg-slate-800">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                                            onClick={() => updateAction(slot.id, 'REQUEST')}
                                                                        >
                                                                            <Mail className="h-4 w-4 mr-2" />
                                                                            Request from Client Instead
                                                                        </Button>
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>

                                {/* Footer note */}
                                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 border-t">
                                    <span className="text-red-500">*</span> Mandatory documents
                                </div>
                            </div>

                            {/* Add More Documents */}
                            <Collapsible open={addDocsOpen} onOpenChange={setAddDocsOpen}>
                                <CollapsibleTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-between text-slate-600 border-dashed h-10"
                                    >
                                        <span className="flex items-center">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add More Documents
                                        </span>
                                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${addDocsOpen ? 'rotate-180' : ''}`} />
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-3">
                                    <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                        <div className="flex gap-3 items-end flex-wrap">
                                            <div className="flex-1 min-w-[200px]">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                                                    Document Name
                                                </label>
                                                <Input
                                                    placeholder="e.g., Rent Agreement"
                                                    value={customDocName}
                                                    onChange={(e) => setCustomDocName(e.target.value)}
                                                    className="h-9"
                                                />
                                            </div>
                                            <div className="w-32">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                                                    Category
                                                </label>
                                                <Select value={customDocCategory} onValueChange={setCustomDocCategory}>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Identity">Identity</SelectItem>
                                                        <SelectItem value="Financial">Financial</SelectItem>
                                                        <SelectItem value="Tax">Tax</SelectItem>
                                                        <SelectItem value="GST">GST</SelectItem>
                                                        <SelectItem value="Business">Business</SelectItem>
                                                        <SelectItem value="Capital Gains">Capital Gains</SelectItem>
                                                        <SelectItem value="Professional">Professional</SelectItem>
                                                        <SelectItem value="Address Proof">Address Proof</SelectItem>
                                                        <SelectItem value="Foreign/NRI">Foreign/NRI</SelectItem>
                                                        <SelectItem value="Payroll">Payroll</SelectItem>
                                                        <SelectItem value="Import/Export">Import/Export</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex items-center gap-2 h-9">
                                                <input
                                                    type="checkbox"
                                                    id="mandatory"
                                                    checked={customDocRequired}
                                                    onChange={(e) => setCustomDocRequired(e.target.checked)}
                                                    className="rounded border-slate-300 w-4 h-4"
                                                />
                                                <label htmlFor="mandatory" className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                    Mandatory
                                                </label>
                                            </div>
                                            <Button onClick={addCustomDocument} className="h-9 bg-blue-600 hover:bg-blue-700">
                                                <Plus className="h-4 w-4 mr-1" /> Add
                                            </Button>
                                        </div>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>

                            {/* Due Date and Note Section */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Due Date */}
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        Due Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={globalDeadline}
                                        onChange={(e) => setGlobalDeadline(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="h-9"
                                    />
                                </div>

                                {/* Note */}
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4 text-slate-400" />
                                        Note to Client
                                    </label>
                                    <Textarea
                                        placeholder="Add a message for the client..."
                                        value={globalNote}
                                        onChange={(e) => setGlobalNote(e.target.value)}
                                        rows={2}
                                        className="resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-6 py-4 border-t bg-slate-50 dark:bg-slate-900 flex-shrink-0 flex items-center justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting || (requestCount === 0 && linkCount === 0)}
                                className="bg-blue-600 hover:bg-blue-700 min-w-36"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="h-4 w-4 mr-2" />
                                        Send Request ({requestCount + linkCount})
                                    </>
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
