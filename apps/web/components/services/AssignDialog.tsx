"use client"

import { useState, useEffect } from "react"
import {
    UserPlus,
    Loader2,
    User,
    Users,
    Search,
    Star
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import api from "@/lib/api"
import { assignService, delegateService } from "@/lib/service-workflow-api"

interface AssignDialogProps {
    serviceId: string
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    mode: 'assign' | 'delegate'
    currentAssigneeName?: string
}

interface Assignee {
    id: string
    name: string
    email: string
    type: 'PROJECT_MANAGER' | 'TEAM_MEMBER'
    isSelf?: boolean
}

export default function AssignDialog({
    serviceId,
    isOpen,
    onClose,
    onSuccess,
    mode,
    currentAssigneeName,
}: AssignDialogProps) {
    const [assignees, setAssignees] = useState<Assignee[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedType, setSelectedType] = useState<'PROJECT_MANAGER' | 'TEAM_MEMBER'>('PROJECT_MANAGER')
    const [selectedAssignee, setSelectedAssignee] = useState<Assignee | null>(null)
    const [notes, setNotes] = useState('')

    useEffect(() => {
        if (isOpen) {
            fetchAssignees()
            setSelectedAssignee(null)
            setNotes('')
            setSearchTerm('')
        }
    }, [isOpen])

    const fetchAssignees = async () => {
        setIsLoading(true)
        try {
            // Fetch both PMs and TMs in parallel
            const [pmRes, tmRes] = await Promise.all([
                api.get('/project-manager/peers'),       // New API: all PMs in firm
                api.get('/project-manager/team-members') // Existing: all TMs in firm
            ])

            // Build PM list - self is already marked and sorted first from API
            const pms: Assignee[] = (pmRes.data.data || []).map((pm: any) => ({
                id: pm.id,
                name: pm.isSelf ? `${pm.name} (You)` : pm.name,
                email: pm.email,
                type: 'PROJECT_MANAGER' as const,
                isSelf: pm.isSelf || false,
            }))

            // Build TM list
            const tms: Assignee[] = (tmRes.data.data || []).map((tm: any) => ({
                id: tm.id,
                name: tm.name,
                email: tm.email,
                type: 'TEAM_MEMBER' as const,
                isSelf: false,
            }))

            setAssignees([...pms, ...tms])
        } catch (error) {
            console.error('Failed to fetch assignees:', error)
            toast.error('Failed to load team members')
        } finally {
            setIsLoading(false)
        }
    }

    const filteredAssignees = assignees.filter(a => {
        if (a.type !== selectedType) return false
        if (searchTerm) {
            const search = searchTerm.toLowerCase()
            return a.name.toLowerCase().includes(search) || a.email.toLowerCase().includes(search)
        }
        return true
    })

    const handleSubmit = async () => {
        if (!selectedAssignee) {
            toast.error('Please select a team member')
            return
        }

        setIsSubmitting(true)
        try {
            let response

            if (mode === 'assign') {
                response = await assignService(serviceId, {
                    assigneeId: selectedAssignee.id,
                    assigneeType: selectedAssignee.type,
                    notes: notes || undefined,
                })
            } else {
                response = await delegateService(serviceId, {
                    assigneeId: selectedAssignee.id,
                    assigneeType: selectedAssignee.type,
                    delegationReason: notes || undefined,
                })
            }

            if (response.success) {
                toast.success(
                    mode === 'assign'
                        ? `Service assigned to ${selectedAssignee.name}`
                        : `Service delegated to ${selectedAssignee.name}`
                )
                onSuccess()
                onClose()
            } else {
                toast.error(response.message || 'Failed to assign service')
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to assign service')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-blue-600" />
                        {mode === 'assign' ? 'Assign Service' : 'Delegate Service'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'assign'
                            ? 'Select a team member to assign this service to'
                            : `Delegate this service from ${currentAssigneeName || 'current assignee'} to another team member`
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Type Selection */}
                    <div className="space-y-2">
                        <Label>Assign to:</Label>
                        <RadioGroup
                            value={selectedType}
                            onValueChange={(v) => {
                                setSelectedType(v as 'PROJECT_MANAGER' | 'TEAM_MEMBER')
                                setSelectedAssignee(null)
                            }}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="PROJECT_MANAGER" id="pm" />
                                <Label htmlFor="pm" className="flex items-center gap-2 cursor-pointer">
                                    <User className="h-4 w-4" /> Project Manager
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="TEAM_MEMBER" id="tm" />
                                <Label htmlFor="tm" className="flex items-center gap-2 cursor-pointer">
                                    <Users className="h-4 w-4" /> Team Member
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Assignee List */}
                    <div className="max-h-60 overflow-y-auto border rounded-lg">
                        {isLoading ? (
                            <div className="p-8 text-center">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                                <p className="text-sm text-gray-500 mt-2">Loading team members...</p>
                            </div>
                        ) : filteredAssignees.length === 0 ? (
                            <div className="p-8 text-center">
                                <Users className="h-8 w-8 mx-auto text-gray-300" />
                                <p className="text-sm text-gray-500 mt-2">
                                    No {selectedType === 'PROJECT_MANAGER' ? 'Project Managers' : 'Team Members'} found
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {filteredAssignees.map((assignee) => (
                                    <div
                                        key={assignee.id}
                                        onClick={() => setSelectedAssignee(assignee)}
                                        className={`p-3 cursor-pointer transition-colors ${selectedAssignee?.id === assignee.id
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium relative ${assignee.type === 'PROJECT_MANAGER'
                                                    ? 'bg-gradient-to-br from-blue-500 to-purple-500'
                                                    : 'bg-gradient-to-br from-green-500 to-teal-500'
                                                }`}>
                                                {assignee.name.charAt(0).toUpperCase()}
                                                {assignee.isSelf && (
                                                    <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5">
                                                        <Star className="h-3 w-3 text-yellow-800 fill-yellow-800" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {assignee.name}
                                                    </p>
                                                    {assignee.isSelf && (
                                                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                                            You
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500">{assignee.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notes / Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">
                            {mode === 'assign' ? 'Notes (Optional)' : 'Delegation Reason (Optional)'}
                        </Label>
                        <Textarea
                            id="notes"
                            placeholder={
                                mode === 'assign'
                                    ? 'Add any notes for the assignee...'
                                    : 'Explain why this service is being delegated...'
                            }
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedAssignee}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {mode === 'assign' ? 'Assigning...' : 'Delegating...'}
                            </>
                        ) : (
                            <>
                                <UserPlus className="h-4 w-4 mr-2" />
                                {mode === 'assign' ? 'Assign Service' : 'Delegate Service'}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
