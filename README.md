# University Learning Management System

Full-stack learning management system built with NestJS, React, TypeScript, PostgreSQL, and Docker.

The project models university learning workflows for students, lecturers, and administrators. It includes course enrollment, learning materials, assignments and grading, discussion forums, announcements, notifications, attendance-related workflows, and role-based administration.

## Engineering scope

- NestJS REST API with TypeScript
- React frontend with TypeScript
- PostgreSQL persistence through TypeORM
- JWT-based authentication and role-aware authorization
- course, enrollment, assignment, forum, announcement, and notification domains
- file upload flows for learning materials and submissions
- database migrations and seed data
- Docker-based local deployment

## Architecture

```text
React frontend
      |
      | HTTP / JWT
      v
NestJS API
      |
      +---- authentication / users
      +---- courses / enrollments
      +---- assignments / grading
      +---- forums / announcements
      +---- notifications / uploads
      |
      v
PostgreSQL
```

## Repository structure

```text
.
├── backend/        NestJS API, entities, services, migrations, and seed data
├── frontend/       React application and API client
├── docs/           API and feature documentation
├── scripts/        setup, maintenance, and database utilities
└── docker-compose.yml
```

## Local development

### Docker

```bash
git clone https://github.com/HaikalE/lms-universitas-v1.git
cd lms-universitas-v1
docker compose up --build
```

### Manual setup

Backend:

```bash
cd backend
npm install
cp .env.example .env
npm run migration:run
npm run seed
npm run start:dev
```

Frontend:

```bash
cd frontend
npm install
npm start
```

Environment-specific database credentials, JWT secrets, and other runtime configuration belong in local environment files and must not be committed.

## API areas

The backend exposes endpoints for:

- authentication and user profiles;
- course creation and enrollment;
- learning materials;
- assignment submission and grading;
- course discussion forums;
- announcements;
- notifications;
- lecturer/admin student management.

See `docs/API_DOCUMENTATION.md` for the broader endpoint reference.

## Engineering notes

This repository reflects an actively developed academic/application prototype and retains database migrations, operational scripts, and selected technical documentation. Historical one-off debugging reports are intentionally not part of the main project documentation because Git history already preserves that development trail.

For a production deployment I would further harden secrets management, automated test coverage, observability, file-storage controls, authorization testing, backup/restore validation, and deployment automation.

## Author

Muhammad Haikal Rahman
