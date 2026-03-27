# Frontend Schema Usage Guide (Updated)

## Objective

This project uses a contract-first workflow between Django and React TypeScript:

1. Backend exposes API contract via OpenAPI.
2. Frontend generates TypeScript types from that contract.
3. Frontend maps API payloads to domain models used by UI.

This avoids contract drift and makes refactors safer.

---

## Current source of truth

- Backend schema export: `django/Back-end/schema.yaml`
- Generated frontend contract types: `frontend/src/schemas/generated-api.ts`
- Frontend manual contract fallback: `frontend/src/schemas/api-contracts.ts`
- Frontend UI/domain types: `frontend/src/schemas/domain-models.ts`
- Shared aliases/enums: `frontend/src/schemas/common.ts`
- Backward compatibility barrel: `frontend/src/schemas/backend-schema.ts`

---

## Commands used by frontend devs

From `frontend/`:

- `npm run schema:export` → Django exports OpenAPI schema
- `npm run types:generate` → Generate TS types from `schema.yaml`
- `npm run api:sync` → Export + generate in one step
- `npm run build` → Type/build validation

---

## Step-by-step workflow when a new API endpoint is added

Example process after backend creates a new endpoint:

1. Implement endpoint in Django (view + URL).
2. Add or update endpoint documentation with `@extend_schema` (request, params, responses).
3. If needed, add serializer classes for request/response payloads.
4. Run `npm run api:sync` in frontend.
5. Check diff in `src/schemas/generated-api.ts`.
6. Update frontend API service method with generated request/response types.
7. Map API response DTO to domain model (if UI shape differs).
8. Run `npm run build`.

If build fails, it usually means backend contract changed and frontend usage must be updated.

---

## Why `extend_schema` is important

Without `@extend_schema` on function-based API views, OpenAPI generation often infers weak or incomplete contracts.

With `@extend_schema`:

- Endpoint request body is explicit.
- Query/path parameters are explicit.
- Response status contracts (`200`, `201`, `400`, etc.) are explicit.
- Generated frontend types are more reliable.
- Swagger docs become clearer for backend and frontend teams.

In this project, `extend_schema` is now applied across auth/admin/teacher endpoints, so schema export runs cleanly.

---

## API ↔ Schema ↔ Model map

### A) Auth endpoints (explicit serializers)

| API                                             | Request schema                    | Response schema                    | Main models involved                       |
| ----------------------------------------------- | --------------------------------- | ---------------------------------- | ------------------------------------------ |
| `POST /api/auth/login/`                         | `LoginRequestSerializer`          | `TokenPairSerializer`              | `Users`                                    |
| `POST /api/auth/refresh/`                       | `RefreshTokenRequestSerializer`   | `TokenPairSerializer`              | `Users`                                    |
| `POST /api/auth/register/`                      | `RegisterRequestSerializer`       | `TokenPairSerializer`              | `Users`, `Teachers`, `Students`, `Classes` |
| `PATCH /api/auth/update-pass/`                  | `UpdatePasswordRequestSerializer` | `MessageSerializer`                | `Users`                                    |
| `PATCH /api/auth/update-account/`               | `UpdateAccountRequestSerializer`  | role-dependent object              | `Users`, `Teachers`, `Students`            |
| `POST /api/auth/forgot-password/`               | `ForgotPasswordRequestSerializer` | `MessageSerializer`                | `Users`                                    |
| `GET /api/auth/forget-password/confirme/`       | query params (`uid`, `token`)     | redirect or `MessageSerializer`    | `Users`                                    |
| `POST /api/auth/forget_password/reset/`         | `ResetPasswordRequestSerializer`  | `MessageSerializer`                | `Users`                                    |
| `POST /api/auth/forget_password/reset-confirm/` | `ResetPasswordRequestSerializer`  | `MessageSerializer`                | `Users`                                    |
| `GET /api/auth/user/teacher/`                   | none                              | `TeacherProfileResponseSerializer` | `Users`, `Teachers`                        |
| `GET /api/auth/user/student/`                   | none                              | `StudentProfileResponseSerializer` | `Users`, `Students`, `Classes`             |

Serializer definitions are in `django/Back-end/api/auth/serializers.py`.

---

### B) Admin panel endpoints (generic OpenAPI object currently)

All admin endpoints in `django/Back-end/api/admin_panel/views.py` are now annotated with:

- request: `OpenApiTypes.OBJECT` (for body endpoints)
- responses: `GENERIC_RESPONSES` (object status map)

This guarantees schema generation coverage now, but for stronger typing each endpoint should be upgraded to dedicated serializer classes.

Main model groups by feature:

- Classes/schedules: `Classes`, `Schedules`, `Teachers`, `Users`
- Students: `Students`, `Users`, `Classes`
- Posts: `Posts`, `Classes`, `Users`
- Forum: `ForumQuestions`, `ForumAnswers`, `Classes`, `Users`
- Teacher availability/load: `TeacherAvailabilities`, `Teachers`, `Users`
- Exam calendar: `ExamSessions`, `ExamSurveillanceAssignments`, `Classes`, `Teachers`, `Users`
- PFE: `PFESubjects`, `PFEPresentationSlots`, `PFEJuryAssignments`, `Teachers`, `Users`

---

### C) Teacher panel endpoints (generic OpenAPI object currently)

All teacher endpoints in `django/Back-end/api/teacher_panel/views.py` are annotated with:

- request: `OpenApiTypes.OBJECT` (for body endpoints)
- responses: `TEACHER_GENERIC_RESPONSES`

Main models:

- Presence/absence: `Attendance`, `Students`, `Schedules`, `Users`
- Session lookup: `Schedules`, `Teachers`
- Teacher classes: `Schedules`, `Classes`

---

## How frontend should consume these schemas

Use a 3-layer approach:

1. API service layer uses generated OpenAPI types from `generated-api.ts`.
2. Mapper layer translates API DTO fields to domain models (`domain-models.ts`).
3. UI layer consumes only domain models.

This keeps UI stable even if backend naming changes.

---

## Recommended next hardening step

Move admin and teacher endpoints from generic `OpenApiTypes.OBJECT` to dedicated request/response serializers (like auth already does). That will produce precise generated types per endpoint and reduce manual frontend fallback usage.
