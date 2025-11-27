"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CreditCard, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import api from "@/lib/api"

interface Invoice {
  id: string
  invoiceNumber: string
  totalAmount: number
  remainingAmount: number
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice()
    }
  }, [invoiceId])

  const fetchInvoice = async () => {
    try {
      const response = await api.get(`/user/invoices/${invoiceId}`)
      if (response.data.success) {
        const invoiceData = response.data.data
        const totalPaid = invoiceData.payments
          ?.filter((p: any) => p.paymentStatus === "COMPLETED")
          .reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0
        setInvoice({
          id: invoiceData.id,
          invoiceNumber: invoiceData.invoiceNumber,
          totalAmount: invoiceData.totalAmount,
          remainingAmount: invoiceData.totalAmount - totalPaid,
        })
        setAmount((invoiceData.totalAmount - totalPaid).toString())
      }
    } catch (error) {
      console.error("Failed to fetch invoice:", error)
    }
  }

  const handlePayment = async () => {
    if (!paymentMethod || !amount) {
      alert("Please fill all fields")
      return
    }

    try {
      setIsLoading(true)
      const response = await api.post("/user/payments", {
        invoiceId,
        amount: parseFloat(amount),
        paymentMethod,
      })

      if (response.data.success) {
        setIsSuccess(true)
        setTimeout(() => {
          router.push(`/user/invoices/${invoiceId}`)
        }, 2000)
      }
    } catch (error: any) {
      console.error("Payment error:", error)
      alert(error.response?.data?.message || "Failed to process payment")
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Payment Successful!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Your payment has been processed successfully
        </p>
        <Button asChild>
          <Link href={`/user/invoices/${invoiceId}`}>View Invoice</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/user/invoices/${invoiceId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Make Payment</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Pay for invoice {invoice.invoiceNumber}</p>
        </div>
      </div>

      {/* Invoice Summary */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Invoice Summary</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Invoice Number</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {invoice.invoiceNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Amount</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(invoice.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                Amount to Pay
              </span>
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(invoice.remainingAmount)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Payment Details</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="paymentMethod">
              Payment Method <span className="text-red-500">*</span>
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="NEFT">NEFT</SelectItem>
                <SelectItem value="RTGS">RTGS</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="CHEQUE">Cheque</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">
              Amount <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              max={invoice.remainingAmount}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Maximum: {formatCurrency(invoice.remainingAmount)}
            </p>
          </div>

          <div className="pt-4">
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={handlePayment}
              disabled={isLoading || !paymentMethod || !amount}
            >
              {isLoading ? (
                "Processing..."
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Process Payment
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Note: This is a placeholder payment form. In production, integrate with a payment gateway.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

