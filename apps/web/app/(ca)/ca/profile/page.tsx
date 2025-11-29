"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import api from "@/lib/api"

const profileSchema = z.object({
    name: z.string().min(1, "Name is required"),
    phone: z.string().optional(),
    gstin: z.string().optional(),
    pan: z.string().optional(),
    contactPerson: z.string().optional(),
    address: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function CaProfilePage() {
    const { data: session } = useSession()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
    })

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            setIsLoading(true)
            const response = await api.get("/ca/profile")
            if (response.data.success) {
                const profile = response.data.data
                setValue("name", profile.name)
                setValue("phone", profile.phone || "")
                setValue("gstin", profile.gstin || "")
                setValue("pan", profile.pan || "")
                setValue("contactPerson", profile.contactPerson || "")
                setValue("address", profile.address || "")
            }
        } catch (error) {
            console.error("Failed to fetch profile:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const onSubmit = async (data: ProfileFormData) => {
        setIsSaving(true)
        setError(null)
        setSuccess(false)

        try {
            const response = await api.put("/ca/profile", data)

            if (response.data.success) {
                setSuccess(true)
                setTimeout(() => setSuccess(false), 3000)
            } else {
                setError(response.data.message || "Failed to update profile")
            }
        } catch (err: any) {
            console.error("Update profile error:", err)
            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to update profile. Please try again."
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
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Update your firm information
                </p>
            </div>

            {/* Profile Form */}
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Firm Information
                    </h2>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                            <p className="text-sm text-green-800 dark:text-green-200">
                                Profile updated successfully!
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name */}
                            <div>
                                <Label htmlFor="name">
                                    Firm Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    {...register("name")}
                                    className={errors.name ? "border-red-500" : ""}
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {errors.name.message}
                                    </p>
                                )}
                            </div>

                            {/* Email (read-only) */}
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={session?.user?.email || ""}
                                    disabled
                                    className="bg-gray-50 dark:bg-gray-800"
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Email cannot be changed
                                </p>
                            </div>

                            {/* Phone */}
                            <div>
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" {...register("phone")} />
                            </div>

                            {/* Contact Person */}
                            <div>
                                <Label htmlFor="contactPerson">Contact Person</Label>
                                <Input id="contactPerson" {...register("contactPerson")} />
                            </div>

                            {/* GSTIN */}
                            <div>
                                <Label htmlFor="gstin">GSTIN</Label>
                                <Input id="gstin" {...register("gstin")} />
                            </div>

                            {/* PAN */}
                            <div>
                                <Label htmlFor="pan">PAN</Label>
                                <Input id="pan" {...register("pan")} />
                            </div>

                            {/* Address */}
                            <div className="md:col-span-2">
                                <Label htmlFor="address">Address</Label>
                                <Input id="address" {...register("address")} />
                            </div>
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
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
