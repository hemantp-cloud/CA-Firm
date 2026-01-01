"use client"

import { useState, useEffect, useMemo } from "react"
import { FileText, Loader2, Search, Save, Plus, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import api from "@/lib/api"

interface DocumentMaster {
    id: string
    code: string
    name: string
    category: string
    purposes: string[]
    description: string | null
}

export default function DocumentMasterConfig() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [documents, setDocuments] = useState<DocumentMaster[]>([])
    const [availablePurposes, setAvailablePurposes] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    // Edit modal state
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [selectedDocument, setSelectedDocument] = useState<DocumentMaster | null>(null)
    const [editedPurposes, setEditedPurposes] = useState<string[]>([])
    const [customPurpose, setCustomPurpose] = useState("")

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [docsResponse, purposesResponse] = await Promise.all([
                api.get('/project-manager/document-master'),
                api.get('/project-manager/available-purposes'),
            ])

            if (docsResponse.data.success) {
                setDocuments(docsResponse.data.data)
            }
            if (purposesResponse.data.success) {
                setAvailablePurposes(purposesResponse.data.data)
            }
        } catch (error) {
            console.error('Failed to fetch document master:', error)
            toast.error('Failed to load document configuration')
        } finally {
            setLoading(false)
        }
    }

    // Get unique categories
    const categories = useMemo(() => {
        const cats = [...new Set(documents.map(d => d.category))]
        return cats.sort()
    }, [documents])

    // Filter documents
    const filteredDocuments = useMemo(() => {
        return documents.filter(doc => {
            const matchesSearch = !searchQuery ||
                doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.code.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCategory = !selectedCategory || doc.category === selectedCategory
            return matchesSearch && matchesCategory
        })
    }, [documents, searchQuery, selectedCategory])

    // Group by category
    const groupedDocuments = useMemo(() => {
        const groups: Record<string, DocumentMaster[]> = {}
        filteredDocuments.forEach(doc => {
            if (!groups[doc.category]) {
                groups[doc.category] = []
            }
            groups[doc.category].push(doc)
        })
        return groups
    }, [filteredDocuments])

    const handleEditClick = (doc: DocumentMaster) => {
        setSelectedDocument(doc)
        setEditedPurposes([...doc.purposes])
        setCustomPurpose("")
        setEditModalOpen(true)
    }

    const handlePurposeToggle = (purpose: string) => {
        if (editedPurposes.includes(purpose)) {
            setEditedPurposes(editedPurposes.filter(p => p !== purpose))
        } else {
            setEditedPurposes([...editedPurposes, purpose])
        }
    }

    const handleAddCustomPurpose = () => {
        const trimmed = customPurpose.trim()
        if (trimmed && !editedPurposes.includes(trimmed)) {
            setEditedPurposes([...editedPurposes, trimmed])
            setCustomPurpose("")
        }
    }

    const handleSave = async () => {
        if (!selectedDocument) return

        try {
            setSaving(true)
            const response = await api.put(`/project-manager/document-master/${selectedDocument.id}`, {
                purposes: editedPurposes,
            })

            if (response.data.success) {
                // Update local state
                setDocuments(documents.map(d =>
                    d.id === selectedDocument.id
                        ? { ...d, purposes: editedPurposes }
                        : d
                ))
                toast.success(`Purposes updated for ${selectedDocument.name}`)
                setEditModalOpen(false)
            } else {
                toast.error(response.data.message || 'Failed to update purposes')
            }
        } catch (error) {
            console.error('Failed to save:', error)
            toast.error('Failed to save changes')
        } finally {
            setSaving(false)
        }
    }

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            'Identity': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            'Financial': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            'Tax': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
            'GST': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
            'Business': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
            'Capital Gains': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
            'Professional': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
            'Address Proof': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
            'Foreign/NRI': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
            'Payroll': 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
            'Import/Export': 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
            'Other': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        }
        return colors[category] || colors['Other']
    }

    // Group purposes by category for display
    const purposeGroups = useMemo(() => {
        return {
            'Identity': ['Identity', 'Photo ID', 'Age Proof', 'DOB Proof', 'Name Proof', 'KYC'],
            'Address': ['Address Proof', 'Residence Proof', 'Office Proof'],
            'Financial': ['Financial', 'Income Proof', 'Bank Proof', 'Transaction Proof', 'Investment', 'Loan', 'Property', 'Ownership Proof'],
            'Tax': ['Tax', 'TDS', 'Tax Credit', 'Deduction Proof', 'Filing Proof'],
            'Business': ['Business', 'Corporate', 'License', 'Registration Proof', 'Legal', 'Compliance', 'Audit'],
            'Employment': ['Employment Proof', 'Payroll'],
            'GST': ['GST', 'ITC'],
            'Other': ['Other', 'Miscellaneous', 'Authorization', 'Declaration', 'Verification', 'Travel', 'Capital Gains'],
        }
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        )
    }

    return (
        <Card>
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Document Master Configuration
                </CardTitle>
                <CardDescription className="text-blue-100">
                    Configure what purposes each document type can serve for auto-matching
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search documents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={selectedCategory === null ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(null)}
                        >
                            All
                        </Button>
                        {categories.slice(0, 5).map(cat => (
                            <Button
                                key={cat}
                                variant={selectedCategory === cat ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Documents List */}
                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                    {Object.entries(groupedDocuments).map(([category, docs]) => (
                        <div key={category} className="space-y-2">
                            <h3 className="font-semibold text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <Badge className={getCategoryColor(category)}>{category}</Badge>
                                <span className="text-xs font-normal">({docs.length} documents)</span>
                            </h3>
                            <div className="grid gap-2">
                                {docs.map(doc => (
                                    <div
                                        key={doc.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                                                <span className="font-medium text-gray-900 dark:text-white truncate">
                                                    {doc.name}
                                                </span>
                                            </div>
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {doc.purposes.slice(0, 5).map(purpose => (
                                                    <Badge
                                                        key={purpose}
                                                        variant="outline"
                                                        className="text-xs bg-white dark:bg-slate-700"
                                                    >
                                                        {purpose}
                                                    </Badge>
                                                ))}
                                                {doc.purposes.length > 5 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{doc.purposes.length - 5} more
                                                    </Badge>
                                                )}
                                                {doc.purposes.length === 0 && (
                                                    <span className="text-xs text-gray-400 italic">
                                                        No purposes configured
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEditClick(doc)}
                                            className="ml-3 shrink-0"
                                        >
                                            Edit
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {filteredDocuments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No documents found matching your search
                    </div>
                )}
            </CardContent>

            {/* Edit Modal */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-500" />
                            Edit Document Purposes
                        </DialogTitle>
                    </DialogHeader>

                    {selectedDocument && (
                        <div className="space-y-4">
                            {/* Document Info */}
                            <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                                <h3 className="font-semibold text-lg">{selectedDocument.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge className={getCategoryColor(selectedDocument.category)}>
                                        {selectedDocument.category}
                                    </Badge>
                                    <span className="text-xs text-gray-500">{selectedDocument.code}</span>
                                </div>
                            </div>

                            {/* Purpose Selection */}
                            <div className="space-y-4">
                                <Label className="text-sm font-medium">
                                    Select purposes this document can serve:
                                </Label>

                                {Object.entries(purposeGroups).map(([group, purposes]) => (
                                    <div key={group} className="space-y-2">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase">
                                            {group}
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {purposes.map(purpose => (
                                                <div
                                                    key={purpose}
                                                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${editedPurposes.includes(purpose)
                                                            ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-600'
                                                            : 'bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-600 hover:border-gray-300'
                                                        }`}
                                                    onClick={() => handlePurposeToggle(purpose)}
                                                >
                                                    <Checkbox
                                                        checked={editedPurposes.includes(purpose)}
                                                        onCheckedChange={() => handlePurposeToggle(purpose)}
                                                    />
                                                    <span className="text-sm">{purpose}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {/* Custom purposes (ones not in predefined list) */}
                                {editedPurposes.filter(p => !Object.values(purposeGroups).flat().includes(p)).length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase">
                                            Custom Purposes
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {editedPurposes
                                                .filter(p => !Object.values(purposeGroups).flat().includes(p))
                                                .map(purpose => (
                                                    <Badge
                                                        key={purpose}
                                                        variant="secondary"
                                                        className="flex items-center gap-1 cursor-pointer"
                                                        onClick={() => handlePurposeToggle(purpose)}
                                                    >
                                                        {purpose}
                                                        <X className="h-3 w-3" />
                                                    </Badge>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* Add custom purpose */}
                                <div className="flex gap-2 pt-2 border-t">
                                    <Input
                                        placeholder="Add custom purpose..."
                                        value={customPurpose}
                                        onChange={(e) => setCustomPurpose(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustomPurpose()}
                                        className="flex-1"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleAddCustomPurpose}
                                        disabled={!customPurpose.trim()}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Selected Summary */}
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    <strong>Selected:</strong> {editedPurposes.length} purpose{editedPurposes.length !== 1 ? 's' : ''}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {editedPurposes.map(p => (
                                        <Badge key={p} variant="secondary" className="text-xs">
                                            {p}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? (
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
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
