"use client"

import { useState, useEffect } from "react"
import { Eye, CreditCard, Calendar, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import api from "@/lib/api"

interface Invoice {
  id: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  totalAmount: number
  status: string
}

export default function ClientInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      setIsLoading(true)
      const response = await api.get("/client/invoices")
      if (response.data.success) {
        setInvoices(response.data.data)
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
      SENT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      PAID: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    }
    return colors[status] || colors.DRAFT
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID": return <CheckCircle2 className="h-4 w-4" />
      case "OVERDUE": return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  // Calculate stats
  const stats = {
    total: invoices.length,
    pending: invoices.filter(i => i.status === "SENT").length,
    paid: invoices.filter(i => i.status === "PAID").length,
    overdue: invoices.filter(i => i.status === "OVERDUE").length,
    totalAmount: invoices.filter(i => i.status !== "PAID").reduce((sum, i) => sum + i.totalAmount, 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Invoices</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View and pay your invoices
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                <p className="text-xs text-gray-500">Total Invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.paid}</p>
                <p className="text-xs text-gray-500">Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.overdue}</p>
                <p className="text-xs text-gray-500">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Amount Banner */}
      {stats.totalAmount > 0 && (
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-100">Outstanding Amount</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</p>
            </div>
            <CreditCard className="h-10 w-10 text-white/30" />
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-t-lg">
          <h2 className="text-xl font-semibold">All Invoices ({invoices.length})</h2>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400">No invoices found</p>
              <p className="text-sm text-gray-400 mt-1">Invoices will appear here once generated</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-slate-800">
                    <TableHead className="font-semibold">Invoice Number</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Due Date</TableHead>
                    <TableHead className="font-semibold text-right">Amount</TableHead>
                    <TableHead className="font-semibold text-center">Status</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        {formatDate(invoice.invoiceDate)}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        {formatDate(invoice.dueDate)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(invoice.totalAmount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${getStatusColor(invoice.status)} inline-flex items-center gap-1`}>
                          {getStatusIcon(invoice.status)}
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/client/invoices/${invoice.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
                            <Button
                              size="sm"
                              className="bg-violet-600 hover:bg-violet-700"
                              asChild
                            >
                              <Link href={`/client/invoices/${invoice.id}/pay`}>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Pay
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
