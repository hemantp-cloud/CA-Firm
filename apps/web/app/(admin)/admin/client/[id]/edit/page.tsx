"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Save, User, Mail, Phone, CreditCard, Building2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import api from "@/lib/api"

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        companyName: "",
        pan: "",
        gstin: "",
        aadhar: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
    })

    useEffect(() => {
        fetchClient()
    }, [id])

    const fetchClient = async () => {
        try {
            setIsLoading(true)
            const response = await api.get(`/admin/clients/${id}`)

            if (response.data.success) {
                const client = response.data.data
                setFormData({
                    name: client.name || "",
                    email: client.email || "",
                    phone: client.phone || "",
                    companyName: client.companyName || "",
                    pan: client.pan || "",
                    gstin: client.gstin || "",
                    aadhar: client.aadhar || "",
                    address: client.address || "",
                    city: client.city || "",
                    state: client.state || "",
                    pincode: client.pincode || "",
                })
            } else {
                setError("Failed to fetch client")
            }
        } catch (err) {
            console.error("Failed to fetch client:", err)
            setError("Failed to load client details")
        } finally {
            setIsLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setError(null)
        setSuccess(null)

        if (!formData.name.trim()) {
            setError("Name is required")
            setIsSaving(false)
            return
        }

        try {
            const response = await api.put(`/admin/clients/${id}`, {
                name: formData.name,
                phone: formData.phone || null,
                companyName: formData.companyName || null,
                pan: formData.pan || null,
                gstin: formData.gstin || null,
                aadhar: formData.aadhar || null,
                address: formData.address || null,
                city: formData.city || null,
                state: formData.state || null,
                pincode: formData.pincode || null,
            })

            if (response.data.success) {
                setSuccess("Client updated successfully!")
                setTimeout(() => {
                    router.push("/admin/client")
                }, 1500)
            } else {
                setError("Failed to update client")
            }
        } catch (err: any) {
            console.error("Update error:", err)
            setError(err.message || "Failed to update client")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/client">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Client</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Update client details
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <Card>
                <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
                    <CardTitle>Client Details</CardTitle>
                    <CardDescription className="text-green-100">
                        Edit the information below
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    {error && (
                        <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                            <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Contact Information */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Contact Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-gray-500" />
                                        Full Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="h-11"
                                    />
                                </div>

                                {/* Email (Read-only) */}
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-gray-500" />
                                        Email Address
                                    </Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        disabled
                                        className="h-11 bg-gray-50 dark:bg-gray-800"
                                    />
                                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                                </div>

                                {/* Phone */}
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-gray-500" />
                                        Phone Number
                                    </Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+91 98765 43210"
                                        className="h-11"
                                    />
                                </div>

                                {/* Company Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="companyName" className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-gray-500" />
                                        Company Name
                                    </Label>
                                    <Input
                                        id="companyName"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        className="h-11"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Business Information */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Business Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* PAN */}
                                <div className="space-y-2">
                                    <Label htmlFor="pan" className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-gray-500" />
                                        PAN Number
                                    </Label>
                                    <Input
                                        id="pan"
                                        name="pan"
                                        value={formData.pan}
                                        onChange={handleChange}
                                        placeholder="ABCDE1234F"
                                        className="h-11 uppercase"
                                    />
                                    <p className="text-xs text-gray-500">Only edit if correcting data entry errors</p>
                                </div>

                                {/* GSTIN */}
                                <div className="space-y-2">
                                    <Label htmlFor="gstin" className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-gray-500" />
                                        GSTIN
                                    </Label>
                                    <Input
                                        id="gstin"
                                        name="gstin"
                                        value={formData.gstin}
                                        onChange={handleChange}
                                        placeholder="22AAAAA0000A1Z5"
                                        className="h-11 uppercase"
                                    />
                                </div>

                                {/* Aadhar */}
                                <div className="space-y-2">
                                    <Label htmlFor="aadhar" className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-gray-500" />
                                        Aadhar Number
                                    </Label>
                                    <Input
                                        id="aadhar"
                                        name="aadhar"
                                        value={formData.aadhar}
                                        onChange={handleChange}
                                        placeholder="1234 5678 9012"
                                        className="h-11"
                                    />
                                    <p className="text-xs text-gray-500">Only edit if correcting data entry errors</p>
                                </div>
                            </div>
                        </div>

                        {/* Address Information */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Address</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Address */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="address" className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-gray-500" />
                                        Street Address
                                    </Label>
                                    <Input
                                        id="address"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="h-11"
                                    />
                                </div>

                                {/* City */}
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="h-11"
                                    />
                                </div>

                                {/* State */}
                                <div className="space-y-2">
                                    <Label htmlFor="state">State</Label>
                                    <Input
                                        id="state"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleChange}
                                        className="h-11"
                                    />
                                </div>

                                {/* Pincode */}
                                <div className="space-y-2">
                                    <Label htmlFor="pincode">Pincode</Label>
                                    <Input
                                        id="pincode"
                                        name="pincode"
                                        value={formData.pincode}
                                        onChange={handleChange}
                                        placeholder="400001"
                                        className="h-11"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                            <Button type="submit" disabled={isSaving} className="bg-green-600 hover:bg-green-700">
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
                                <Link href="/admin/client">Cancel</Link>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200 dark:border-red-800">
                <CardHeader className="bg-red-50 dark:bg-red-900/20">
                    <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                    <CardDescription>Irreversible actions</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    {/* Deactivate */}
                    <div className="flex items-center justify-between p-4 border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Deactivate Client</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                User won't be able to log in (can be reactivated)
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="bg-yellow-600 text-white hover:bg-yellow-700"
                            onClick={async () => {
                                if (!confirm("Are you sure you want to deactivate this Client? They won't be able to log in.")) return

                                try {
                                    const response = await api.delete(`/admin/clients/${id}`)

                                    if (response.data.success) {
                                        alert("Client deactivated successfully!")
                                        router.push("/admin/client")
                                    } else {
                                        alert("Failed to deactivate")
                                    }
                                } catch (err) {
                                    console.error("Deactivate error:", err)
                                    alert("Failed to deactivate Client")
                                }
                            }}
                        >
                            Deactivate
                        </Button>
                    </div>

                    {/* Delete Forever */}
                    <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Permanently Delete Client</p>
                            <p className="text-sm text-red-600 dark:text-red-400">
                                ⚠️ This action CANNOT be undone! User will be removed from database.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={async () => {
                                if (!confirm("⚠️ WARNING: This will PERMANENTLY DELETE this Client from the database. This action CANNOT be undone! Are you absolutely sure?")) return
                                if (!confirm("Final confirmation: Delete this Client permanently?")) return

                                try {
                                    const response = await api.delete(`/admin/clients/${id}/permanent`)

                                    if (response.data.success) {
                                        alert("Client permanently deleted!")
                                        router.push("/admin/client")
                                    } else {
                                        alert("Failed to delete")
                                    }
                                } catch (err) {
                                    console.error("Delete error:", err)
                                    alert("Failed to delete Client")
                                }
                            }}
                        >
                            Delete Forever
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
