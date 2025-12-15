import { redirect } from 'next/navigation'
import { use } from 'react'

// Redirect /admin/ca/:id to /admin/project-managers/:id
export default function CADetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  redirect(`/admin/project-managers/${id}`)
}
