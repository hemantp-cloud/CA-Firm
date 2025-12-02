"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import {
    FileText,
    Search,
    Download,
    Eye,
    RefreshCw,
    Folder,
    ChevronRight,
    Home,
    FolderOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    user: {
        id: string
        name: string
        email: string
    }
    service?: {
        title: string
    }
}

interface DocumentType {
    type: string
    count: number
    documents: Document[]
}

interface ClientFolder {
    clientId: string
    clientName: string
    clientEmail: string
    documentTypes: DocumentType[]
}

export default function AdminClientDocumentsPage() {
    const [organizedData, setOrganizedData] = useState<ClientFolder[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedClient, setSelectedClient] = useState<ClientFolder | null>(null)
    const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null)

    const fetchDocuments = async () => {
        try {
            setIsLoading(true)
            const response = await api.get("/admin/client-documents")
            if (response.data.success) {
                setOrganizedData(response.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch documents:", error)
            toast.error("Failed to load client documents")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchDocuments()
    }, [])

    const handleDownload = async (doc: Document) => {
        try {
            const response = await api.get(`/documents/download/${doc.id}`, {
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', doc.fileName)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            toast.success("Document downloaded successfully")
        } catch (error: any) {
            console.error('Download error:', error)
            console.error('Error response:', error.response)
            toast.error(error.response?.data?.message || "Failed to download document")
        }
    }

    const handleView = async (doc: Document) => {
        try {
            const response = await api.get(`/documents/view/${doc.id}`, {
                responseType: 'blob'
            })

            // Get the content type from response headers or use the document's fileType
            const contentType = response.headers['content-type'] || doc.fileType || 'application/octet-stream'

            // Create blob with proper MIME type
            const blob = new Blob([response.data], { type: contentType })
            const url = window.URL.createObjectURL(blob)
            window.open(url, '_blank')

            // Clean up after a delay
            setTimeout(() => window.URL.revokeObjectURL(url), 100)
        } catch (error) {
            console.error('View error:', error)
            toast.error("Failed to view document")
        }
    }

    const formatFileSize = (bytes: bigint) => {
        const size = Number(bytes)
        if (size < 1024) return size + " B"
        if (size < 1024 * 1024) return (size / 1024).toFixed(2) + " KB"
        return (size / (1024 * 1024)).toFixed(2) + " MB"
    }

    const formatDocumentType = (type: string) => {
        return type.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')
    }

    const filteredData = organizedData.filter(client =>
        client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const resetNavigation = () => {
        setSelectedClient(null)
        setSelectedDocType(null)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Client Documents</h1>
                    <p className="text-muted-foreground">
                        Browse client documents organized by folders
                    </p>
                </div>
                <Button onClick={fetchDocuments} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetNavigation}
                    className="h-8"
                >
                    <Home className="h-4 w-4 mr-1" />
                    All Clients
                </Button>
                {selectedClient && (
                    <>
                        <ChevronRight className="h-4 w-4" />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDocType(null)}
                            className="h-8"
                        >
                            <Folder className="h-4 w-4 mr-1" />
                            {selectedClient.clientName}
                        </Button>
                    </>
                )}
                {selectedDocType && (
                    <>
                        <ChevronRight className="h-4 w-4" />
                        <span className="font-medium text-foreground">
                            {formatDocumentType(selectedDocType.type)}
                        </span>
                    </>
                )}
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <CardTitle className="text-lg font-medium">
                            {!selectedClient && "All Clients"}
                            {selectedClient && !selectedDocType && `${selectedClient.clientName}'s Documents`}
                            {selectedDocType && `${formatDocumentType(selectedDocType.type)} Files`}
                        </CardTitle>
                        {!selectedClient && !selectedDocType && (
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search clients..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        {isLoading ? (
                            <div className="p-8 text-center text-muted-foreground">
                                Loading client documents...
                            </div>
                        ) : !selectedClient ? (
                            // Level 1: Client List
                            filteredData.length === 0 ? (
                                <div className="p-8 text-center">
                                    <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                    <p className="text-muted-foreground">
                                        No clients with documents found
                                    </p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Client Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead className="text-right">Documents</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredData.map((client) => {
                                            const totalDocs = client.documentTypes.reduce((sum, dt) => sum + dt.count, 0)
                                            return (
                                                <TableRow
                                                    key={client.clientId}
                                                    className="cursor-pointer hover:bg-muted/50"
                                                    onClick={() => setSelectedClient(client)}
                                                >
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <Folder className="h-4 w-4 text-blue-500" />
                                                            {client.clientName}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{client.clientEmail}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge variant="secondary">{totalDocs} files</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            )
                        ) : !selectedDocType ? (
                            // Level 2: Document Types
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Document Type</TableHead>
                                        <TableHead className="text-right">Files</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedClient.documentTypes.map((docType) => (
                                        <TableRow
                                            key={docType.type}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => setSelectedDocType(docType)}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Folder className="h-4 w-4 text-amber-500" />
                                                    {formatDocumentType(docType.type)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="secondary">{docType.count} files</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            // Level 3: Document Files
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>File Name</TableHead>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Uploaded</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedDocType.documents.map((doc) => (
                                        <TableRow key={doc.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-blue-500" />
                                                    {doc.fileName}
                                                </div>
                                            </TableCell>
                                            <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                                            <TableCell>
                                                {doc.uploadedAt ? format(new Date(doc.uploadedAt), "MMM d, yyyy") : "-"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
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
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDownload(doc)
                                                        }}
                                                        title="Download"
                                                    >
                                                        <Download className="h-4 w-4" />
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
