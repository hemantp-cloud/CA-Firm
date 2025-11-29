"use client"

import { useState, useEffect } from "react"
import { Download, Filter, FileText, Upload, X } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import api from "@/lib/api"

interface Document {
    id: string
    fileName: string
    documentType: string | null
    description: string | null
    uploadedAt: string
    isFromCA: boolean
    user: {
        id: string
        name: string
    }
    service: {
        id: string
        title: string
    } | null
}

export default function AdminDocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)

    // Upload form state
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [uploadDocType, setUploadDocType] = useState<string>("")
    const [uploadDescription, setUploadDescription] = useState<string>("")

    useEffect(() => {
        fetchDocuments()
    }, [])

    const fetchDocuments = async () => {
        try {
            setIsLoading(true)
            const response = await api.get("/documents")
            if (response.data.success) {
                setDocuments(response.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch documents:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            setUploadError(null)
        }
    }

    const handleUpload = async () => {
        if (!selectedFile) {
            setUploadError("Please select a file")
            return
        }

        if (!uploadDocType) {
            setUploadError("Please select a document type")
            return
        }

        setIsUploading(true)
        setUploadError(null)

        try {
            const formData = new FormData()
            formData.append("file", selectedFile)
            formData.append("documentType", uploadDocType)
            if (uploadDescription) {
                formData.append("description", uploadDescription)
            }

            const response = await api.post("/documents/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })

            if (response.data.success) {
                // Reset form
                setSelectedFile(null)
                setUploadDocType("")
                setUploadDescription("")
                setIsUploadOpen(false)

                // Refresh documents list
                fetchDocuments()

                alert("Document uploaded successfully!")
            }
        } catch (error: any) {
            console.error("Upload failed:", error)
            setUploadError(
                error.response?.data?.message ||
                "Failed to upload document. Please try again."
            )
        } finally {
            setIsUploading(false)
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
    }

    const filteredDocuments = documents.filter((doc) => {
        if (typeFilter === "all") return true
        return doc.documentType === typeFilter
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Documents</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage all documents in the system
                    </p>
                </div>

                {/* Upload Button with Dialog */}
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Document
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Upload Document</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            {uploadError && (
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                    <p className="text-sm text-red-800 dark:text-red-200">{uploadError}</p>
                                </div>
                            )}

                            {/* File Input */}
                            <div>
                                <Label htmlFor="file">
                                    Select File <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="file"
                                    type="file"
                                    onChange={handleFileChange}
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                {selectedFile && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Selected: {selectedFile.name}
                                    </p>
                                )}
                            </div>

                            {/* Document Type */}
                            <div>
                                <Label htmlFor="docType">
                                    Document Type <span className="text-red-500">*</span>
                                </Label>
                                <Select value={uploadDocType} onValueChange={setUploadDocType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select document type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PAN_CARD">PAN Card</SelectItem>
                                        <SelectItem value="AADHAR_CARD">Aadhar Card</SelectItem>
                                        <SelectItem value="BANK_STATEMENT">Bank Statement</SelectItem>
                                        <SelectItem value="FORM_16">Form 16</SelectItem>
                                        <SelectItem value="FORM_26AS">Form 26AS</SelectItem>
                                        <SelectItem value="GST_CERTIFICATE">GST Certificate</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Description */}
                            <div>
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Input
                                    id="description"
                                    value={uploadDescription}
                                    onChange={(e) => setUploadDescription(e.target.value)}
                                    placeholder="Enter document description"
                                />
                            </div>

                            {/* Upload Button */}
                            <div className="flex gap-3 pt-2">
                                <Button
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                    className="flex-1"
                                >
                                    {isUploading ? "Uploading..." : "Upload"}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsUploadOpen(false)}
                                    disabled={isUploading}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filter */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="PAN_CARD">PAN Card</SelectItem>
                                <SelectItem value="AADHAR_CARD">Aadhar Card</SelectItem>
                                <SelectItem value="BANK_STATEMENT">Bank Statement</SelectItem>
                                <SelectItem value="FORM_16">Form 16</SelectItem>
                                <SelectItem value="FORM_26AS">Form 26AS</SelectItem>
                                <SelectItem value="GST_CERTIFICATE">GST Certificate</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Documents List */}
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Documents ({filteredDocuments.length})
                    </h2>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-gray-500">Loading documents...</div>
                    ) : filteredDocuments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                            <p>No documents found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>File Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Uploaded</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDocuments.map((doc) => (
                                    <TableRow key={doc.id}>
                                        <TableCell className="font-medium">{doc.fileName}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{doc.documentType || "-"}</Badge>
                                        </TableCell>
                                        <TableCell>{doc.user.name}</TableCell>
                                        <TableCell>{doc.service?.title || "-"}</TableCell>
                                        <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
