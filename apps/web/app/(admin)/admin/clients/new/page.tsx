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
import Link from "next/link"
import api from "@/lib/api"

const clientSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  contactPerson: z.string().min(1, "Contact person name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
})

type ClientFormData = z.infer<typeof clientSchema>

export default function NewClientPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  })

  const onSubmit = async (data: ClientFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await api.post("/admin/clients", data)

      if (response.data.success) {
        router.push(`/admin/clients/${response.data.data.id}`)
      } else {
        setError(response.data.message || "Failed to create client")
      }
    } catch (err: any) {
      console.error("Create client error:", err)

      const responseData = err.response?.data
      if (responseData?.code === 'INACTIVE_CLIENT_EXISTS' && responseData.existingClientId) {
        if (confirm("A client with this email exists but is inactive. Would you like to reactivate them?")) {
          try {
            await api.post(`/admin/clients/${responseData.existingClientId}/reactivate`)
            alert("Client reactivated successfully")
            router.push(`/admin/clients/${responseData.existingClientId}`)
            return
          } catch (reactivateErr) {
            console.error("Reactivate error:", reactivateErr)
            setError("Failed to reactivate client")
          }
        }
      }

      setError(
        responseData?.message ||
        err.message ||
        "Failed to create client. Please try again."
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
          <Link href="/admin/clients">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Client</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create a new client partner. A CA user account will be created automatically.
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Client Information</h2>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Name */}
              <div>
                <Label htmlFor="name">
                  Company Name <span className="text-red-500">*</span>
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

              {/* Contact Person */}
              <div>
                <Label htmlFor="contactPerson">
                  Contact Person Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contactPerson"
                  {...register("contactPerson")}
                  className={errors.contactPerson ? "border-red-500" : ""}
                />
                {errors.contactPerson && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.contactPerson.message}
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
                <Input id="phone" {...register("phone")} />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...register("address")} />
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
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Client"
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/clients">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

