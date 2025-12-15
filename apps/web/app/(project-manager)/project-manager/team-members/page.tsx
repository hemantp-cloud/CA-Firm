"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Eye, Edit, Trash2, MoreVertical, Users } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import api from "@/lib/api"

interface TeamMember {
    id: string
    name: string
    email: string
    phone: string | null
    isActive: boolean
    assignedClientsCount: number
    createdAt: string
    lastLoginAt: string | null
}

export default function TeamMembersPage() {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        fetchTeamMembers()
    }, [])

    const fetchTeamMembers = async () => {
        try {
            setIsLoading(true)
            const response = await api.get("/project-manager/team-members")
            if (response.data.success) {
                setTeamMembers(response.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch team members:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeactivate = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to deactivate ${name}?`)) {
            return
        }

        try {
            await api.delete(`/project-manager/team-members/${id}`)
            alert("Team member deactivated successfully")
            fetchTeamMembers()
        } catch (error) {
            console.error("Failed to deactivate team member:", error)
            alert("Failed to deactivate team member")
        }
    }

    const filteredTeamMembers = teamMembers.filter((member) => {
        if (!searchQuery.trim()) return true
        const query = searchQuery.toLowerCase()
        return (
            member.name.toLowerCase().includes(query) ||
            member.email?.toLowerCase().includes(query) ||
            member.phone?.toLowerCase().includes(query)
        )
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Members</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage team member accounts and client assignments
                    </p>
                </div>
                <Button asChild>
                    <Link href="/project-manager/team-members/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Team Member
                    </Link>
                </Button>
            </div>

            {/* Search Bar */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="search"
                            placeholder="Search team members by name, email, or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Team Members Table */}
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        All Team Members ({filteredTeamMembers.length})
                    </h2>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Assigned Clients</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        Loading team members...
                                    </TableCell>
                                </TableRow>
                            ) : filteredTeamMembers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <div className="flex flex-col items-center gap-2">
                                            <Users className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                                            <p className="text-gray-500 dark:text-gray-400">No team members found</p>
                                            <Button asChild variant="outline" size="sm">
                                                <Link href="/project-manager/team-members/new">
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Add Team Member
                                                </Link>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTeamMembers.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell className="font-medium">{member.name}</TableCell>
                                        <TableCell>{member.email}</TableCell>
                                        <TableCell>{member.phone || "-"}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="gap-1">
                                                <Users className="h-3 w-3" />
                                                {member.assignedClientsCount || 0}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={
                                                    member.isActive
                                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                                }
                                            >
                                                {member.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/project-manager/team-members/${member.id}`} className="cursor-pointer">
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View Details
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/project-manager/team-members/${member.id}/edit`} className="cursor-pointer">
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/project-manager/team-members/${member.id}/assign-clients`} className="cursor-pointer">
                                                            <Users className="h-4 w-4 mr-2" />
                                                            Assign Clients
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    {member.isActive && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeactivate(member.id, member.name)}
                                                                className="text-orange-600 dark:text-orange-400 cursor-pointer"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Deactivate
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
