# CA Firm Management System - Complete Testing Guide

> **Date**: December 15, 2025  
> **Version**: Enhanced Service Workflow v1.0

---

## 📋 Pre-requisites

### Servers Must Be Running:
1. **Backend API** - Port 4000 (`npm run dev` in `apps/api`)
2. **Frontend** - Port 3000 (`npm run dev` in `apps/web`)

### Test URLs:
- Frontend: http://localhost:3000
- Backend Health: http://localhost:4000/api/health

---

## 🏢 System Overview

### User Hierarchy (Top to Bottom):
```
SUPER_ADMIN (Firm Owner) - Full system access
    └── ADMIN - Firm-wide management
        └── PROJECT_MANAGER (PM) - Client & Service management
            └── TEAM_MEMBER (TM) - Task execution
                └── CLIENT - Service consumer
```

### New Service Workflow Statuses (12 total):
```
PENDING → ASSIGNED → IN_PROGRESS → WAITING_FOR_CLIENT/ON_HOLD → 
UNDER_REVIEW → CHANGES_REQUESTED → COMPLETED → DELIVERED → 
INVOICED → CLOSED/CANCELLED
```

---

## 🧪 TESTING PHASE 1: Authentication & Login

### Test 1.1: Login as Super Admin
1. Go to http://localhost:3000/login
2. Enter Super Admin credentials (check your database for a SUPER_ADMIN user)
3. Verify redirect to `/super-admin/dashboard`
4. ✅ **Expected**: Dashboard loads with firm-wide statistics

### Test 1.2: Login as Project Manager
1. Go to http://localhost:3000/login
2. Enter PM credentials
3. Verify redirect to `/project-manager/dashboard`
4. ✅ **Expected**: PM Dashboard loads with "Welcome back" message

### Test 1.3: Login as Client
1. Go to http://localhost:3000/login
2. Enter Client credentials
3. Verify redirect to `/client/dashboard`
4. ✅ **Expected**: Client Dashboard with their services

---

## 🧪 TESTING PHASE 2: Project Manager Portal

### Test 2.1: View Dashboard
1. Login as Project Manager
2. Verify dashboard shows:
   - My Clients count
   - Team Members count
   - Active Services count
   - Pending Tasks count
3. ✅ **Expected**: All cards load with actual counts

### Test 2.2: Manage Clients
1. Navigate to **Clients** in sidebar
2. Click **Add Client** button
3. Fill in client details:
   - Name: "Test Client ABC"
   - Email: "testclient@example.com"
   - Phone: "9876543210"
   - Password: "Test@123"
4. Click Submit
5. ✅ **Expected**: Client created successfully, appears in list

### Test 2.3: View Services (Kanban View)
1. Navigate to **Services** in sidebar
2. Verify Kanban board loads with columns:
   - Pending
   - In Progress
   - Under Review
   - Completed
3. Toggle to **Table View**
4. ✅ **Expected**: Both views work correctly

### Test 2.4: Create a New Service
1. On Services page, click **Add Service**
2. Fill in:
   - Client: Select a client
   - Service Type: Select any (ITR, GST, etc.)
   - Title: "Test Service - ITR Filing"
   - Description: "Test service for workflow"
   - Due Date: Any future date
3. Submit
4. ✅ **Expected**: Service created, appears in Pending column

### Test 2.5: Assign Service (New Workflow)
1. Click on a Pending service
2. Click **Assign** button
3. Select assignee (Team Member or self)
4. Add optional notes
5. Submit
6. ✅ **Expected**: 
   - Service status changes to ASSIGNED
   - Assignment recorded in history

### Test 2.6: Start Work on Service
1. Open an ASSIGNED service
2. Click **Start Work** action
3. ✅ **Expected**: 
   - Status changes to IN_PROGRESS
   - Start date recorded

### Test 2.7: Request Documents from Client
1. Open an IN_PROGRESS service
2. Click **Request Documents**
3. Enter what documents are needed
4. Submit
5. ✅ **Expected**: Status changes to WAITING_FOR_CLIENT

### Test 2.8: Put Service On Hold
1. Open any active service
2. Click **Put on Hold**
3. Enter reason
4. Submit
5. ✅ **Expected**: Status changes to ON_HOLD

### Test 2.9: Resume Work
1. Open an ON_HOLD service
2. Click **Resume Work**
3. ✅ **Expected**: Status returns to IN_PROGRESS

### Test 2.10: Submit for Review
1. Open an IN_PROGRESS service
2. Click **Submit for Review**
3. ✅ **Expected**: Status changes to UNDER_REVIEW

### Test 2.11: Approve/Request Changes
1. Open an UNDER_REVIEW service
2. Option A: Click **Approve** → Status becomes COMPLETED
3. Option B: Click **Request Changes** → Status becomes CHANGES_REQUESTED
4. ✅ **Expected**: Correct status transition

### Test 2.12: Complete Service Lifecycle
1. Open a COMPLETED service
2. Click **Deliver to Client**
3. ✅ **Expected**: Status becomes DELIVERED
4. Click **Close Service**
5. ✅ **Expected**: Status becomes CLOSED

