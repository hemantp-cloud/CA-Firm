"use client"

import { useState, useEffect, useMemo } from "react"
import { Check, FileText, HelpCircle, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Document type with category
interface DocumentTypeOption {
    code: string           // e.g., "PAN_CARD"
    name: string           // e.g., "PAN Card"
    category: string       // e.g., "Identity"
    description?: string   // e.g., "Permanent Account Number card"
}

interface DocumentTypeSearchProps {
    value?: string                          // Selected document type code
    onSelect: (value: { documentType: string; category: string; name: string; customName?: string } | null) => void
    documentLibrary: {
        categories: Array<{
            category: string
            documents: Array<{
                id: string
                code: string
                name: string
                description: string | null
            }>
        }>
    } | null
    placeholder?: string
    disabled?: boolean
    className?: string
}

export default function DocumentTypeSearch({
    value,
    onSelect,
    documentLibrary,
    placeholder = "Search for document type...",
    disabled = false,
    className,
}: DocumentTypeSearchProps) {
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [showCustomInput, setShowCustomInput] = useState(false)
    const [customDocName, setCustomDocName] = useState("")

    // Flatten document library into searchable list
    const allDocumentTypes: DocumentTypeOption[] = useMemo(() => {
        if (!documentLibrary?.categories) return []

        return documentLibrary.categories.flatMap(cat =>
            cat.documents.map(doc => ({
                code: doc.code,
                name: doc.name,
                category: cat.category,
                description: doc.description || undefined,
            }))
        )
    }, [documentLibrary])

    // Find selected document details
    const selectedDoc = useMemo(() => {
        if (!value) return null
        return allDocumentTypes.find(d => d.code === value) || null
    }, [value, allDocumentTypes])

    // Filter documents based on search query
    const filteredDocs = useMemo(() => {
        if (!searchQuery.trim()) return allDocumentTypes

        const query = searchQuery.toLowerCase()
        return allDocumentTypes.filter(doc =>
            doc.name.toLowerCase().includes(query) ||
            doc.code.toLowerCase().includes(query) ||
            doc.category.toLowerCase().includes(query) ||
            (doc.description && doc.description.toLowerCase().includes(query))
        )
    }, [searchQuery, allDocumentTypes])

    // Group filtered docs by category for display
    const groupedDocs = useMemo(() => {
        const groups: { [category: string]: DocumentTypeOption[] } = {}
        filteredDocs.forEach(doc => {
            if (!groups[doc.category]) {
                groups[doc.category] = []
            }
            groups[doc.category].push(doc)
        })
        return groups
    }, [filteredDocs])

    const handleSelect = (doc: DocumentTypeOption) => {
        onSelect({
            documentType: doc.code,
            category: doc.category,
            name: doc.name,
        })
        setOpen(false)
        setSearchQuery("")
    }

    const handleSelectOther = () => {
        // Don't close immediately - show custom name input first
        setShowCustomInput(true)
    }

    const handleConfirmOther = () => {
        onSelect({
            documentType: "OTHER",
            category: "Miscellaneous",
            name: customDocName.trim() || "Other Document",
            customName: customDocName.trim() || undefined,
        })
        setOpen(false)
        setSearchQuery("")
        setShowCustomInput(false)
        setCustomDocName("")
    }

    const handleCancelCustomInput = () => {
        setShowCustomInput(false)
        setCustomDocName("")
    }

    const handleClear = () => {
        onSelect(null)
        setSearchQuery("")
    }

    // Get category color
    const getCategoryColor = (category: string) => {
        const colors: { [key: string]: string } = {
            "Identity": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
            "Tax": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
            "Financial": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
            "GST": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
            "Business": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
            "Payroll": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
            "Audit": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
            "Compliance": "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
            "Miscellaneous": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        }
        return colors[category] || colors["Miscellaneous"]
    }

    return (
        <div className={cn("space-y-2", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        disabled={disabled}
                        className={cn(
                            "w-full justify-between h-auto min-h-[44px] px-3 py-2",
                            !selectedDoc && "text-muted-foreground"
                        )}
                    >
                        {selectedDoc ? (
                            <div className="flex items-center gap-2 flex-1 text-left">
                                <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{selectedDoc.name}</div>
                                </div>
                                <Badge className={cn("shrink-0 text-xs", getCategoryColor(selectedDoc.category))}>
                                    {selectedDoc.category}
                                </Badge>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 flex-1">
                                <Search className="h-4 w-4 shrink-0" />
                                <span>{placeholder}</span>
                            </div>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Type to search... e.g., 'PAN Card'"
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                        />
                        <CommandList>
                            {/* Empty state with Upload as Other option */}
                            {filteredDocs.length === 0 && (
                                <CommandEmpty className="py-4">
                                    <div className="flex flex-col items-center gap-3">
                                        <HelpCircle className="h-8 w-8 text-muted-foreground" />
                                        <div className="text-center">
                                            <p className="font-medium">No matching documents found</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Can't find your document type?
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleSelectOther}
                                            className="mt-2"
                                        >
                                            <FileText className="h-4 w-4 mr-2" />
                                            Upload as "Other"
                                        </Button>
                                        <p className="text-xs text-muted-foreground">
                                            Your CA will categorize it later
                                        </p>
                                    </div>
                                </CommandEmpty>
                            )}

                            {/* Grouped results by category */}
                            {Object.entries(groupedDocs).map(([category, docs]) => (
                                <CommandGroup key={category} heading={category}>
                                    {docs.map(doc => (
                                        <CommandItem
                                            key={doc.code}
                                            value={doc.code}
                                            onSelect={() => handleSelect(doc)}
                                            className="flex items-center gap-2 py-2 cursor-pointer"
                                        >
                                            <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium">{doc.name}</div>
                                                {doc.description && (
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {doc.description}
                                                    </div>
                                                )}
                                            </div>
                                            <Badge className={cn("shrink-0 text-xs", getCategoryColor(category))}>
                                                {category}
                                            </Badge>
                                            {value === doc.code && (
                                                <Check className="h-4 w-4 text-green-600 shrink-0" />
                                            )}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            ))}

                            {/* Upload as Other option (always visible at bottom when there are results) */}
                            {filteredDocs.length > 0 && !showCustomInput && (
                                <>
                                    <CommandSeparator />
                                    <CommandGroup>
                                        <CommandItem
                                            value="OTHER"
                                            onSelect={handleSelectOther}
                                            className="flex items-center gap-2 py-2 cursor-pointer text-muted-foreground"
                                        >
                                            <HelpCircle className="h-4 w-4 shrink-0" />
                                            <div className="flex-1">
                                                <div className="font-medium">Can't find your document?</div>
                                                <div className="text-xs">Upload as "Other" - Specify what it is</div>
                                            </div>
                                        </CommandItem>
                                    </CommandGroup>
                                </>
                            )}

                            {/* Custom name input for Other documents */}
                            {showCustomInput && (
                                <div className="p-3 border-t">
                                    <div className="text-sm font-medium mb-2">What is this document?</div>
                                    <input
                                        type="text"
                                        value={customDocName}
                                        onChange={(e) => setCustomDocName(e.target.value)}
                                        placeholder="e.g., Rent Agreement, NOC, Property Tax..."
                                        className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && customDocName.trim()) {
                                                handleConfirmOther()
                                            } else if (e.key === 'Escape') {
                                                handleCancelCustomInput()
                                            }
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1.5">
                                        This helps us match your document automatically
                                    </p>
                                    <div className="flex gap-2 mt-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCancelCustomInput}
                                            className="flex-1"
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleConfirmOther}
                                            className="flex-1"
                                            disabled={!customDocName.trim()}
                                        >
                                            Continue
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* Selected document indicator below the combobox */}
            {selectedDoc && (
                <div className="flex items-center justify-between p-2 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-green-800 dark:text-green-200">
                            Selected: <strong>{selectedDoc.name}</strong>
                        </span>
                        <Badge className={cn("text-xs", getCategoryColor(selectedDoc.category))}>
                            {selectedDoc.category}
                        </Badge>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleClear}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}
        </div>
    )
}
