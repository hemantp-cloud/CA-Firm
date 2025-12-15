import { redirect } from 'next/navigation'

// Redirect /admin/trainees/create to /admin/team-members/new
export default function TraineesCreateRedirect() {
    redirect('/admin/team-members/new')
}
