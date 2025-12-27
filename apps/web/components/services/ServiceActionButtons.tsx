"use client"

import { useState } from "react"
import {
    Play,
    Pause,
    Send,
    Check,
    CheckCircle,
    CheckCircle2,
    Edit,
    FileQuestion,
    Share2,
    UserPlus,
    X,
    Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
    ServiceStatus,
    getAvailableActions,
    ActionConfig
} from "@/types/service-workflow"
import * as serviceApi from "@/lib/service-workflow-api"
import RequestDocumentsDialog from "./RequestDocumentsDialog"

interface ServiceActionButtonsProps {
    serviceId: string
    status: ServiceStatus
    userRole: string
    isAssignee: boolean
    onActionComplete: () => void
    serviceName?: string  // NEW: for RequestDocumentsDialog
    clientName?: string   // NEW: for RequestDocumentsDialog
}

// Icon mapping
const actionIcons: Record<string, React.ReactNode> = {
    Play: <Play className="h-4 w-4" />,
    Pause: <Pause className="h-4 w-4" />,
    Send: <Send className="h-4 w-4" />,
    Check: <Check className="h-4 w-4" />,
    CheckCircle: <CheckCircle className="h-4 w-4" />,
    CheckCircle2: <CheckCircle2 className="h-4 w-4" />,
    Edit: <Edit className="h-4 w-4" />,
    FileQuestion: <FileQuestion className="h-4 w-4" />,
    Share2: <Share2 className="h-4 w-4" />,
    UserPlus: <UserPlus className="h-4 w-4" />,
    X: <X className="h-4 w-4" />,
}

export default function ServiceActionButtons({
    serviceId,
    status,
    userRole,
    isAssignee,
    onActionComplete,
    serviceName = "Service",
    clientName = "Client",
}: ServiceActionButtonsProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [activeAction, setActiveAction] = useState<ActionConfig | null>(null)
    const [inputValue, setInputValue] = useState("")
    const [dialogOpen, setDialogOpen] = useState(false)
    const [requestDocsDialogOpen, setRequestDocsDialogOpen] = useState(false)  // NEW: Enhanced dialog

    // Filter out 'assign' and 'delegate' as they are handled by AssignDialog in the page header
    const allActions = getAvailableActions(status, userRole, isAssignee)
    const actions = allActions.filter(a => !['assign', 'delegate'].includes(a.action))

    const handleActionClick = (action: ActionConfig) => {
        // NEW: Special handling for request-documents to use enhanced dialog
        if (action.action === 'request-documents') {
            setRequestDocsDialogOpen(true)
            return
        }

        if (action.requiresInput || action.confirmMessage) {
            setActiveAction(action)
            setInputValue("")
            setDialogOpen(true)
        } else {
            executeAction(action.action)
        }
    }

    const executeAction = async (actionName: string, input?: string) => {
        setIsLoading(true)
        try {
            let response

            switch (actionName) {
                case 'start-work':
                    response = await serviceApi.startWork(serviceId, input)
                    break
                case 'request-documents':
                    // Split input by newlines or commas
                    const documents = input?.split(/[\n,]/).map(d => d.trim()).filter(Boolean) || []
                    response = await serviceApi.requestDocuments(serviceId, { documentList: documents })
                    break
                case 'put-on-hold':
                    response = await serviceApi.putOnHold(serviceId, input || '')
                    break
                case 'resume-work':
                    response = await serviceApi.resumeWork(serviceId, input)
                    break
                case 'submit-review':
                    response = await serviceApi.submitForReview(serviceId, input)
                    break
                case 'approve':
                    response = await serviceApi.approveWork(serviceId, input)
                    break
                case 'request-changes':
                    response = await serviceApi.requestChanges(serviceId, input || '')
                    break
                case 'mark-complete':
                    response = await serviceApi.markComplete(serviceId, input)
                    break
                case 'deliver':
                    response = await serviceApi.deliverToClient(serviceId, input)
                    break
                case 'close':
                    response = await serviceApi.closeService(serviceId, input)
                    break
                case 'cancel':
                    response = await serviceApi.cancelService(serviceId, input || '')
                    break
                default:
                    throw new Error(`Unknown action: ${actionName}`)
            }

            if (response.success) {
                toast.success(response.message || 'Action completed successfully')
                onActionComplete()
            } else {
                toast.error(response.message || 'Action failed')
            }
        } catch (error: any) {
            console.error('Action error:', error)
            toast.error(error.response?.data?.message || error.message || 'Action failed')
        } finally {
            setIsLoading(false)
            setDialogOpen(false)
            setActiveAction(null)
        }
    }

    const handleConfirmAction = () => {
        if (!activeAction) return

        if (activeAction.requiresInput && !inputValue.trim()) {
            toast.error(activeAction.inputLabel + ' is required')
            return
        }

        executeAction(activeAction.action, inputValue)
    }

    if (actions.length === 0) {
        return (
            <div className="text-sm text-gray-500 dark:text-gray-400">
                No actions available for this status
            </div>
        )
    }

    return (
        <>
            <div className="flex flex-wrap gap-2">
                {actions.map((action) => (
                    <Button
                        key={action.action}
                        variant={action.variant}
                        size="sm"
                        disabled={isLoading}
                        onClick={() => handleActionClick(action)}
                        className="gap-2"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            actionIcons[action.icon] || <Play className="h-4 w-4" />
                        )}
                        {action.label}
                    </Button>
                ))}
            </div>

            {/* Action Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {activeAction?.label}
                        </DialogTitle>
                        {activeAction?.confirmMessage && (
                            <DialogDescription>
                                {activeAction.confirmMessage}
                            </DialogDescription>
                        )}
                    </DialogHeader>

                    {activeAction?.requiresInput && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>{activeAction.inputLabel}</Label>
                                <Textarea
                                    placeholder={activeAction.inputPlaceholder}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    rows={4}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant={activeAction?.variant === 'destructive' ? 'destructive' : 'default'}
                            onClick={handleConfirmAction}
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* NEW: Enhanced Request Documents Dialog */}
            <RequestDocumentsDialog
                serviceId={serviceId}
                serviceName={serviceName}
                clientName={clientName}
                open={requestDocsDialogOpen}
                onOpenChange={setRequestDocsDialogOpen}
                onSuccess={onActionComplete}
            />
        </>
    )
}
