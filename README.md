# Seeker Application - Job Platform

A full-stack job seeker platform built with Node.js and vanilla JavaScript. This platform connects unemployed individuals with employers, allowing seamless job searching, application management, and recruitment processes.
link to my srs document (https://docs.google.com/document/d/1WPUcMTcOvXrdnm6uKF9n2TEnv-YvLBD_2GILYhF0Rk4/edit?tab=t.0
)
link to my video on how the app runings (https://youtu.be/ODrcevzM6ho
)
my project url link (https://the-seeker-platform.onrender.com
)
## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Usage Guide](#-usage-guide)
- [Security](#-security)
- [Future Enhancements](#-future-enhancements)
- [Contributing](#-contributing)

---

##  Features

### For Job Seekers
- ✅ User registration and secure login
- ✅ Browse available job listings
- ✅ View detailed job information
- ✅ Apply for jobs with personalized cover letters
- ✅ Track application status (pending, accepted, rejected)
- ✅ View personal application history
- ✅ Profile management with skills and experience

### For Employers
- ✅ Business owner registration
- ✅ Post new job listings
- ✅ Manage job postings (create, update, delete)
- ✅ View applications for posted jobs
- ✅ Track applicant information and details
- ✅ Update application status (approve/reject)
- ✅ Company profile management

### For Administrators
- ✅ View all jobs with application statistics
- ✅ View all users with activity metrics
- ✅ Platform-wide analytics

---

## 🛠 Tech Stack

- **Backend**: Node.js with Express.js
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Authentication**: JWT (JSON Web Tokens)
- **Password Security**: bcryptjs
- **Data Storage**: JSON files (easily migratable to database)
- **Environment**: dotenv for configuration

### Dependencies
- `express` - Web framework
- `bcryptjs` - Password hashing
- `jsonwebtoken` - Authentication tokens
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables
- `uuid` - Unique identifier generation

---

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Setup Steps

1. **Clone or download this repository**
   ```bash
   git clone <repository-url>
   cd "Seeker application"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a `.env` file** (optional, for production)
   ```env
   PORT=3000
   JWT_SECRET=your-secret-key-here-change-in-production
   ```

4. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Open your browser and navigate to:**
   ```
   http://localhost:3000
   ```

---

##  Project Structure

```
seeker-application/
├── server.js              # Express server and API routes
├── package.json           # Dependencies and scripts
├── .gitignore            # Git ignore rules
├── .env                  # Environment variables (create this)
├── data/                 # JSON data storage (auto-created)
│   ├── users.json        # User accounts
│   ├── jobs.json         # Job postings
│   └── applications.json # Job applications
├── public/               # Frontend files
│   ├── index.html        # Main HTML file
│   ├── styles.css        # Styling
│   └── app.js            # Frontend JavaScript
└── README.md             # This file
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/register` | Register new user (job seeker or employer) | No |
| `POST` | `/api/login` | Login user | No |
| `GET` | `/api/profile` | Get current user profile | Yes |
| `PUT` | `/api/profile` | Update user profile | Yes |

### Jobs
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/jobs` | Get all active jobs | No |
| `GET` | `/api/jobs/:id` | Get single job by ID | No |
| `POST` | `/api/jobs` | Create new job posting | Yes (Employer) |
| `PUT` | `/api/jobs/:id` | Update job posting | Yes (Employer) |
| `DELETE` | `/api/jobs/:id` | Delete job posting | Yes (Employer) |
| `GET` | `/api/jobs/employer/my-jobs` | Get jobs posted by current employer | Yes (Employer) |

### Applications
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/jobs/:id/apply` | Apply for a job | Yes (Job Seeker) |
| `GET` | `/api/jobs/:id/applications` | Get applications for a job | Yes (Employer) |
| `GET` | `/api/applications/my-applications` | Get current user's applications | Yes (Job Seeker) |
| `PATCH` | `/api/applications/:id/status` | Update application status | Yes (Employer) |

### Admin
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/admin/jobs` | Get all jobs with statistics | Yes (Admin) |
| `GET` | `/api/admin/users` | Get all users with statistics | Yes (Admin) |

---

##  Usage Guide

### 1. Register as a Job Seeker
1. Click "Register" on the homepage
2. Fill in your personal details (name, email, password, phone, location)
3. Select "Job Seeker" as user type
4. Optionally add education, experience, skills, and employment status
5. You'll be automatically logged in after registration

### 2. Register as an Employer
1. Click "Register" on the homepage
2. Fill in your business details
3. Select "Employer/Business Owner" as user type
4. Enter your company name (required)
5. Optionally add company website, industry, size, and description
6. You'll be automatically logged in after registration

### 3. Post a Job (Employers)
1. After logging in, navigate to "Post Job"
2. Fill in job details:
   - Title
   - Description
   - Company name
   - Location
   - Salary (optional)
   - Requirements
   - Job type (Full-time, Part-time, etc.)
3. Submit to post the job

### 4. Apply for Jobs (Job Seekers)
1. Browse available jobs on the homepage
2. Click on a job to view detailed information
3. Fill in your cover letter
4. Click "Apply" to submit your application
5. Track your application status in "My Applications"

### 5. Manage Applications (Employers)
1. View all applications for your posted jobs
2. See applicant details including education, experience, and skills
3. Update application status: pending, accepted, or rejected

---

## Security

- ✅ Passwords are hashed using `bcryptjs` with salt rounds
- ✅ JWT tokens are used for secure authentication
- ✅ API endpoints are protected with authentication middleware
- ✅ User type-based authorization (job seeker, employer, admin)
- ✅ Token expiration set to 7 days

### Security Recommendations for Production
- Use a strong, randomly generated `JWT_SECRET`
- Implement rate limiting
- Add HTTPS/SSL certificates
- Use environment variables for sensitive data
- Consider implementing refresh tokens
- Add input validation and sanitization
- Implement CORS policies appropriately

---

##  Future Enhancements

- [ ] Database integration (MongoDB, PostgreSQL, etc.)
- [ ] File upload for resumes and documents
- [ ] Email notifications for applications and status updates
- [ ] Advanced search and filtering (by location, salary, type)
- [ ] Enhanced user profiles with skills and experience
- [ ] Job categories and tags
- [ ] Real-time notifications
- [ ] Password reset functionality
- [ ] Admin dashboard with analytics
- [ ] Job recommendations based on profile
- [ ] Messaging system between employers and job seekers
- [ ] Calendar integration for interviews
- [ ] Multi-language support

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


---

##  Author
chiagbanweghi moses peter

Built for connecting job seekers with opportunities.

---

**Note**: This application uses JSON files for data storage. For production use, consider migrating to a proper database system (MongoDB, PostgreSQL, etc.) for better performance and scalability.
