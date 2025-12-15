"use client"

import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import {
    FileText,
    Download,
    Eye,
    Trash2,
    RefreshCw,
    Folder,
    FolderOpen,
    ChevronRight,
    ChevronDown,
    UserCircle,
    User,
    Upload,
    X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import api from "@/lib/api"
import { toast } from "sonner"

interface Document {
    id: string
    fileName: string
    fileType: string
    fileSize: string
    uploadedAt: string
    documentType: string | null
    description: string | null
    client?: {
        id: string
        name: string
    } | null
    teamMember?: {
        id: string
        name: string
    } | null
}

interface DocumentType {
    type: string
    count: number
    documents: Document[]
}

interface UserFolder {
    userId: string
    userName: string
    userEmail: string
    documentTypes: DocumentType[]
}

interface RoleSection {
    title: string
    users: UserFolder[]
    totalFiles: number
}

interface HierarchicalData {
    selfDocuments: RoleSection
    clientDocuments: RoleSection
}

const DOCUMENT_TYPES = [
    { value: "PAN_CARD", label: "PAN Card" },
    { value: "AADHAR_CARD", label: "Aadhar Card" },
    { value: "BANK_STATEMENT", label: "Bank Statement" },
    { value: "FORM_16", label: "Form 16" },
    { value: "FORM_26AS", label: "Form 26AS" },
    { value: "GST_CERTIFICATE", label: "GST Certificate" },
    { value: "INCORPORATION_CERTIFICATE", label: "Incorporation Certificate" },
    { value: "PARTNERSHIP_DEED", label: "Partnership Deed" },
    { value: "MOA_AOA", label: "MOA/AOA" },
    { value: "AUDIT_REPORT", label: "Audit Report" },
    { value: "BALANCE_SHEET", label: "Balance Sheet" },
    { value: "PROFIT_LOSS", label: "Profit & Loss" },
    { value: "TAX_RETURN", label: "Tax Return" },
    { value: "OTHER", label: "Other" },
]

export default function TeamMemberDocumentsPage() {
    const [data, setData] = useState<HierarchicalData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set(["selfDocuments", "clientDocuments"]))
    const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
    const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set())

    // Upload modal state
    const [uploadModalOpen, setUploadModalOpen] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [documentType, setDocumentType] = useState("OTHER")
    const [description, setDescription] = useState("")
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const fetchDocuments = async () => {
        try {
            setIsLoading(true)
            const response = await api.get("/team-member/documents/hierarchy")
            if (response.data.success) {
                setData(response.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch documents:", error)
            toast.error("Failed to load documents")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchDocuments()
    }, [])

    const toggleRole = (roleKey: string) => {
        const newExpanded = new Set(expandedRoles)
        if (newExpanded.has(roleKey)) {
            newExpanded.delete(roleKey)
        } else {
            newExpanded.add(roleKey)
        }
        setExpandedRoles(newExpanded)
    }

    const toggleUser = (userId: string) => {
        const newExpanded = new Set(expandedUsers)
        if (newExpanded.has(userId)) {
            newExpanded.delete(userId)
        } else {
            newExpanded.add(userId)
        }
        setExpandedUsers(newExpanded)
    }

    const toggleType = (key: string) => {
        const newExpanded = new Set(expandedTypes)
        if (newExpanded.has(key)) {
            newExpanded.delete(key)
        } else {
            newExpanded.add(key)
        }
        setExpandedTypes(newExpanded)
    }

    const handleDownload = async (doc: Document) => {
        try {
            const response = await api.get(`/team-member/documents/${doc.id}/download`, {
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', doc.fileName)
            document.body.appendChild(link)
            link.click()
            link.remove()
            toast.success("Document downloaded")
        } catch (error) {
            console.error("Download error:", error)
            toast.error("Failed to download document")
        }
    }

    const handleView = async (doc: Document) => {
        try {
            const response = await api.get(`/team-member/documents/${doc.id}/download`, {
                responseType: 'blob'
            })

            const blob = new Blob([response.data], { type: doc.fileType })
            const url = window.URL.createObjectURL(blob)
            window.open(url, '_blank')

            setTimeout(() => window.URL.revokeObjectURL(url), 100)
        } catch (error) {
            console.error("View error:", error)
            toast.error("Failed to view document")
        }
    }

    const handleDelete = async (docId: string) => {
        if (!confirm("Are you sure you want to delete this document? You can only delete your own documents.")) {
            return
        }

        try {
            const response = await api.delete(`/team-member/documents/${docId}`)
            if (response.data.success) {
                toast.success("Document deleted successfully")
                fetchDocuments()
            }
        } catch (error: any) {
            console.error("Failed to delete document:", error)
            toast.error(error.response?.data?.message || "Failed to delete document")
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0])
        }
    }

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error("Please select a file")
            return
        }

        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', selectedFile)
            formData.append('documentType', documentType)
            if (description) {
                formData.append('description', description)
            }

            const response = await api.post('/team-member/documents/upload-self', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })

            if (response.data.success) {
                toast.success("Document uploaded successfully!")
                setUploadModalOpen(false)
                setSelectedFile(null)
                setDocumentType("OTHER")
                setDescription("")
                fetchDocuments()
            }
        } catch (error: any) {
            console.error("Upload error:", error)
            toast.error(error.response?.data?.message || "Failed to upload document")
        } finally {
            setIsUploading(false)
        }
    }

    const formatFileSize = (bytes: string) => {
        const size = Number(bytes)
        if (size < 1024) return size + " B"
        if (size < 1024 * 1024) return (size / 1024).toFixed(2) + " KB"
        return (size / (1024 * 1024)).toFixed(2) + " MB"
    }

    const formatDocumentType = (type: string) => {
        return type.split("_").map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(" ")
    }

    const getRoleIcon = (roleKey: string) => {
        switch (roleKey) {
            case "selfDocuments":
                return <User className="h-5 w-5 text-green-500" />
            case "clientDocuments":
                return <UserCircle className="h-5 w-5 text-blue-500" />
            default:
                return <Folder className="h-5 w-5 text-gray-500" />
        }
    }

    const getRoleBgColor = (roleKey: string) => {
        switch (roleKey) {
            case "selfDocuments":
                return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            case "clientDocuments":
                return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
            default:
                return "bg-gray-50 dark:bg-gray-800"
        }
    }

    const roleSections: { key: keyof HierarchicalData; section: RoleSection | undefined }[] = data
        ? [
            { key: "selfDocuments", section: data.selfDocuments },
            { key: "clientDocuments", section: data.clientDocuments },
        ]
        : []

    return (
        <div className="space-y-6">
            {/* Upload Modal */}
            <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Upload Self Document
                        </DialogTitle>
                        <DialogDescription>
                            Upload a document to your personal folder. This document will appear in "Self Documents".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* File Selector */}
                        <div className="space-y-2">
                            <Label>Select File</Label>
                            <div
                                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {selectedFile ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <FileText className="h-8 w-8 text-primary" />
                                        <div className="text-left">
                                            <p className="font-medium">{selectedFile.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {(selectedFile.size / 1024).toFixed(2)} KB
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setSelectedFile(null)
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-muted-foreground">Click to select a file</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            PDF, DOC, XLS, JPG, PNG (Max 10MB)
                                        </p>
                                    </>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileSelect}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                            />
                        </div>

                        {/* Document Type */}
                        <div className="space-y-2">
                            <Label>Document Type</Label>
                            <Select value={documentType} onValueChange={setDocumentType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select document type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DOCUMENT_TYPES.map(type => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label>Description (Optional)</Label>
                            <Textarea
                                placeholder="Add a description for this document..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUploadModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
                            {isUploading ? "Uploading..." : "Upload Document"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Documents</h1>
                    <p className="text-muted-foreground">
                        Your documents and assigned clients' documents
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setUploadModalOpen(true)} className="gap-2">
                        <Upload className="h-4 w-4" />
                        Upload Document
                    </Button>
                    <Button onClick={fetchDocuments} variant="outline" size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-4 rounded-lg">
                <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <span className="font-semibold">Team Member Access</span>
                </div>
                <p className="text-sm mt-1 opacity-90">
                    You can view your own documents and documents from clients assigned to you.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Document Storage</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">
                            Loading documents...
                        </div>
                    ) : !data ? (
                        <div className="p-8 text-center">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground mb-4">
                                Failed to load documents
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {roleSections.map(({ key, section }) => {
                                if (!section) return null
                                const isRoleExpanded = expandedRoles.has(key)

                                return (
                                    <div key={key} className={`border rounded-lg overflow-hidden ${getRoleBgColor(key)}`}>
                                        {/* Role Section Header */}
                                        <div
                                            className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/50 dark:hover:bg-black/20 transition-colors"
                                            onClick={() => toggleRole(key)}
                                        >
                                            {isRoleExpanded ? (
                                                <ChevronDown className="h-5 w-5 text-gray-500" />
                                            ) : (
                                                <ChevronRight className="h-5 w-5 text-gray-500" />
                                            )}
                                            {getRoleIcon(key)}
                                            <span className="font-semibold text-lg">{section.title}</span>
                                            <Badge variant="secondary" className="ml-auto">
                                                {section.users.length} {section.users.length === 1 ? 'folder' : 'folders'} • {section.totalFiles} files
                                            </Badge>
                                        </div>

                                        {/* Role Section Content */}
                                        {isRoleExpanded && (
                                            <div className="bg-white dark:bg-gray-900 border-t">
                                                {section.users.length === 0 ? (
                                                    <div className="p-6 text-center text-gray-500">
                                                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                        <p>
                                                            {key === "selfDocuments"
                                                                ? "No self-documents yet"
                                                                : "No assigned clients or no client documents"
                                                            }
                                                        </p>
                                                        {key === "selfDocuments" && (
                                                            <Button
                                                                variant="link"
                                                                className="mt-2"
                                                                onClick={() => setUploadModalOpen(true)}
                                                            >
                                                                Upload your first document
                                                            </Button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="p-2 space-y-1">
                                                        {section.users.map((user) => {
                                                            const userKey = `${key}-${user.userId}`
                                                            const isUserExpanded = expandedUsers.has(userKey)
                                                            const totalUserDocs = user.documentTypes.reduce((sum, dt) => sum + dt.count, 0)

                                                            return (
                                                                <div key={userKey} className="border rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                                                    {/* User Folder */}
                                                                    <div
                                                                        className="flex items-center gap-2 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors rounded-lg"
                                                                        onClick={() => toggleUser(userKey)}
                                                                    >
                                                                        {isUserExpanded ? (
                                                                            <ChevronDown className="h-4 w-4" />
                                                                        ) : (
                                                                            <ChevronRight className="h-4 w-4" />
                                                                        )}
                                                                        {isUserExpanded ? (
                                                                            <FolderOpen className="h-5 w-5 text-amber-500" />
                                                                        ) : (
                                                                            <Folder className="h-5 w-5 text-amber-500" />
                                                                        )}
                                                                        <div className="flex-1">
                                                                            <span className="font-medium">{user.userName}</span>
                                                                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                                                                {user.userEmail}
                                                                            </span>
                                                                        </div>
                                                                        <span className="text-sm text-muted-foreground">
                                                                            {totalUserDocs} files
                                                                        </span>
                                                                    </div>

                                                                    {/* Document Types */}
                                                                    {isUserExpanded && (
                                                                        <div className="pl-8 pb-2 pr-2 space-y-1">
                                                                            {user.documentTypes.map((docType) => {
                                                                                const typeKey = `${userKey}-${docType.type}`
                                                                                const isTypeExpanded = expandedTypes.has(typeKey)

                                                                                return (
                                                                                    <div key={typeKey} className="border-l-2 border-gray-200 dark:border-gray-700 ml-2">
                                                                                        {/* Document Type Folder */}
                                                                                        <div
                                                                                            className="flex items-center gap-2 p-2 pl-4 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded transition-colors"
                                                                                            onClick={() => toggleType(typeKey)}
                                                                                        >
                                                                                            {isTypeExpanded ? (
                                                                                                <ChevronDown className="h-4 w-4" />
                                                                                            ) : (
                                                                                                <ChevronRight className="h-4 w-4" />
                                                                                            )}
                                                                                            {isTypeExpanded ? (
                                                                                                <FolderOpen className="h-4 w-4 text-yellow-500" />
                                                                                            ) : (
                                                                                                <Folder className="h-4 w-4 text-yellow-500" />
                                                                                            )}
                                                                                            <span className="text-sm font-medium">{formatDocumentType(docType.type)}</span>
                                                                                            <span className="text-xs text-muted-foreground ml-auto">
                                                                                                {docType.count} files
                                                                                            </span>
                                                                                        </div>

                                                                                        {/* Documents */}
                                                                                        {isTypeExpanded && (
                                                                                            <div className="pl-8 space-y-1 pb-2">
                                                                                                {docType.documents.map((doc) => (
                                                                                                    <div
                                                                                                        key={doc.id}
                                                                                                        className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded group transition-colors"
                                                                                                    >
                                                                                                        <FileText className="h-4 w-4 text-gray-500" />
                                                                                                        <div className="flex-1 min-w-0">
                                                                                                            <div className="text-sm truncate">{doc.fileName}</div>
                                                                                                            <div className="text-xs text-muted-foreground">
                                                                                                                {formatFileSize(doc.fileSize)} • {format(new Date(doc.uploadedAt), "MMM d, yyyy")}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                                            <Button
                                                                                                                variant="ghost"
                                                                                                                size="icon"
                                                                                                                className="h-8 w-8"
                                                                                                                onClick={(e) => {
                                                                                                                    e.stopPropagation()
                                                                                                                    handleView(doc)
                                                                                                                }}
                                                                                                                title="View"
                                                                                                            >
                                                                                                                <Eye className="h-4 w-4" />
                                                                                                            </Button>
                                                                                                            <Button
                                                                                                                variant="ghost"
                                                                                                                size="icon"
                                                                                                                className="h-8 w-8"
                                                                                                                onClick={(e) => {
                                                                                                                    e.stopPropagation()
                                                                                                                    handleDownload(doc)
                                                                                                                }}
                                                                                                                title="Download"
                                                                                                            >
                                                                                                                <Download className="h-4 w-4" />
                                                                                                            </Button>
                                                                                                            {/* Only show delete for self documents */}
                                                                                                            {key === "selfDocuments" && (
                                                                                                                <Button
                                                                                                                    variant="ghost"
                                                                                                                    size="icon"
                                                                                                                    className="h-8 w-8"
                                                                                                                    onClick={(e) => {
                                                                                                                        e.stopPropagation()
                                                                                                                        handleDelete(doc.id)
                                                                                                                    }}
                                                                                                                    title="Delete"
                                                                                                                >
                                                                                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                                                                                </Button>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                ))}
                                                                                            </div>
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
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
