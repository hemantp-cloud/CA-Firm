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

const userSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    role: z.enum(["CA", "CLIENT"]),
    clientId: z.string().optional(),
    pan: z.string().optional(),
    aadhar: z.string().optional(),
    address: z.string().optional(),
  })
  .refine(
    (data) => {
      // If role is CLIENT, clientId is required
      if (data.role === "CLIENT" && !data.clientId) {
        return false
      }
      return true
    },
    {
      message: "Client is required for CLIENT role",
      path: ["clientId"],
    }
  )

type UserFormData = z.infer<typeof userSchema>

interface Client {
  id: string
  name: string
}

export default function NewUserPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preSelectedClientId = searchParams.get("clientId")

  const [isLoading, setIsLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>("")

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      clientId: preSelectedClientId || undefined,
      role: preSelectedClientId ? "CLIENT" : undefined,
    },
  })

  const role = watch("role")

  useEffect(() => {
    fetchClients()
    if (preSelectedClientId) {
      setSelectedRole("CLIENT")
      setValue("role", "CLIENT")
      setValue("clientId", preSelectedClientId)
    }
  }, [preSelectedClientId, setValue])

  const fetchClients = async () => {
    try {
      const response = await api.get("/admin/clients")
      if (response.data.success) {
        setClients(response.data.data)
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error)
    }
  }

  const onSubmit = async (data: UserFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await api.post("/admin/users", data)

      if (response.data.success) {
        router.push(`/admin/users/${response.data.data.id}`)
      } else {
        setError(response.data.message || "Failed to create user")
      }
    } catch (err: any) {
      console.error("Create user error:", err)
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to create user. Please try again."
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
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New User</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create a new user account. A welcome email with temporary password will be sent.
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">User Information</h2>
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
                  Name <span className="text-red-500">*</span>
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

              {/* Role */}
              <div>
                <Label htmlFor="role">
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={role || ""}
                  onValueChange={(value) => {
                    setValue("role", value as "CA" | "CLIENT")
                    setSelectedRole(value)
                    if (value === "CA") {
                      setValue("clientId", undefined)
                    }
                  }}
                >
                  <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CA">CA</SelectItem>
                    <SelectItem value="CLIENT">CLIENT</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.role.message}
                  </p>
                )}
              </div>

              {/* Client (only if role is CLIENT) */}
              {role === "CLIENT" && (
                <div>
                  <Label htmlFor="clientId">
                    Client <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={watch("clientId") || ""}
                    onValueChange={(value) => setValue("clientId", value)}
                  >
                    <SelectTrigger className={errors.clientId ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.clientId && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.clientId.message}
                    </p>
                  )}
                </div>
              )}

              {/* PAN (for CLIENT role) */}
              {role === "CLIENT" && (
                <div>
                  <Label htmlFor="pan">PAN</Label>
                  <Input id="pan" {...register("pan")} />
                </div>
              )}

              {/* Aadhar (for CLIENT role) */}
              {role === "CLIENT" && (
                <div>
                  <Label htmlFor="aadhar">Aadhar</Label>
                  <Input id="aadhar" {...register("aadhar")} />
                </div>
              )}

              {/* Address */}
              <div className={role === "CLIENT" ? "md:col-span-2" : ""}>
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...register("address")} />
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
                  "Create User"
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/users">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

