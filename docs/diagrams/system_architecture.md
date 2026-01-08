# System Architecture Diagram

```mermaid
flowchart TD
    subgraph Client[Client (Browser)]
        UI[React/Next.js UI]
    end
    subgraph API[API Server]
        A1[Express.js (Node)]
        A2[Prisma ORM]
        A3[Auth Service]
        A4[Service Workflow Engine]
        A5[Document Management]
    end
    subgraph DB[PostgreSQL Database]
        DB1[Tenants (Firms)]
        DB2[Users & Roles]
        DB3[Services & Statuses]
        DB4[Documents & Slots]
        DB5[Invoices]
    end
    UI -->|REST/GraphQL| A1
    A1 --> A2
    A2 --> DB1 & DB2 & DB3 & DB4 & DB5
    A1 --> A3
    A1 --> A4
    A1 --> A5
    style Client fill:#f9f,stroke:#333,stroke-width:2px
    style API fill:#bbf,stroke:#333,stroke-width:2px
    style DB fill:#bfb,stroke:#333,stroke-width:2px
```
