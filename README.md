# CareerTrack

Full-stack job portal and recruitment management system built with the MERN stack (MongoDB, Express.js, React, Node.js).

Public visitors can browse job openings and apply without creating an account. Administrators sign in to a protected dashboard to manage job postings and review candidate applications.

## Key features

**Public visitors**
- Browse published, non-expired jobs
- Search by title, company and location; filter by job type and experience level; sort; paginate
- Job detail page with responsibilities, qualifications, skills, benefits and application instructions
- Apply without logging in: name, email, phone, education, experience, skills, cover letter and a PDF or DOCX resume (2 MB limit)
- Duplicate applications (same email and job) are rejected; applications for unpublished, closed or expired jobs are rejected

**Administrators**
- Secure login (bcrypt password hashing, JWT authentication)
- Dashboard with total, active, and closed or expired jobs, plus total applications
- Create, edit, publish, unpublish, close and delete jobs; search, filter, sort and paginate the job list
- View applications per job, filter by job, date range and status, search by name or email
- Update status: Submitted, Under Review, Shortlisted, Interview Scheduled, Selected, Rejected
- Add internal notes, download resumes through authenticated access only, export applications to CSV

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router, Vite, plain CSS |
| Backend | Node.js, Express 4 |
| Database | MongoDB with Mongoose |
| Auth | JSON Web Tokens, bcryptjs |
| Security | helmet, CORS allow-list, express-rate-limit, express-mongo-sanitize, server-side validation |
| Uploads | multer (memory storage, stored in MongoDB, never served publicly) |

## Architecture

```
React (Vite)  --HTTP/JSON-->  Express REST API  -->  MongoDB
  pages, routing               routes -> controllers      jobs
  auth context                 middleware (auth,          applications
  fetch wrapper                upload, errors)            admins
```

Backend folders: `config`, `models`, `routes`, `controllers`, `middleware`, `utils`.

Resumes are stored inside the application document (excluded from queries by default) and can only be retrieved through `GET /api/admin/applications/:id/resume` with a valid administrator token. They are never exposed through a public URL.

## Prerequisites

- Node.js 18 or newer
- A MongoDB database (MongoDB Atlas free tier or a local MongoDB server)
- Git

## Local setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and set:

| Variable | Description |
|---|---|
| `PORT` | API port (default 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string used to sign tokens |
| `CLIENT_URL` | Frontend origin(s) allowed by CORS, comma separated |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Used by the seed script to create the administrator |

Create the administrator and sample jobs, then start the API:

```bash
npm run seed
npm run dev
```

The API runs at `http://localhost:5000/api`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_URL` in `.env` to the API base URL. The app runs at `http://localhost:5173`.

On Windows Command Prompt, use `copy .env.example .env` instead of `cp`.

## API documentation

Base path: `/api`. Protected routes need the header `Authorization: Bearer <token>`.

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | No | Health check |
| GET | `/jobs` | No | List active jobs. Query: `search`, `location`, `type`, `level`, `sort`, `page`, `limit` |
| GET | `/jobs/:id` | No | Job detail |
| POST | `/jobs/:id/apply` | No | Submit application (multipart form with `resume`) |
| POST | `/auth/login` | No | Administrator login, returns token |
| GET | `/auth/me` | Yes | Current administrator |
| GET | `/admin/stats` | Yes | Dashboard statistics |
| GET | `/admin/jobs` | Yes | List all jobs. Query: `search`, `status`, `sort`, `page`, `limit` |
| POST | `/admin/jobs` | Yes | Create job |
| GET | `/admin/jobs/:id` | Yes | Get one job |
| PUT | `/admin/jobs/:id` | Yes | Update job |
| PATCH | `/admin/jobs/:id/status` | Yes | Set status: draft, published, closed |
| DELETE | `/admin/jobs/:id` | Yes | Delete job and its applications |
| GET | `/admin/applications` | Yes | List applications. Query: `job`, `status`, `from`, `to`, `search`, `page` |
| GET | `/admin/applications/export` | Yes | Download CSV (same filters) |
| GET | `/admin/applications/:id` | Yes | Application detail |
| PATCH | `/admin/applications/:id/status` | Yes | Update application status |
| POST | `/admin/applications/:id/notes` | Yes | Add internal note |
| GET | `/admin/applications/:id/resume` | Yes | Download resume |

Error responses use the shape `{ "success": false, "message": "...", "errors": ["..."] }` with status codes 400, 401, 403, 404, 409, 429 or 500.

## Testing

Manual test cases with expected results are listed in `docs/Test_Cases.xlsx`. Run the application locally, execute each case, and record the actual result and status.

## Deployment

- Frontend: Vercel (set `VITE_API_URL` to the deployed API URL; `vercel.json` handles client-side routing)
- Backend: Render web service (root directory `backend`, build command `npm install`, start command `npm start`, environment variables from `.env.example`)
- Database: MongoDB Atlas

Deployment URLs: see `Deployment_Links.txt`.

## Known limitations and future improvements

- Resumes are stored in MongoDB with a 2 MB limit; a dedicated object store would suit larger volumes
- Single administrator role; no multi-role permissions
- No email notifications to candidates
- Automated tests are not included; testing is manual
