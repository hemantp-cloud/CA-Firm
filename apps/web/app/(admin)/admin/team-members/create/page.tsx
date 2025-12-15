"use client"

import { redirect } from "next/navigation"

// Redirect /admin/team-members/create to /admin/team-members/new
export default function CreateTeamMemberPage() {
    redirect("/admin/team-members/new")
}
