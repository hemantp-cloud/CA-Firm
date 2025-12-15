"use client"

import { formatDistanceToNow, format } from "date-fns"
import {
    Clock,
    UserCheck,
    Play,
    Pause,
    FileQuestion,
    Send,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Edit,
    Share2,
    RotateCcw,
    Receipt
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ServiceStatusHistory, STATUS_CONFIG, ServiceStatus } from "@/types/service-workflow"

interface StatusHistoryListProps {
    history: ServiceStatusHistory[]
    showDetailed?: boolean
}

// Action icons
const actionIcons: Record<string, React.ReactNode> = {
    CREATE: <Clock className="h-4 w-4" />,
    CREATE_FROM_REQUEST: <Clock className="h-4 w-4" />,
    ASSIGN: <UserCheck className="h-4 w-4" />,
    DELEGATE: <Share2 className="h-4 w-4" />,
    START_WORK: <Play className="h-4 w-4" />,
    REQUEST_DOCUMENTS: <FileQuestion className="h-4 w-4" />,
    PUT_ON_HOLD: <Pause className="h-4 w-4" />,
    RESUME_WORK: <Play className="h-4 w-4" />,
    START_FIXING: <Edit className="h-4 w-4" />,
    SUBMIT_FOR_REVIEW: <Send className="h-4 w-4" />,
    APPROVE: <CheckCircle className="h-4 w-4" />,
    REQUEST_CHANGES: <AlertTriangle className="h-4 w-4" />,
    MARK_COMPLETE: <CheckCircle className="h-4 w-4" />,
    DELIVER: <Send className="h-4 w-4" />,
    GENERATE_INVOICE: <Receipt className="h-4 w-4" />,
    CLOSE: <CheckCircle className="h-4 w-4" />,
    CANCEL: <XCircle className="h-4 w-4" />,
    REOPEN: <RotateCcw className="h-4 w-4" />,
}

// Friendly action labels
const actionLabels: Record<string, string> = {
    CREATE: 'Service created',
    CREATE_FROM_REQUEST: 'Created from client request',
    ASSIGN: 'Assigned to team member',
    DELEGATE: 'Delegated to another team member',
    START_WORK: 'Work started',
    REQUEST_DOCUMENTS: 'Documents requested from client',
    PUT_ON_HOLD: 'Put on hold',
    RESUME_WORK: 'Work resumed',
    START_FIXING: 'Started fixing requested changes',
    SUBMIT_FOR_REVIEW: 'Submitted for review',
    APPROVE: 'Work approved',
    REQUEST_CHANGES: 'Changes requested',
    MARK_COMPLETE: 'Marked as complete',
    DELIVER: 'Delivered to client',
    GENERATE_INVOICE: 'Invoice generated',
    CLOSE: 'Service closed',
    CANCEL: 'Service cancelled',
    REOPEN: 'Service reopened',
}

export default function StatusHistoryList({ history, showDetailed = true }: StatusHistoryListProps) {
    if (!history || history.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No status history available</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {history.map((item, index) => {
                const isFirst = index === 0
                const statusConfig = STATUS_CONFIG[item.toStatus as ServiceStatus]

                return (
                    <div key={item.id} className="relative">
                        {/* Timeline connector */}
                        {!isFirst && (
                            <div className="absolute left-5 -top-4 w-0.5 h-4 bg-gray-200 dark:bg-gray-700" />
                        )}

                        <div className={cn(
                            "flex gap-4 p-4 rounded-lg transition-colors",
                            isFirst
                                ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                                : "bg-gray-50 dark:bg-gray-800/50"
                        )}>
                            {/* Icon */}
                            <div className={cn(
                                "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center",
                                statusConfig?.bgColor || "bg-gray-100 dark:bg-gray-700"
                            )}>
                                <span className={statusConfig?.color || "text-gray-600"}>
                                    {actionIcons[item.action] || <Clock className="h-4 w-4" />}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {actionLabels[item.action] || item.action}
                                        </p>
                                        {showDetailed && item.fromStatus && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {STATUS_CONFIG[item.fromStatus as ServiceStatus]?.label || item.fromStatus}
                                                {' → '}
                                                {STATUS_CONFIG[item.toStatus as ServiceStatus]?.label || item.toStatus}
                                            </p>
                                        )}
                                    </div>

                                    {/* Timestamp */}
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatDistanceToNow(new Date(item.changedAt), { addSuffix: true })}
                                        </p>
                                        {showDetailed && (
                                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                                {format(new Date(item.changedAt), 'MMM d, yyyy h:mm a')}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* User info */}
                                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                        <span className="text-xs font-medium">
                                            {item.changedByName?.charAt(0).toUpperCase() || '?'}
                                        </span>
                                    </div>
                                    <span>{item.changedByName || 'Unknown'}</span>
                                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                                        {item.changedByType?.replace('_', ' ')}
                                    </span>
                                </div>

                                {/* Reason/Notes */}
                                {(item.reason || item.notes) && (
                                    <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                                        {item.reason && (
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                <span className="font-medium">Reason:</span> {item.reason}
                                            </p>
                                        )}
                                        {item.notes && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {item.notes}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Metadata (e.g., document list) */}
                                {showDetailed && item.metadata && item.action === 'REQUEST_DOCUMENTS' && (
                                    <div className="mt-2">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                            Documents Requested:
                                        </p>
                                        <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                                            {(item.metadata as any).documentList?.map((doc: string, i: number) => (
                                                <li key={i}>{doc}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// Compact version for sidebar or quick view
export function StatusHistoryCompact({ history }: { history: ServiceStatusHistory[] }) {
    const recentHistory = history.slice(0, 5)

    return (
        <div className="space-y-2">
            {recentHistory.map((item) => (
                <div
                    key={item.id}
                    className="flex items-center gap-2 text-sm"
                >
                    <span className={STATUS_CONFIG[item.toStatus as ServiceStatus]?.color || 'text-gray-600'}>
                        {actionIcons[item.action] || <Clock className="h-3 w-3" />}
                    </span>
                    <span className="flex-1 truncate text-gray-700 dark:text-gray-300">
                        {actionLabels[item.action] || item.action}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                        {formatDistanceToNow(new Date(item.changedAt), { addSuffix: true })}
                    </span>
                </div>
            ))}

            {history.length > 5 && (
                <p className="text-xs text-gray-400 text-center">
                    +{history.length - 5} more entries
                </p>
            )}
        </div>
    )
}
