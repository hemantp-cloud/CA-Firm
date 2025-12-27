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

    const loadData = async () => {
        setLoading(true)
        try {
            const [slotsRes, docsRes] = await Promise.all([
                api.get(`/document-slots/services/${serviceId}/slots`),
                api.get(`/document-slots/services/${serviceId}/client-documents`)
            ])

            if (slotsRes.data.success) {
                setSlots(slotsRes.data.data)
                const initialActions: Record<string, SlotAction> = {}
                slotsRes.data.data.forEach((slot: DocumentSlot) => {
                    if (slot.status === 'NOT_STARTED') {
                        const matchingDoc = findMatchingDoc(slot, docsRes.data.data || [])
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

    const findMatchingDoc = (slot: DocumentSlot, docs: ClientDocument[]) => {
        const slotNameLower = slot.documentName.toLowerCase()
        return docs.find(doc =>
            doc.fileName.toLowerCase().includes(slotNameLower) ||
            doc.documentType?.toLowerCase().includes(slotNameLower.replace(/\s+/g, '_'))
        )
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
                                                                <PopoverContent className="w-72 p-2" align="end">
                                                                    <div className="text-sm font-medium text-slate-700 mb-2 px-2">
                                                                        Select Document
                                                                    </div>
                                                                    {clientDocs.length > 0 ? (
                                                                        <div className="space-y-1 max-h-40 overflow-y-auto">
                                                                            {clientDocs.map(doc => (
                                                                                <div
                                                                                    key={doc.id}
                                                                                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${action.linkedDocumentId === doc.id
                                                                                            ? 'bg-blue-50 border border-blue-300'
                                                                                            : 'hover:bg-slate-100 border border-transparent'
                                                                                        }`}
                                                                                    onClick={() => updateAction(slot.id, 'LINK', doc.id)}
                                                                                >
                                                                                    <span className="text-sm truncate flex-1 pr-2">{doc.fileName}</span>
                                                                                    {doc.fileUrl && (
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            className="h-6 w-6 p-0 flex-shrink-0"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation()
                                                                                                window.open(doc.fileUrl, '_blank')
                                                                                            }}
                                                                                        >
                                                                                            <ExternalLink className="h-3 w-3" />
                                                                                        </Button>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-sm text-slate-500 text-center py-4">
                                                                            No documents available
                                                                        </div>
                                                                    )}
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
                                                        <SelectItem value="Business">Business</SelectItem>
                                                        <SelectItem value="Tax">Tax</SelectItem>
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
