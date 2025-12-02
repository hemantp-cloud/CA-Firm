"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import {
    FileText,
    Upload,
    Download,
    Eye,
    Trash2,
    RefreshCw,
    Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import api from "@/lib/api"
import { toast } from "sonner"

interface Document {
    id: string
    fileName: string
    fileType: string
    fileSize: bigint
    uploadStatus: string
    uploadedAt: string
    documentType: string | null
    description: string | null
    service?: {
        id: string
        title: string
    }
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

export default function AdminDocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Upload form state
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [documentType, setDocumentType] = useState("")
    const [description, setDescription] = useState("")

    const fetchDocuments = async () => {
        try {
            setIsLoading(true)
            const response = await api.get("/admin/documents")
            if (response.data.success) {
                setDocuments(response.data.data)
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0])
        }
    }

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error("Please select a file")
            return
        }

        try {
            setIsUploading(true)
            const formData = new FormData()
            formData.append("file", selectedFile)
            if (documentType) formData.append("documentType", documentType)
            if (description) formData.append("description", description)

            const response = await api.post("/admin/documents/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })

            if (response.data.success) {
                toast.success("Document uploaded successfully")
                setIsDialogOpen(false)
                setSelectedFile(null)
                setDocumentType("")
                setDescription("")
                fetchDocuments()
            }
        } catch (error: any) {
            console.error("Failed to upload document:", error)
            toast.error(error.response?.data?.message || "Failed to upload document")
        } finally {
            setIsUploading(false)
        }
    }

    const handleDownload = async (doc: Document) => {
        try {
            const response = await api.get(`/documents/${doc.id}/download`, {
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', doc.fileName)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (error) {
            toast.error("Failed to download document")
        }
    }

    const handleView = (doc: Document) => {
        window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/documents/${doc.id}/view`, '_blank')
    }

    const handleDelete = async (docId: string) => {
        if (!confirm("Are you sure you want to delete this document?")) {
            return
        }

        try {
            const response = await api.delete(`/admin/documents/${docId}`)
            if (response.data.success) {
                toast.success("Document deleted successfully")
                fetchDocuments()
            }
        } catch (error: any) {
            console.error("Failed to delete document:", error)
            toast.error(error.response?.data?.message || "Failed to delete document")
        }
    }

    const formatFileSize = (bytes: bigint) => {
        const size = Number(bytes)
        if (size < 1024) return size + " B"
        if (size < 1024 * 1024) return (size / 1024).toFixed(2) + " KB"
        return (size / (1024 * 1024)).toFixed(2) + " MB"
    }

    const formatDocumentType = (type: string | null) => {
        if (!type) return "-"
        const found = DOCUMENT_TYPES.find(t => t.value === type)
        return found ? found.label : type
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Documents</h1>
                    <p className="text-muted-foreground">
                        Personal document storage for Admin
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchDocuments} variant="outline" size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Upload Document
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Upload Document</DialogTitle>
                                <DialogDescription>
                                    Upload a personal document to your storage
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="file">File</Label>
                                    <Input
                                        id="file"
                                        type="file"
                                        onChange={handleFileChange}
                                        disabled={isUploading}
                                    />
                                    {selectedFile && (
                                        <p className="text-sm text-muted-foreground">
                                            Selected: {selectedFile.name}
                                        </p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="documentType">Document Type (Optional)</Label>
                                    <Select value={documentType} onValueChange={setDocumentType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select document type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DOCUMENT_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Add a description..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        disabled={isUploading}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                    disabled={isUploading}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleUpload} disabled={isUploading || !selectedFile}>
                                    {isUploading ? (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Upload
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Your Documents</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        {isLoading ? (
                            <div className="p-8 text-center text-muted-foreground">
                                Loading documents...
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="p-8 text-center">
                                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-muted-foreground mb-4">
                                    No documents uploaded yet
                                </p>
                                <Button onClick={() => setIsDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Upload Your First Document
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>File Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Uploaded</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {documents.map((doc) => (
                                        <TableRow key={doc.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-blue-500" />
                                                    <div>
                                                        <div>{doc.fileName}</div>
                                                        {doc.description && (
                                                            <div className="text-xs text-muted-foreground">
                                                                {doc.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{formatDocumentType(doc.documentType)}</TableCell>
                                            <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                                            <TableCell>
                                                {doc.uploadedAt ? format(new Date(doc.uploadedAt), "MMM d, yyyy") : "-"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleView(doc)}
                                                        title="View"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDownload(doc)}
                                                        title="Download"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(doc.id)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
