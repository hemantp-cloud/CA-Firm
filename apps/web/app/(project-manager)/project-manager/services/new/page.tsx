"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, Loader2 } from "lucide-react"
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
    userId: z.string().uuid("Invalid user"),
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
    title: z.string().min(1, "Service name is required"),
    description: z.string().optional(),
    financialYear: z.string().optional(),
    assessmentYear: z.string().optional(),
    dueDate: z.string().min(1, "Due date is required"),
    feeAmount: z.string().optional(),
    internalNotes: z.string().optional(),
})

type ServiceFormData = z.infer<typeof serviceSchema>

interface User {
    id: string
    name: string
}

export default function NewCaServicePage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const preSelectedUserId = searchParams.get("userId")

    const [isLoading, setIsLoading] = useState(false)
    const [users, setUsers] = useState<User[]>([])
    const [error, setError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ServiceFormData>({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            userId: preSelectedUserId || undefined,
        },
    })

    const userId = watch("userId")

    useEffect(() => {
        fetchUsers()
    }, [])

    useEffect(() => {
        if (preSelectedUserId) {
            setValue("userId", preSelectedUserId)
        }
    }, [preSelectedUserId, setValue])

    const fetchUsers = async () => {
        try {
            const response = await api.get("/project-manager/clients")
            if (response.data.success) {
                setUsers(response.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch users:", error)
        }
    }

    const onSubmit = async (data: ServiceFormData) => {
        setIsLoading(true)
        setError(null)

        try {
            const payload = {
                ...data,
                feeAmount: data.feeAmount ? parseFloat(data.feeAmount) : null,
                dueDate: new Date(data.dueDate).toISOString(),
            }

            const response = await api.post("/project-manager/services", payload)

            if (response.data.success) {
                router.push(`/project-manager/services`)
            } else {
                setError(response.data.message || "Failed to create service")
            }
        } catch (err: any) {
            console.error("Create service error:", err)
            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to create service. Please try again."
            )
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/project-manager/services">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Service</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Create a new service for a customer
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
                            {/* User */}
                            <div>
                                <Label htmlFor="userId">
                                    User <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={userId || ""}
                                    onValueChange={(value) => setValue("userId", value)}
                                >
                                    <SelectTrigger className={errors.userId ? "border-red-500" : ""}>
                                        <SelectValue placeholder="Select user" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map((user) => (
                                            <SelectItem key={user.id} value={user.id}>
                                                {user.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.userId && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {errors.userId.message}
                                    </p>
                                )}
                            </div>

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

                            {/* Assessment Year */}
                            <div>
                                <Label htmlFor="assessmentYear">Assessment Year</Label>
                                <Input
                                    id="assessmentYear"
                                    placeholder="e.g., 2025-26"
                                    {...register("assessmentYear")}
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
                            <Label htmlFor="internalNotes">Internal Notes</Label>
                            <Textarea
                                id="internalNotes"
                                rows={3}
                                placeholder="Internal notes..."
                                {...register("internalNotes")}
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Service"
                                )}
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href="/project-manager/services">Cancel</Link>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
