"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

export default function AdminReportsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    View system reports and analytics
                </p>
            </div>

            <Card>
                <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                    <BarChart3 className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Reports Coming Soon
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md">
                        We are working on detailed reports and analytics to help you manage your firm better. Check back later!
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
