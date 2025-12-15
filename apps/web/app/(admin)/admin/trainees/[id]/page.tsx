import { redirect } from 'next/navigation'
import { use } from 'react'

// Redirect /admin/trainees/:id to /admin/team-members/:id
export default function TraineeDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    redirect(`/admin/team-members/${id}`)
}
