"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, Loader2, Save } from "lucide-react"
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
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import Link from "next/link"
import api from "@/lib/api"

const serviceSchema = z.object({
    title: z.string().min(1, "Service name is required"),
    description: z.string().optional(),
    type: z.enum([
        "ITR_FILING",
        "GST_REGISTRATION",
        "GST_RETURN",
        "TDS_RETURN",
        "TDS_COMPLIANCE",
        "ROC_FILING",
        "AUDIT",
        "BOOK_KEEPING",
        "PAYROLL",
        "CONSULTATION",
        "OTHER",
    ]),
    financialYear: z.string().optional(),
    period: z.string().optional(),
    dueDate: z.string().min(1, "Due date is required"),
    feeAmount: z.string().optional(),
    notes: z.string().optional(),
})

type ServiceFormData = z.infer<typeof serviceSchema>

export default function EditServicePage() {
    const router = useRouter()
    const params = useParams()
    const serviceId = params.id as string
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ServiceFormData>({
        resolver: zodResolver(serviceSchema),
    })

    useEffect(() => {
        if (serviceId) {
            fetchService()
        }
    }, [serviceId])

    const fetchService = async () => {
        try {
            setIsLoading(true)
            const response = await api.get(`/admin/services/${serviceId}`)
            if (response.data.success) {
                const service = response.data.data
                setValue("title", service.title)
                setValue("description", service.description || "")
                setValue("type", service.type)
                setValue("financialYear", service.financialYear || "")
                setValue("period", service.period || "")
                setValue(
                    "dueDate",
                    service.dueDate ? new Date(service.dueDate).toISOString().split("T")[0] : ""
                )
                setValue("feeAmount", service.feeAmount ? service.feeAmount.toString() : "")
                setValue("notes", service.notes || "")
            }
        } catch (error) {
            console.error("Failed to fetch service:", error)
            setError("Failed to load service details")
        } finally {
            setIsLoading(false)
        }
    }

    const onSubmit = async (data: ServiceFormData) => {
        setIsSaving(true)
        setError(null)

        try {
            const payload = {
                ...data,
                feeAmount: data.feeAmount ? parseFloat(data.feeAmount) : null,
                dueDate: new Date(data.dueDate).toISOString(),
            }

            const response = await api.put(`/services/${serviceId}`, payload)

            if (response.data.success) {
                router.push(`/admin/services/${serviceId}`)
                router.refresh()
            } else {
                setError(response.data.message || "Failed to update service")
            }
        } catch (err: any) {
            console.error("Update service error:", err)
            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to update service. Please try again."
            )
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/services/${serviceId}`}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Service</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Update service details
                    </p>
                </div>
            </div>

            {/* Form */}
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Service Information
                    </h2>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Service Type */}
                            <div>
                                <Label htmlFor="type">
                                    Service Type <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={watch("type") || ""}
                                    onValueChange={(value) => setValue("type", value as any)}
                                >
                                    <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                                        <SelectValue placeholder="Select service type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ITR_FILING">ITR Filing</SelectItem>
                                        <SelectItem value="GST_REGISTRATION">GST Registration</SelectItem>
                                        <SelectItem value="GST_RETURN">GST Return</SelectItem>
                                        <SelectItem value="TDS_RETURN">TDS Return</SelectItem>
                                        <SelectItem value="TDS_COMPLIANCE">TDS Compliance</SelectItem>
                                        <SelectItem value="ROC_FILING">ROC Filing</SelectItem>
                                        <SelectItem value="AUDIT">Audit</SelectItem>
                                        <SelectItem value="BOOK_KEEPING">Book Keeping</SelectItem>
                                        <SelectItem value="PAYROLL">Payroll</SelectItem>
                                        <SelectItem value="CONSULTATION">Consultation</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.type && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {errors.type.message}
                                    </p>
                                )}
                            </div>

                            {/* Service Name */}
                            <div>
                                <Label htmlFor="title">
                                    Service Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    {...register("title")}
                                    className={errors.title ? "border-red-500" : ""}
                                />
                                {errors.title && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {errors.title.message}
                                    </p>
                                )}
                            </div>

                            {/* Financial Year */}
                            <div>
                                <Label htmlFor="financialYear">Financial Year</Label>
                                <Input
                                    id="financialYear"
                                    placeholder="e.g., 2024-25"
                                    {...register("financialYear")}
                                />
                            </div>

                            {/* Period */}
                            <div>
                                <Label htmlFor="period">Period</Label>
                                <Input
                                    id="period"
                                    placeholder="e.g., Q1, November"
                                    {...register("period")}
                                />
                            </div>

                            {/* Due Date */}
                            <div>
                                <Label htmlFor="dueDate">
                                    Due Date <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="dueDate"
                                    type="date"
                                    {...register("dueDate")}
                                    className={errors.dueDate ? "border-red-500" : ""}
                                />
                                {errors.dueDate && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {errors.dueDate.message}
                                    </p>
                                )}
                            </div>

                            {/* Amount */}
                            <div>
                                <Label htmlFor="feeAmount">Amount</Label>
                                <Input
                                    id="feeAmount"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    {...register("feeAmount")}
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                rows={3}
                                placeholder="Service description..."
                                {...register("description")}
                            />
                        </div>

                        {/* Internal Notes */}
                        <div>
                            <Label htmlFor="notes">Internal Notes</Label>
                            <Textarea
                                id="notes"
                                rows={3}
                                placeholder="Internal notes..."
                                {...register("notes")}
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href={`/admin/services/${serviceId}`}>Cancel</Link>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
