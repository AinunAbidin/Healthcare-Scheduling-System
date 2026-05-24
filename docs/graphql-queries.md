# GraphQL Queries and Mutations

Use these endpoints:
- Auth service: `http://localhost:3001/graphql`
- Schedule service: `http://localhost:3002/graphql`

For schedule-service operations, set header:
```http
Authorization: Bearer <accessToken>
```

## 1. Register
Endpoint: `auth-service`

```graphql
mutation Register {
  register(input: { email: "admin@example.com", password: "StrongPass123" }) {
    id
    email
    createdAt
    updatedAt
  }
}
```

## 2. Login
Endpoint: `auth-service`

```graphql
mutation Login {
  login(input: { email: "admin@example.com", password: "StrongPass123" }) {
    accessToken
    tokenType
    expiresIn
    user {
      id
      email
    }
  }
}
```

## 3. Validate Token
Endpoint: `auth-service`

```graphql
query ValidateToken {
  validateToken(token: "<accessToken>") {
    id
    email
  }
}
```

## 4. Create Customer
Endpoint: `schedule-service` (requires `Authorization`)

```graphql
mutation CreateCustomer {
  createCustomer(input: { name: "John Doe", email: "john@example.com" }) {
    id
    name
    email
    createdAt
    updatedAt
  }
}
```

## 5. Create Doctor
Endpoint: `schedule-service` (requires `Authorization`)

```graphql
mutation CreateDoctor {
  createDoctor(input: { name: "Dr. Smith" }) {
    id
    name
    createdAt
    updatedAt
  }
}
```

## 6. Create Schedule
Endpoint: `schedule-service` (requires `Authorization`)

Use `customerId` and `doctorId` created in steps 4 and 5.

```graphql
mutation CreateSchedule {
  createSchedule(
    input: {
      objective: "General consultation"
      customerId: "<customerId>"
      doctorId: "<doctorId>"
      scheduledAt: "2026-06-01T10:00:00.000Z"
      status: PENDING
    }
  ) {
    id
    objective
    customerId
    doctorId
    scheduledAt
    status
    createdAt
    updatedAt
  }
}
```

After `createSchedule` succeeds, schedule-service enqueues:
- `SEND_SCHEDULE_CREATED_EMAIL`

## 7. Update Schedule Status
Endpoint: `schedule-service` (requires `Authorization`)

Gunakan mutation ini jika hanya ingin mengubah status schedule tanpa mengubah field lain.

```graphql
mutation UpdateScheduleStatus {
  updateScheduleStatus(input: { id: "<scheduleId>", status: COMPLETED }) {
    id
    status
    updatedAt
  }
}
```

Jika status diubah menjadi `COMPLETED`, schedule-service akan enqueue:
- `SEND_SCHEDULE_COMPLETED_EMAIL`

## Additional Customer Operations
Endpoint: `schedule-service` (requires `Authorization`)

```graphql
query Customers {
  customers(input: { skip: 0, take: 10 }) {
    items {
      id
      name
      email
    }
    total
    skip
    take
  }
}
```

```graphql
query Customer {
  customer(input: { id: "<customerId>" }) {
    id
    name
    email
  }
}
```

```graphql
mutation UpdateCustomer {
  updateCustomer(
    input: { id: "<customerId>", name: "John Updated", email: "john.updated@example.com" }
  ) {
    id
    name
    email
  }
}
```

```graphql
mutation DeleteCustomer {
  deleteCustomer(input: { id: "<customerId>" }) {
    id
  }
}
```

## Additional Doctor Operations
Endpoint: `schedule-service` (requires `Authorization`)

```graphql
query Doctors {
  doctors(input: { skip: 0, take: 10 }) {
    items {
      id
      name
    }
    total
    skip
    take
  }
}
```

```graphql
query Doctor {
  doctor(input: { id: "<doctorId>" }) {
    id
    name
  }
}
```

```graphql
mutation UpdateDoctor {
  updateDoctor(input: { id: "<doctorId>", name: "Dr. Updated" }) {
    id
    name
  }
}
```

```graphql
mutation DeleteDoctor {
  deleteDoctor(input: { id: "<doctorId>" }) {
    id
  }
}
```

## Schedule Query and Delete
Endpoint: `schedule-service` (requires `Authorization`)

```graphql
query Schedules {
  schedules(
    input: {
      doctorId: "<doctorId>"
      status: PENDING
      fromScheduledAt: "2026-06-01T00:00:00.000Z"
      toScheduledAt: "2026-06-30T23:59:59.000Z"
      skip: 0
      take: 10
    }
  ) {
    items {
      id
      objective
      customerId
      doctorId
      scheduledAt
      status
    }
    total
    skip
    take
  }
}
```

```graphql
query Schedule {
  schedule(input: { id: "<scheduleId>" }) {
    id
    objective
    customerId
    doctorId
    scheduledAt
    status
  }
}
```

```graphql
mutation DeleteSchedule {
  deleteSchedule(input: { id: "<scheduleId>" }) {
    id
  }
}
```

After `deleteSchedule` succeeds, schedule-service enqueues:
- `SEND_SCHEDULE_DELETED_EMAIL`
