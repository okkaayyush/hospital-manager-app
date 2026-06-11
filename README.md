
# MediBook - Hospital Appointment System

A full-stack web application that lets patients book appointments with doctors, doctors manage their schedules, and admins oversee the entire system.

## What it does

**Patients** can browse verified doctors, filter by specialization, check real-time slot availability, book appointments, and download confirmation receipts.

**Doctors** can manage their appointment schedule, set available days and time slots, upload a profile photo, and update their availability in real time.

**Admins** can approve doctor registrations, manage users, and oversee all appointments across the platform.

## Tech Stack

- **Frontend** - React, deployed on Vercel
- **Backend** - Node.js + Express, deployed on Render
- **Database** - MongoDB Atlas
- **Auth** - JWT (JSON Web Tokens)
- **File Storage** - Cloudinary (doctor profile photos)

## Features

- Role-based access for patients, doctors, and admins
- Real-time slot blocking - booked slots are marked and unavailable
- Doctor photo upload with in-browser cropping
- Appointment confirmation print/download
- Search and filter doctors by specialization
- Cascade delete - removing a user removes all their associated data
- Fully mobile responsive with hamburger navigation

## Live Demo

Frontend: `https://hospital-manager-app-9yw7.vercel.app/auth`

## Running locally

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm start
```

Set up a `.env` file in the backend with:
```
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---
