"use client"

import {
    Clock,
    UserCheck,
    Loader2,
    UserMinus,
    Pause,
    Search,
    AlertTriangle,
    CheckCircle,
    Send,
    Receipt,
    CheckCircle2,
    XCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ServiceStatus, STATUS_CONFIG } from "@/types/service-workflow"

interface StatusTimelineProps {
    currentStatus: ServiceStatus
    compact?: boolean
    showLabels?: boolean
}

// Icon mapping for each status
const statusIcons: Record<ServiceStatus, React.ReactNode> = {
    PENDING: <Clock className="h-4 w-4" />,
    ASSIGNED: <UserCheck className="h-4 w-4" />,
    IN_PROGRESS: <Loader2 className="h-4 w-4" />,
    WAITING_FOR_CLIENT: <UserMinus className="h-4 w-4" />,
    ON_HOLD: <Pause className="h-4 w-4" />,
    UNDER_REVIEW: <Search className="h-4 w-4" />,
    CHANGES_REQUESTED: <AlertTriangle className="h-4 w-4" />,
    COMPLETED: <CheckCircle className="h-4 w-4" />,
    DELIVERED: <Send className="h-4 w-4" />,
    INVOICED: <Receipt className="h-4 w-4" />,
    CLOSED: <CheckCircle2 className="h-4 w-4" />,
    CANCELLED: <XCircle className="h-4 w-4" />,
}

// Main workflow path (ideal progression)
const mainWorkflowPath: ServiceStatus[] = [
    'PENDING',
    'ASSIGNED',
    'IN_PROGRESS',
    'UNDER_REVIEW',
    'COMPLETED',
    'DELIVERED',
    'INVOICED',
    'CLOSED',
]

// Status order for determining progress
const statusOrder: Record<ServiceStatus, number> = {
    PENDING: 0,
    ASSIGNED: 1,
    IN_PROGRESS: 2,
    WAITING_FOR_CLIENT: 2.5,
    ON_HOLD: 2.5,
    UNDER_REVIEW: 3,
    CHANGES_REQUESTED: 3.5,
    COMPLETED: 4,
    DELIVERED: 5,
    INVOICED: 6,
    CLOSED: 7,
    CANCELLED: -1,
}

export default function StatusTimeline({
    currentStatus,
    compact = false,
    showLabels = true
}: StatusTimelineProps) {
    const currentOrder = statusOrder[currentStatus]
    const isCancelled = currentStatus === 'CANCELLED'

    // For compact view, show only main workflow statuses
    const displayStatuses = compact ? mainWorkflowPath : mainWorkflowPath

    const getStatusState = (status: ServiceStatus): 'completed' | 'current' | 'upcoming' | 'cancelled' => {
        if (isCancelled) return 'cancelled'

        const order = statusOrder[status]
        if (order < currentOrder) return 'completed'
        if (status === currentStatus) return 'current'
        return 'upcoming'
    }

    return (
        <div className="w-full">
            {/* Cancelled Banner */}
            {isCancelled && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <XCircle className="h-5 w-5" />
                        <span className="font-medium">This service has been cancelled</span>
                    </div>
                </div>
            )}

            {/* Timeline */}
            <div className={cn(
                "flex items-center justify-between",
                compact ? "gap-1" : "gap-2"
            )}>
                {displayStatuses.map((status, index) => {
                    const config = STATUS_CONFIG[status]
                    const state = getStatusState(status)
                    const isLast = index === displayStatuses.length - 1

                    return (
                        <div key={status} className="flex items-center flex-1 last:flex-none">
                            {/* Status Circle */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={cn(
                                        "rounded-full flex items-center justify-center transition-all",
                                        compact ? "h-8 w-8" : "h-10 w-10",
                                        state === 'completed' && "bg-green-500 text-white",
                                        state === 'current' && "bg-blue-500 text-white ring-4 ring-blue-200 dark:ring-blue-900",
                                        state === 'upcoming' && "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500",
                                        state === 'cancelled' && "bg-gray-300 dark:bg-gray-600 text-gray-400"
                                    )}
                                >
                                    {state === 'completed' ? (
                                        <CheckCircle className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
                                    ) : (
                                        statusIcons[status]
                                    )}
                                </div>

                                {/* Label */}
                                {showLabels && !compact && (
                                    <span
                                        className={cn(
                                            "text-xs mt-2 text-center max-w-[80px]",
                                            state === 'completed' && "text-green-600 dark:text-green-400 font-medium",
                                            state === 'current' && "text-blue-600 dark:text-blue-400 font-medium",
                                            state === 'upcoming' && "text-gray-400 dark:text-gray-500",
                                            state === 'cancelled' && "text-gray-400"
                                        )}
                                    >
                                        {config.label}
                                    </span>
                                )}
                            </div>

                            {/* Connector Line */}
                            {!isLast && (
                                <div
                                    className={cn(
                                        "flex-1 h-1 mx-1",
                                        state === 'completed' && "bg-green-500",
                                        state === 'current' && "bg-gradient-to-r from-green-500 to-gray-300 dark:to-gray-600",
                                        state === 'upcoming' && "bg-gray-200 dark:bg-gray-700",
                                        state === 'cancelled' && "bg-gray-300 dark:bg-gray-600"
                                    )}
                                />
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Current Status Badge - Full display */}
            {!compact && (
                <div className="mt-6 flex items-center justify-center">
                    <div className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-full",
                        STATUS_CONFIG[currentStatus].bgColor
                    )}>
                        {statusIcons[currentStatus]}
                        <span className={cn("font-medium", STATUS_CONFIG[currentStatus].color)}>
                            {STATUS_CONFIG[currentStatus].label}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                            • {STATUS_CONFIG[currentStatus].description}
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}

// Compact progress bar version for lists
export function StatusProgressBar({ status }: { status: ServiceStatus }) {
    const order = statusOrder[status]
    const maxOrder = 7 // CLOSED
    const progress = status === 'CANCELLED' ? 0 : Math.round((order / maxOrder) * 100)
    const config = STATUS_CONFIG[status]

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-1">
                <span className={cn("text-xs font-medium", config.color)}>
                    {config.label}
                </span>
                <span className="text-xs text-gray-500">{progress}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={cn(
                        "h-full transition-all duration-300",
                        status === 'CANCELLED' ? "bg-red-500" : "bg-gradient-to-r from-blue-500 to-green-500"
                    )}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    )
}

// Simple status badge
export function StatusBadge({ status, className }: { status: ServiceStatus; className?: string }) {
    const config = STATUS_CONFIG[status]

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
            config.bgColor,
            config.color,
            className
        )}>
            {statusIcons[status]}
            {config.label}
        </span>
    )
}