---

## 🧪 TESTING PHASE 3: Team Member Management

### Test 3.1: Create Team Member
1. As PM, navigate to **Team Members**
2. Click **Add Team Member**
3. Fill in details:
   - Name: "Test TM"
   - Email: "testtm@example.com"
   - Password: "Test@123"
4. Submit
5. ✅ **Expected**: Team Member created

### Test 3.2: Assign Clients to Team Member
1. Click on a Team Member
2. Click **Assign Clients**
3. Select one or more clients
4. Submit
5. ✅ **Expected**: Clients assigned to TM

### Test 3.3: Delegate Service to Team Member
1. Open a service you're working on
2. Click **Delegate**
3. Select Team Member
4. Add delegation notes
5. Submit
6. ✅ **Expected**: Service assigned to TM

---

## 🧪 TESTING PHASE 4: Service Status History

### Test 4.1: View Status History
1. Open any service that has been through status changes
2. Look for **Status History** section
3. ✅ **Expected**: See all status transitions with:
   - Previous status
   - New status
   - Changed by (name)
   - Timestamp
   - Notes (if any)

---

## 🧪 TESTING PHASE 5: Admin Portal

### Test 5.1: Admin Dashboard
1. Login as Admin
2. Verify dashboard loads
3. ✅ **Expected**: Firm-wide statistics visible

### Test 5.2: Manage All Users
1. Navigate to Users section
2. View Project Managers, Team Members, Clients
3. Create/Edit/Deactivate users
4. ✅ **Expected**: Full CRUD operations work

---

## 🧪 TESTING PHASE 6: Super Admin Portal

### Test 6.1: Super Admin Dashboard
1. Login as Super Admin
2. Verify full system visibility
3. ✅ **Expected**: Complete firm overview

### Test 6.2: Firm Settings
1. Navigate to Firm Settings
2. Update firm details
3. ✅ **Expected**: Settings saved

### Test 6.3: Activity Logs
1. Navigate to Activity Logs
2. ✅ **Expected**: See audit trail of all actions

---

## 🧪 TESTING PHASE 7: Client Portal

### Test 7.1: Client Dashboard
1. Login as Client
2. View dashboard
3. ✅ **Expected**: See assigned services

### Test 7.2: View Services
1. Navigate to Services
2. See list of services
3. ✅ **Expected**: Only client's services visible

### Test 7.3: Request New Service (Future Feature)
1. Click "Request Service"
2. Fill in service request form
3. ✅ **Expected**: Request submitted for PM approval

---

## 🧪 TESTING PHASE 8: API Endpoints (Advanced)

You can test these directly using Postman or curl:

### Service Workflow Endpoints:
```
POST /api/service-workflow/services                    - Create service
GET  /api/service-workflow/services/:id                - Get service details
POST /api/service-workflow/services/:id/assign         - Assign service
POST /api/service-workflow/services/:id/delegate       - Delegate service
POST /api/service-workflow/services/:id/actions/start-work
POST /api/service-workflow/services/:id/actions/request-documents
POST /api/service-workflow/services/:id/actions/put-on-hold
POST /api/service-workflow/services/:id/actions/resume-work
POST /api/service-workflow/services/:id/actions/submit-review
POST /api/service-workflow/services/:id/actions/approve
POST /api/service-workflow/services/:id/actions/request-changes
POST /api/service-workflow/services/:id/actions/mark-complete
POST /api/service-workflow/services/:id/actions/deliver
POST /api/service-workflow/services/:id/actions/close
POST /api/service-workflow/services/:id/actions/cancel
GET  /api/service-workflow/services/:id/status-history
GET  /api/service-workflow/stats
```

---

## 📊 Testing Checklist

| Feature | Tested | Pass/Fail | Notes |
|---------|--------|-----------|-------|
| Super Admin Login | ☐ | | |
| Admin Login | ☐ | | |
| PM Login | ☐ | | |
| Client Login | ☐ | | |
| PM Dashboard | ☐ | | |
| Create Client | ☐ | | |
| Create Service | ☐ | | |
| Assign Service | ☐ | | |
| Start Work | ☐ | | |
| Request Documents | ☐ | | |
| Put on Hold | ☐ | | |
| Resume Work | ☐ | | |
| Submit Review | ☐ | | |
| Approve | ☐ | | |
| Request Changes | ☐ | | |
| Deliver | ☐ | | |
| Close Service | ☐ | | |
| Cancel Service | ☐ | | |
| Status History | ☐ | | |
| Team Member CRUD | ☐ | | |
| Delegate Service | ☐ | | |

---

## 🚀 Quick Start Testing

**Minimum Path to Test Enhanced Workflow:**

1. Login as PM → http://localhost:3000/login
2. Go to Services → Create new service
3. Assign the service
4. Start work
5. Submit for review
6. Approve
7. Deliver
8. Close

This tests the complete happy-path workflow!

---

## 📝 Notes

- Backend must be running on port 4000
- Frontend must be running on port 3000
- Check console for any errors during testing
- Database should have at least one user of each role for complete testing

