"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import api from "@/lib/api"

const Team Memberschema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    pan: z.string().optional(),
    aadhar: z.string().optional(),
    address: z.string().optional(),
    password: z.string().optional().refine((val) => !val || val.length >= 8, {
        message: "Password must be at least 8 characters"
    }),
    twoFactorEnabled: z.boolean().optional(),
    mustChangePassword: z.boolean().optional(),
})

type Team MemberFormData = z.infer<typeof Team Memberschema>

export default function CANewTeam MemberPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
    const [mustChangePassword, setMustChangePassword] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<Team MemberFormData>({
        resolver: zodResolver(Team Memberschema),
        defaultValues: {
            twoFactorEnabled: false,
            mustChangePassword: false,
        },
    })

    const onSubmit = async (data: Team MemberFormData) => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await api.post("/Team Members", {
                ...data,
                twoFactorEnabled,
                mustChangePassword,
            })

            if (response.data.success) {
                router.push(`/ca/Team Members/${response.data.data.id}`)
            } else {
                setError(response.data.message || "Failed to create Team Member")
            }
        } catch (err: any) {
            console.error("Create Team Member error:", err)

            const responseData = err.response?.data
            setError(
                responseData?.message ||
                err.message ||
                "Failed to create Team Member. Please try again."
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
                    <Link href="/project-manager/Team Members">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Team Member</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Create a new Team Member account. A welcome email with login credentials will be sent.
                    </p>
                </div>
            </div>

            {/* Form */}
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Team Member Information</h2>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name */}
                            <div>
                                <Label htmlFor="name">
                                    Full Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    {...register("name")}
                                    className={errors.name ? "border-red-500" : ""}
                                    placeholder="John Doe"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {errors.name.message}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <Label htmlFor="email">
                                    Email <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    {...register("email")}
                                    className={errors.email ? "border-red-500" : ""}
                                    placeholder="john@example.com"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {errors.email.message}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    This will be their login email
                                </p>
                            </div>

                            {/* Phone */}
                            <div>
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    {...register("phone")}
                                    placeholder="+91-9876543210"
                                />
                            </div>

                            {/* PAN */}
                            <div>
                                <Label htmlFor="pan">PAN</Label>
                                <Input
                                    id="pan"
                                    {...register("pan")}
                                    placeholder="ABCDE1234F"
                                    maxLength={10}
                                />
                            </div>

                            {/* Aadhar */}
                            <div>
                                <Label htmlFor="aadhar">Aadhar</Label>
                                <Input
                                    id="aadhar"
                                    {...register("aadhar")}
                                    placeholder="1234-5678-9012"
                                    maxLength={12}
                                />
                            </div>

                            {/* Password (Optional) */}
                            <div>
                                <Label htmlFor="password">
                                    Password (Optional)
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    {...register("password")}
                                    className={errors.password ? "border-red-500" : ""}
                                    placeholder="Leave blank to auto-generate"
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {errors.password.message}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    If not provided, a random password will be generated
                                </p>
                            </div>

                            {/* Address */}
                            <div className="md:col-span-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    {...register("address")}
                                    placeholder="Full address"
                                />
                            </div>
                        </div>

                        {/* Additional Options */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="mustChangePassword"
                                    checked={mustChangePassword}
                                    onCheckedChange={(checked) => setMustChangePassword(checked === true)}
                                />
                                <Label
                                    htmlFor="mustChangePassword"
                                    className="text-sm font-normal cursor-pointer"
                                >
                                    Require password change on first login
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="twoFactorEnabled"
                                    checked={twoFactorEnabled}
                                    onCheckedChange={(checked) => setTwoFactorEnabled(checked === true)}
                                />
                                <Label
                                    htmlFor="twoFactorEnabled"
                                    className="text-sm font-normal cursor-pointer"
                                >
                                    Enable two-factor authentication
                                </Label>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Team Member"
                                )}
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href="/project-manager/Team Members">Cancel</Link>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
