const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');
const APPLICATIONS_FILE = path.join(DATA_DIR, 'applications.json');

// Initialize data directory and files
async function initializeData() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Initialize users.json if it doesn't exist
    try {
      await fs.access(USERS_FILE);
    } catch {
      await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2));
    }
    
    // Initialize jobs.json if it doesn't exist
    try {
      await fs.access(JOBS_FILE);
    } catch {
      await fs.writeFile(JOBS_FILE, JSON.stringify([], null, 2));
    }
    
    // Initialize applications.json if it doesn't exist
    try {
      await fs.access(APPLICATIONS_FILE);
    } catch {
      await fs.writeFile(APPLICATIONS_FILE, JSON.stringify([], null, 2));
    }
  } catch (error) {
    console.error('Error initializing data:', error);
  }
}

// Helper functions to read/write data
async function readData(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeData(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Routes

// Register new user (job seeker or employer)
app.post('/api/register', async (req, res) => {
  try {
    const { 
      email, 
      password, 
      name, 
      userType, 
      phone, 
      location,
      // Job seeker fields
      education,
      experience,
      skills,
      employmentStatus,
      resume,
      // Employer fields
      companyName,
      companyWebsite,
      industry,
      companySize,
      companyDescription,
      calendlyLink
    } = req.body;

    if (!email || !password || !name || !userType || !phone || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (userType !== 'jobseeker' && userType !== 'employer' && userType !== 'admin') {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    if (userType === 'employer' && !companyName) {
      return res.status(400).json({ error: 'Company name required for employers' });
    }
    
    // Admin users don't need company name
    if (userType === 'admin') {
      // Admin registration allowed without company name
    }

    const users = await readData(USERS_FILE);
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with all fields
    const newUser = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      name,
      userType,
      phone,
      location,
      createdAt: new Date().toISOString()
    };

    // Add user type specific fields
    if (userType === 'jobseeker') {
      newUser.education = education || '';
      newUser.experience = experience || '';
      newUser.skills = skills || '';
      newUser.employmentStatus = employmentStatus || '';
      newUser.resume = resume || '';
    } else if (userType === 'employer') {
      newUser.companyName = companyName;
      newUser.companyWebsite = companyWebsite || '';
      newUser.industry = industry || '';
      newUser.companySize = companySize || '';
      newUser.companyDescription = companyDescription || '';
      newUser.calendlyLink = calendlyLink || '';
    } else if (userType === 'admin') {
      // Admin users don't need additional fields
      newUser.isAdmin = true;
    }

    users.push(newUser);
    await writeData(USERS_FILE, users);

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, userType: newUser.userType },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Prepare user response (exclude password)
    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      userType: newUser.userType,
      phone: newUser.phone,
      location: newUser.location
    };

    // Add user type specific fields to response
    if (userType === 'jobseeker') {
      userResponse.education = newUser.education;
      userResponse.experience = newUser.experience;
      userResponse.skills = newUser.skills;
      userResponse.employmentStatus = newUser.employmentStatus;
      userResponse.resume = newUser.resume;
    } else if (userType === 'employer') {
      userResponse.companyName = newUser.companyName;
      userResponse.companyWebsite = newUser.companyWebsite;
      userResponse.industry = newUser.industry;
      userResponse.companySize = newUser.companySize;
      userResponse.companyDescription = newUser.companyDescription;
      userResponse.calendlyLink = newUser.calendlyLink;
    }

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const users = await readData(USERS_FILE);
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, userType: user.userType },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Prepare user response (exclude password)
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      userType: user.userType,
      phone: user.phone || '',
      location: user.location || ''
    };

    // Add user type specific fields
    if (user.userType === 'jobseeker') {
      userResponse.education = user.education || '';
      userResponse.experience = user.experience || '';
      userResponse.skills = user.skills || '';
      userResponse.employmentStatus = user.employmentStatus || '';
      userResponse.resume = user.resume || '';
    } else if (user.userType === 'employer') {
      userResponse.companyName = user.companyName || '';
      userResponse.companyWebsite = user.companyWebsite || '';
      userResponse.industry = user.industry || '';
      userResponse.companySize = user.companySize || '';
      userResponse.companyDescription = user.companyDescription || '';
    }

    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const users = await readData(USERS_FILE);
    const user = users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prepare user response (exclude password)
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      userType: user.userType,
      phone: user.phone || '',
      location: user.location || ''
    };

    // Add user type specific fields
    if (user.userType === 'jobseeker') {
      userResponse.education = user.education || '';
      userResponse.experience = user.experience || '';
      userResponse.skills = user.skills || '';
      userResponse.employmentStatus = user.employmentStatus || '';
      userResponse.resume = user.resume || '';
    } else if (user.userType === 'employer') {
      userResponse.companyName = user.companyName || '';
      userResponse.companyWebsite = user.companyWebsite || '';
      userResponse.industry = user.industry || '';
      userResponse.companySize = user.companySize || '';
      userResponse.companyDescription = user.companyDescription || '';
      userResponse.calendlyLink = user.calendlyLink || '';
    }

    res.json(userResponse);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      phone,
      location,
      // Job seeker fields
      education,
      experience,
      skills,
      employmentStatus,
      resume,
      // Employer fields
      companyName,
      companyWebsite,
      industry,
      companySize,
      companyDescription,
      calendlyLink
    } = req.body;

    const users = await readData(USERS_FILE);
    const user = users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update basic fields
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (location !== undefined) user.location = location;

    // Update user type specific fields
    if (user.userType === 'jobseeker') {
      if (education !== undefined) user.education = education;
      if (experience !== undefined) user.experience = experience;
      if (skills !== undefined) user.skills = skills;
      if (employmentStatus !== undefined) user.employmentStatus = employmentStatus;
      if (resume !== undefined) user.resume = resume;
    } else if (user.userType === 'employer') {
      if (companyName) user.companyName = companyName;
      if (companyWebsite !== undefined) user.companyWebsite = companyWebsite;
      if (industry !== undefined) user.industry = industry;
      if (companySize !== undefined) user.companySize = companySize;
      if (companyDescription !== undefined) user.companyDescription = companyDescription;
      if (calendlyLink !== undefined) user.calendlyLink = calendlyLink;
    }

    await writeData(USERS_FILE, users);

    // Prepare response
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      userType: user.userType,
      phone: user.phone || '',
      location: user.location || ''
    };

    if (user.userType === 'jobseeker') {
      userResponse.education = user.education || '';
      userResponse.experience = user.experience || '';
      userResponse.skills = user.skills || '';
      userResponse.employmentStatus = user.employmentStatus || '';
      userResponse.resume = user.resume || '';
    } else if (user.userType === 'employer') {
      userResponse.companyName = user.companyName || '';
      userResponse.companyWebsite = user.companyWebsite || '';
      userResponse.industry = user.industry || '';
      userResponse.companySize = user.companySize || '';
      userResponse.companyDescription = user.companyDescription || '';
      userResponse.calendlyLink = user.calendlyLink || '';
    }

    res.json({
      message: 'Profile updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create job posting (employers only)
app.post('/api/jobs', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'employer') {
      return res.status(403).json({ error: 'Only employers can post jobs' });
    }

    const { title, description, company, location, salary, requirements, type } = req.body;

    if (!title || !description || !company || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const jobs = await readData(JOBS_FILE);
    const users = await readData(USERS_FILE);
    const employer = users.find(u => u.id === req.user.id);

    const newJob = {
      id: Date.now().toString(),
      title,
      description,
      company: company || employer.companyName,
      location,
      salary: salary || 'Not specified',
      requirements: requirements || [],
      type: type || 'Full-time',
      postedBy: req.user.id,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    jobs.push(newJob);
    await writeData(JOBS_FILE, jobs);

    res.status(201).json({
      message: 'Job posted successfully',
      job: newJob
    });
  } catch (error) {
    console.error('Job posting error:', error);
    res.status(500).json({ error: 'Server error while posting job' });
  }
});

// Get all jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await readData(JOBS_FILE);
    const activeJobs = jobs.filter(job => job.status === 'active');
    res.json(activeJobs);
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single job by ID
app.get('/api/jobs/:id', async (req, res) => {
  try {
    const jobs = await readData(JOBS_FILE);
    const job = jobs.find(j => j.id === req.params.id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update job posting (employers only)
app.put('/api/jobs/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'employer') {
      return res.status(403).json({ error: 'Only employers can update jobs' });
    }

    const { title, description, company, location, salary, requirements, type, status } = req.body;
    const jobId = req.params.id;

    const jobs = await readData(JOBS_FILE);
    const job = jobs.find(j => j.id === jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.postedBy !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own jobs' });
    }

    // Update job fields
    if (title) job.title = title;
    if (description) job.description = description;
    if (company) job.company = company;
    if (location) job.location = location;
    if (salary !== undefined) job.salary = salary;
    if (requirements !== undefined) job.requirements = requirements;
    if (type) job.type = type;
    if (status) job.status = status;
    job.updatedAt = new Date().toISOString();

    await writeData(JOBS_FILE, jobs);

    res.json({
      message: 'Job updated successfully',
      job
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete job posting (employers only)
app.delete('/api/jobs/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'employer') {
      return res.status(403).json({ error: 'Only employers can delete jobs' });
    }

    const jobId = req.params.id;
    const jobs = await readData(JOBS_FILE);
    const job = jobs.find(j => j.id === jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.postedBy !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own jobs' });
    }

    // Remove job from array
    const filteredJobs = jobs.filter(j => j.id !== jobId);
    await writeData(JOBS_FILE, filteredJobs);

    res.json({
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get jobs posted by current employer
app.get('/api/jobs/employer/my-jobs', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'employer') {
      return res.status(403).json({ error: 'Only employers can access this' });
    }

    const jobs = await readData(JOBS_FILE);
    const myJobs = jobs.filter(job => job.postedBy === req.user.id);
    res.json(myJobs);
  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Apply for a job (job seekers only)
app.post('/api/jobs/:id/apply', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'jobseeker') {
      return res.status(403).json({ error: 'Only job seekers can apply for jobs' });
    }

    const { coverLetter } = req.body;
    const jobId = req.params.id;

    const jobs = await readData(JOBS_FILE);
    const job = jobs.find(j => j.id === jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'active') {
      return res.status(400).json({ error: 'This job is no longer accepting applications' });
    }

    const applications = await readData(APPLICATIONS_FILE);
    const users = await readData(USERS_FILE);
    const applicant = users.find(u => u.id === req.user.id);

    // Check if already applied
    const alreadyApplied = applications.find(
      app => app.jobId === jobId && app.applicantId === req.user.id
    );

    if (alreadyApplied) {
      return res.status(400).json({ error: 'You have already applied for this job' });
    }

    const newApplication = {
      id: Date.now().toString(),
      jobId,
      applicantId: req.user.id,
      applicantName: applicant.name,
      applicantEmail: applicant.email,
      coverLetter: coverLetter || '',
      status: 'pending',
      appliedAt: new Date().toISOString()
    };

    applications.push(newApplication);
    await writeData(APPLICATIONS_FILE, applications);

    res.status(201).json({
      message: 'Application submitted successfully',
      application: newApplication
    });
  } catch (error) {
    console.error('Application error:', error);
    res.status(500).json({ error: 'Server error while submitting application' });
  }
});

// Get applications for a job (employers only)
app.get('/api/jobs/:id/applications', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'employer') {
      return res.status(403).json({ error: 'Only employers can view applications' });
    }

    const jobs = await readData(JOBS_FILE);
    const job = jobs.find(j => j.id === req.params.id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.postedBy !== req.user.id) {
      return res.status(403).json({ error: 'You can only view applications for your own jobs' });
    }

    const applications = await readData(APPLICATIONS_FILE);
    const users = await readData(USERS_FILE);
    
    // Enrich applications with applicant details
    const jobApplications = applications
      .filter(app => app.jobId === req.params.id)
      .map(app => {
        const applicant = users.find(u => u.id === app.applicantId);
        if (applicant) {
          return {
            ...app,
            applicantDetails: {
              phone: applicant.phone || '',
              location: applicant.location || '',
              education: applicant.education || '',
              experience: applicant.experience || '',
              skills: applicant.skills || '',
              employmentStatus: applicant.employmentStatus || '',
              resume: applicant.resume || ''
            }
          };
        }
        return app;
      });

    res.json(jobApplications);
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get applications by current job seeker
app.get('/api/applications/my-applications', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'jobseeker') {
      return res.status(403).json({ error: 'Only job seekers can access this' });
    }

    const applications = await readData(APPLICATIONS_FILE);
    const jobs = await readData(JOBS_FILE);
    const myApplications = applications
      .filter(app => app.applicantId === req.user.id)
      .map(app => {
        const job = jobs.find(j => j.id === app.jobId);
        return {
          ...app,
          job: job || null
        };
      });

    res.json(myApplications);
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update application status (approve/reject) - employers only
app.patch('/api/applications/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'employer') {
      return res.status(403).json({ error: 'Only employers can update application status' });
    }

    const { status } = req.body;
    const applicationId = req.params.id;

    if (!status || !['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be pending, accepted, or rejected' });
    }

    const applications = await readData(APPLICATIONS_FILE);
    const application = applications.find(app => app.id === applicationId);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Verify the employer owns the job
    const jobs = await readData(JOBS_FILE);
    const job = jobs.find(j => j.id === application.jobId);

    if (!job || job.postedBy !== req.user.id) {
      return res.status(403).json({ error: 'You can only update applications for your own jobs' });
    }

    // Update application status
    application.status = status;
    application.reviewedAt = new Date().toISOString();
    application.reviewedBy = req.user.id;

    await writeData(APPLICATIONS_FILE, applications);

    res.json({
      message: `Application ${status} successfully`,
      application
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin routes - Get all jobs with application counts
app.get('/api/admin/jobs', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Only admins can access this' });
    }

    const jobs = await readData(JOBS_FILE);
    const applications = await readData(APPLICATIONS_FILE);
    const users = await readData(USERS_FILE);

    // Enrich jobs with application counts and employer info
    const jobsWithStats = jobs.map(job => {
      const jobApplications = applications.filter(app => app.jobId === job.id);
      const employer = users.find(u => u.id === job.postedBy);
      
      return {
        ...job,
        applicationCount: jobApplications.length,
        pendingApplications: jobApplications.filter(app => app.status === 'pending').length,
        acceptedApplications: jobApplications.filter(app => app.status === 'accepted').length,
        rejectedApplications: jobApplications.filter(app => app.status === 'rejected').length,
        employerName: employer ? employer.name : 'Unknown',
        employerEmail: employer ? employer.email : 'Unknown'
      };
    });

    res.json(jobsWithStats);
  } catch (error) {
    console.error('Admin get jobs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin routes - Get all users
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Only admins can access this' });
    }

    const users = await readData(USERS_FILE);
    const jobs = await readData(JOBS_FILE);
    const applications = await readData(APPLICATIONS_FILE);

    // Enrich users with statistics
    const usersWithStats = users.map(user => {
      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        phone: user.phone || '',
        location: user.location || '',
        createdAt: user.createdAt
      };

      if (user.userType === 'jobseeker') {
        const userApplications = applications.filter(app => app.applicantId === user.id);
        userResponse.totalApplications = userApplications.length;
        userResponse.pendingApplications = userApplications.filter(app => app.status === 'pending').length;
        userResponse.acceptedApplications = userApplications.filter(app => app.status === 'accepted').length;
      } else if (user.userType === 'employer') {
        const userJobs = jobs.filter(job => job.postedBy === user.id);
        userResponse.totalJobsPosted = userJobs.length;
        userResponse.companyName = user.companyName || '';
      }

      return userResponse;
    });

    res.json(usersWithStats);
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
async function startServer() {
  await initializeData();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

