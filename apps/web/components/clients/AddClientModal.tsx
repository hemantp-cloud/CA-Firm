"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
import { Textarea } from "@/components/ui/textarea"
import api from "@/lib/api"

interface AddClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const CLIENT_TYPES = [
  "INDIVIDUAL",
  "PROPRIETORSHIP",
  "PARTNERSHIP",
  "LLP",
  "PVT_LTD",
  "PUBLIC",
  "TRUST",
  "SOCIETY",
]

const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH"]

export default function AddClientModal({
  isOpen,
  onClose,
  onSuccess,
}: AddClientModalProps) {
  // Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [clientType, setClientType] = useState("")
  const [pan, setPan] = useState("")
  const [gstin, setGstin] = useState("")
  const [address, setAddress] = useState("")
  const [riskLevel, setRiskLevel] = useState("MEDIUM")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // POST to /clients with form data
      const response = await api.post("/clients", {
        name,
        email,
        phone: phone || undefined,
        clientType,
        pan: pan || undefined,
        gstin: gstin || undefined,
        address: address || undefined,
        riskLevel: riskLevel || "MEDIUM",
      })

      if (response.data.success) {
        // On success, call onSuccess() and onClose()
        onSuccess()
        onClose()
        // Reset form
        resetForm()
      } else {
        setError(response.data.message || "Failed to create client")
      }
    } catch (err: any) {
      // Show error if fails
      setError(
        err.response?.data?.message || err.message || "Failed to create client"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setName("")
    setEmail("")
    setPhone("")
    setClientType("")
    setPan("")
    setGstin("")
    setAddress("")
    setRiskLevel("MEDIUM")
    setError("")
  }

  const handleClose = () => {
    if (!isLoading) {
      resetForm()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name (required) */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Enter client name"
            />
          </div>

          {/* Email (required) */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Enter email address"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
              placeholder="Enter phone number"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Type (select dropdown) */}
            <div className="space-y-2">
              <Label htmlFor="clientType">
                Client Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={clientType}
                onValueChange={setClientType}
                required
                disabled={isLoading}
              >
                <SelectTrigger id="clientType" className="w-full">
                  <SelectValue placeholder="Select client type" />
                </SelectTrigger>
                <SelectContent>
                  {CLIENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type
                        .split("_")
                        .map(
                          (word) =>
                            word.charAt(0) + word.slice(1).toLowerCase()
                        )
                        .join(" ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Risk Level (select dropdown) */}
            <div className="space-y-2">
              <Label htmlFor="riskLevel">Risk Level</Label>
              <Select
                value={riskLevel}
                onValueChange={setRiskLevel}
                disabled={isLoading}
              >
                <SelectTrigger id="riskLevel" className="w-full">
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
                <SelectContent>
                  {RISK_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level.charAt(0) + level.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PAN */}
            <div className="space-y-2">
              <Label htmlFor="pan">PAN</Label>
              <Input
                id="pan"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                disabled={isLoading}
                placeholder="Enter PAN number"
                maxLength={10}
              />
            </div>

            {/* GSTIN */}
            <div className="space-y-2">
              <Label htmlFor="gstin">GSTIN</Label>
              <Input
                id="gstin"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                disabled={isLoading}
                placeholder="Enter GSTIN"
                maxLength={15}
              />
            </div>
          </div>

          {/* Address (textarea) */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={isLoading}
              placeholder="Enter address"
              rows={3}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Adding..." : "Add Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

