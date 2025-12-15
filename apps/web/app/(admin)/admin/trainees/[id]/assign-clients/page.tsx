import { redirect } from 'next/navigation'
import { use } from 'react'

// Redirect /admin/trainees/:id/assign-clients to /admin/team-members/:id/assign-clients
export default function TraineeAssignClientsRedirect({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    redirect(`/admin/team-members/${id}/assign-clients`)
}
