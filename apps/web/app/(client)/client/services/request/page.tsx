"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowLeft,
    Send,
    Loader2,
    Briefcase,
    Calendar,
    AlertCircle,
    FileText
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { toast } from "sonner"
import { createServiceRequest } from "@/lib/service-workflow-api"
import {
    ServiceType,
    RequestUrgency,
    SERVICE_TYPE_LABELS,
    URGENCY_LABELS
} from "@/types/service-workflow"

export default function RequestServicePage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        serviceType: '' as ServiceType | '',
        title: '',
        description: '',
        urgency: 'NORMAL' as RequestUrgency,
        preferredDueDate: '',
        financialYear: '',
        assessmentYear: '',
    })

    // Generate financial year options (current and previous 2 years)
    const currentYear = new Date().getFullYear()
    const financialYears = [
        `${currentYear - 1}-${String(currentYear).slice(2)}`,
        `${currentYear}-${String(currentYear + 1).slice(2)}`,
        `${currentYear + 1}-${String(currentYear + 2).slice(2)}`,
    ]

    // Assessment year is FY + 1
    const assessmentYears = financialYears.map(fy => {
        const startYear = parseInt(fy.split('-')[0])
        return `${startYear + 1}-${String(startYear + 2).slice(2)}`
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.serviceType) {
            toast.error('Please select a service type')
            return
        }

        if (!formData.title.trim()) {
            toast.error('Please enter a title for your request')
            return
        }

        setIsLoading(true)
        try {
            const response = await createServiceRequest({
                serviceType: formData.serviceType,
                title: formData.title,
                description: formData.description || undefined,
                urgency: formData.urgency,
                preferredDueDate: formData.preferredDueDate || undefined,
                financialYear: formData.financialYear || undefined,
                assessmentYear: formData.assessmentYear || undefined,
            })

            if (response.success) {
                toast.success('Service request submitted successfully!')
                router.push('/client/services/requests')
            } else {
                toast.error(response.message || 'Failed to submit request')
            }
        } catch (error: any) {
            console.error('Submit error:', error)
            toast.error(error.response?.data?.message || 'Failed to submit request')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/client/services">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Request a Service
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Submit a request for a new service. Our team will review and get back to you.
                    </p>
                </div>
            </div>

            {/* Main Form Card */}
            <Card className="border-0 shadow-lg max-w-2xl">
                <CardHeader className="bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Service Request Form
                    </CardTitle>
                    <CardDescription className="text-violet-100">
                        Fill in the details below to request a new service
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Service Type */}
                        <div className="space-y-2">
                            <Label htmlFor="serviceType" className="text-base font-medium">
                                Service Type <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.serviceType}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, serviceType: value as ServiceType }))}
                            >
                                <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Select the type of service you need" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-gray-500" />
                                                {label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-base font-medium">
                                Request Title <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                placeholder="E.g., ITR Filing for FY 2024-25"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="h-12"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-base font-medium">
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Provide any additional details about your request..."
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                rows={4}
                            />
                        </div>

                        {/* Two columns: Urgency + Preferred Due Date */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Urgency */}
                            <div className="space-y-2">
                                <Label htmlFor="urgency" className="text-base font-medium">
                                    Urgency Level
                                </Label>
                                <Select
                                    value={formData.urgency}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, urgency: value as RequestUrgency }))}
                                >
                                    <SelectTrigger className="h-12">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(URGENCY_LABELS).map(([value, config]) => (
                                            <SelectItem key={value} value={value}>
                                                <div className="flex items-center gap-2">
                                                    <AlertCircle className={`h-4 w-4 ${config.color}`} />
                                                    <span>{config.label}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Preferred Due Date */}
                            <div className="space-y-2">
                                <Label htmlFor="preferredDueDate" className="text-base font-medium">
                                    Preferred Due Date
                                </Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="preferredDueDate"
                                        type="date"
                                        value={formData.preferredDueDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, preferredDueDate: e.target.value }))}
                                        className="h-12 pl-10"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Two columns: Financial Year + Assessment Year */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Financial Year */}
                            <div className="space-y-2">
                                <Label htmlFor="financialYear" className="text-base font-medium">
                                    Financial Year
                                </Label>
                                <Select
                                    value={formData.financialYear}
                                    onValueChange={(value) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            financialYear: value,
                                            // Auto-set assessment year
                                            assessmentYear: value ? assessmentYears[financialYears.indexOf(value)] : ''
                                        }))
                                    }}
                                >
                                    <SelectTrigger className="h-12">
                                        <SelectValue placeholder="Select FY" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {financialYears.map((fy) => (
                                            <SelectItem key={fy} value={fy}>
                                                FY {fy}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Assessment Year */}
                            <div className="space-y-2">
                                <Label htmlFor="assessmentYear" className="text-base font-medium">
                                    Assessment Year
                                </Label>
                                <Select
                                    value={formData.assessmentYear}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, assessmentYear: value }))}
                                >
                                    <SelectTrigger className="h-12">
                                        <SelectValue placeholder="Select AY" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {assessmentYears.map((ay) => (
                                            <SelectItem key={ay} value={ay}>
                                                AY {ay}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex gap-3">
                                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-800 dark:text-blue-200">
                                    <p className="font-medium">What happens next?</p>
                                    <ul className="mt-1 list-disc list-inside text-blue-700 dark:text-blue-300 space-y-1">
                                        <li>Your request will be reviewed by our team</li>
                                        <li>We may contact you for additional information</li>
                                        <li>Once approved, the service will be created and assigned</li>
                                        <li>You can track progress in your Services dashboard</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => router.back()}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-violet-600 hover:bg-violet-700"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-2" />
                                        Submit Request
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
