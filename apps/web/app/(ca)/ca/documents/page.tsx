"use client"

import { useState, useEffect } from "react"
import { Download, Filter, FileText } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

export default function CaDocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [typeFilter, setTypeFilter] = useState<string>("all")

    useEffect(() => {
        fetchDocuments()
    }, [])

    const fetchDocuments = async () => {
        try {
            setIsLoading(true)
            const response = await api.get("/ca/documents")
            if (response.data.success) {
                setDocuments(response.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch documents:", error)
        } finally {
            setIsLoading(false)
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
                        View documents uploaded by your customers
                    </p>
                </div>
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
