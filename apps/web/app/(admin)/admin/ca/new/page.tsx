import { redirect } from 'next/navigation'

// Redirect /admin/ca/new to /admin/project-managers/new
export default function CANewRedirect() {
  redirect('/admin/project-managers/new')
}
