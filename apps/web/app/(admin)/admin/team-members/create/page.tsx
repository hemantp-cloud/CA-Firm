"use client"

import { redirect } from "next/navigation"

// Redirect /admin/trainees/create to /admin/trainees/new
export default function CreateTraineePage() {
    redirect("/admin/trainees/new")
}
