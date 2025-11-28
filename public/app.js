// API Base URL
const API_BASE = '/api';

// State management
let currentUser = null;
let currentToken = null;
let allJobs = []; // Store all jobs for filtering

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
    loadHomePage();
});

// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        currentToken = token;
        currentUser = JSON.parse(user);
        updateNavigation();
        loadHomePage();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.getElementById('homeLink').addEventListener('click', (e) => {
        e.preventDefault();
        loadHomePage();
    });
    
    document.getElementById('loginLink').addEventListener('click', (e) => {
        e.preventDefault();
        showLogin();
    });
    
    document.getElementById('registerLink').addEventListener('click', (e) => {
        e.preventDefault();
        showRegister();
    });
    
    document.getElementById('logoutLink').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
    
    document.getElementById('jobsLink').addEventListener('click', (e) => {
        e.preventDefault();
        loadJobSeekerDashboard();
    });
    
    document.getElementById('postJobLink').addEventListener('click', (e) => {
        e.preventDefault();
        showPostJobForm();
    });
    
    document.getElementById('myJobsLink').addEventListener('click', (e) => {
        e.preventDefault();
        loadEmployerDashboard();
    });
    
    document.getElementById('myApplicationsLink').addEventListener('click', (e) => {
        e.preventDefault();
        loadMyApplications();
    });
    
    document.getElementById('adminDashboardLink').addEventListener('click', (e) => {
        e.preventDefault();
        loadAdminDashboard();
    });
    
    // Forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('postJobForm').addEventListener('submit', handlePostJob);
    
    // User type change
    document.getElementById('userType').addEventListener('change', (e) => {
        const jobSeekerFields = document.getElementById('jobSeekerFields');
        const employerFields = document.getElementById('employerFields');
        const companyNameInput = document.getElementById('registerCompanyName');
        
        if (e.target.value === 'employer') {
            jobSeekerFields.style.display = 'none';
            employerFields.style.display = 'block';
            if (companyNameInput) companyNameInput.required = true;
        } else if (e.target.value === 'jobseeker') {
            jobSeekerFields.style.display = 'block';
            employerFields.style.display = 'none';
            if (companyNameInput) companyNameInput.required = false;
        } else if (e.target.value === 'admin') {
            jobSeekerFields.style.display = 'none';
            employerFields.style.display = 'none';
            if (companyNameInput) companyNameInput.required = false;
        } else {
            jobSeekerFields.style.display = 'none';
            employerFields.style.display = 'none';
            if (companyNameInput) companyNameInput.required = false;
        }
    });
    
    // Real-time password confirmation validation
    const confirmPasswordInput = document.getElementById('registerConfirmPassword');
    const passwordInput = document.getElementById('registerPassword');
    const passwordMatchError = document.getElementById('passwordMatchError');
    
    confirmPasswordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (confirmPassword.length > 0) {
            if (password !== confirmPassword) {
                passwordMatchError.textContent = 'Passwords do not match';
                passwordMatchError.style.display = 'block';
                confirmPasswordInput.style.borderColor = 'var(--danger-color)';
            } else {
                passwordMatchError.style.display = 'none';
                confirmPasswordInput.style.borderColor = 'var(--success-color)';
            }
        } else {
            passwordMatchError.style.display = 'none';
            confirmPasswordInput.style.borderColor = 'var(--border-color)';
        }
    });
    
    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (confirmPassword.length > 0) {
            if (password !== confirmPassword) {
                passwordMatchError.textContent = 'Passwords do not match';
                passwordMatchError.style.display = 'block';
                confirmPasswordInput.style.borderColor = 'var(--danger-color)';
            } else {
                passwordMatchError.style.display = 'none';
                confirmPasswordInput.style.borderColor = 'var(--success-color)';
            }
        }
    });
    
    // Update email body when Calendly link changes
    const emailCalendlyLinkInput = document.getElementById('emailCalendlyLink');
    if (emailCalendlyLinkInput) {
        emailCalendlyLinkInput.addEventListener('input', () => {
            const emailBody = document.getElementById('emailBody');
            if (emailBody && currentApplicationData) {
                const calendlyLink = emailCalendlyLinkInput.value || '[Your Calendly Link]';
                const currentBody = emailBody.value;
                // Update the Calendly link in the email body
                const updatedBody = currentBody.replace(/https?:\/\/[^\s]+|\[Your Calendly Link\]/g, calendlyLink);
                emailBody.value = updatedBody;
            }
        });
    }
}

// Show specific page
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    document.getElementById(pageId).style.display = 'block';
}

// Load home page (shows dashboard if logged in, hero if not)
function loadHomePage() {
    showPage('homePage');
    
    if (currentUser) {
        // Show dashboard for logged-in users
        document.getElementById('homeGuestView').style.display = 'none';
        document.getElementById('homeDashboardView').style.display = 'block';
        loadDashboardContent();
    } else {
        // Show hero for guests
        document.getElementById('homeGuestView').style.display = 'block';
        document.getElementById('homeDashboardView').style.display = 'none';
    }
}

// Load dashboard content based on user type
async function loadDashboardContent() {
    if (!currentUser) return;
    
    if (currentUser.userType === 'admin') {
        // Show admin dashboard on home page
        document.getElementById('homeAdminDashboard').style.display = 'block';
        document.getElementById('homeJobSeekerDashboard').style.display = 'none';
        document.getElementById('homeEmployerDashboard').style.display = 'none';
        await loadHomeAdminDashboard();
    } else if (currentUser.userType === 'jobseeker') {
        document.getElementById('homeAdminDashboard').style.display = 'none';
        document.getElementById('homeJobSeekerDashboard').style.display = 'block';
        document.getElementById('homeEmployerDashboard').style.display = 'none';
        // Set user name and type
        document.getElementById('dashboardUserName').textContent = currentUser.name;
        document.getElementById('dashboardUserType').textContent = 'Job Seeker';
        await loadJobSeekerDashboardStats();
    } else {
        document.getElementById('homeAdminDashboard').style.display = 'none';
        document.getElementById('homeJobSeekerDashboard').style.display = 'none';
        document.getElementById('homeEmployerDashboard').style.display = 'block';
        // Set user name and type
        document.getElementById('dashboardUserName').textContent = currentUser.name;
        document.getElementById('dashboardUserType').textContent = 'Employer';
        await loadEmployerDashboardStats();
    }
}

// Load admin dashboard on home page
async function loadHomeAdminDashboard() {
    if (!currentUser || currentUser.userType !== 'admin') return;
    
    try {
        // Load jobs with application counts
        const jobsResponse = await fetch(`${API_BASE}/admin/jobs`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        // Load users for statistics
        const usersResponse = await fetch(`${API_BASE}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (jobsResponse.ok && usersResponse.ok) {
            const jobs = await jobsResponse.json();
            const users = await usersResponse.json();
            
            // Set user name
            document.getElementById('dashboardUserName').textContent = currentUser.name;
            
            // Update statistics
            document.getElementById('homeAdminTotalJobs').textContent = jobs.length;
            const totalApplications = jobs.reduce((sum, job) => sum + job.applicationCount, 0);
            document.getElementById('homeAdminTotalApplications').textContent = totalApplications;
            document.getElementById('homeAdminTotalEmployers').textContent = users.filter(u => u.userType === 'employer').length;
            document.getElementById('homeAdminTotalJobSeekers').textContent = users.filter(u => u.userType === 'jobseeker').length;
            
            // Populate jobs table
            const tableBody = document.getElementById('homeAdminJobsTable');
            if (jobs.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 2rem;">No jobs posted yet.</td></tr>';
            } else {
                tableBody.innerHTML = jobs.map(job => `
                    <tr>
                        <td><strong>${job.title}</strong></td>
                        <td>${job.company}</td>
                        <td>${job.location}</td>
                        <td>${job.employerName}<br><small style="color: var(--text-secondary);">${job.employerEmail}</small></td>
                        <td>${job.type}</td>
                        <td><span class="status ${job.status}">${job.status.toUpperCase()}</span></td>
                        <td><strong>${job.applicationCount}</strong></td>
                        <td>${job.pendingApplications}</td>
                        <td style="color: var(--success-color);">${job.acceptedApplications}</td>
                        <td>${new Date(job.createdAt).toLocaleDateString()}</td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
    }
}

// Load job seeker dashboard stats
async function loadJobSeekerDashboardStats() {
    try {
        const response = await fetch(`${API_BASE}/applications/my-applications`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (response.ok) {
            const applications = await response.json();
            const total = applications.length;
            const pending = applications.filter(app => app.status === 'pending').length;
            const accepted = applications.filter(app => app.status === 'accepted').length;
            
            document.getElementById('totalApplications').textContent = total;
            document.getElementById('pendingApplications').textContent = pending;
            document.getElementById('acceptedApplications').textContent = accepted;
            
            // Show recent applications (last 3)
            const recentApps = applications.slice(0, 3);
            const container = document.getElementById('recentApplications');
            
            if (recentApps.length === 0) {
                container.innerHTML = '<p>You haven\'t applied to any jobs yet. <a href="#" onclick="loadJobSeekerDashboard(); return false;">Browse jobs</a> to get started!</p>';
            } else {
                container.innerHTML = recentApps.map(app => `
                    <div class="application-card">
                        <h4>${app.job ? app.job.title : 'Job Deleted'}</h4>
                        ${app.job ? `<p class="company">${app.job.company}</p>` : ''}
                        <div class="status ${app.status}">${app.status.toUpperCase()}</div>
                        <p style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">
                            Applied on ${new Date(app.appliedAt).toLocaleDateString()}
                        </p>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading job seeker stats:', error);
    }
}

// Load employer dashboard stats
async function loadEmployerDashboardStats() {
    try {
        const response = await fetch(`${API_BASE}/jobs/employer/my-jobs`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (response.ok) {
            const jobs = await response.json();
            const totalJobs = jobs.length;
            
            // Get all applications for all jobs
            let totalApplications = 0;
            let pendingReviews = 0;
            
            for (const job of jobs) {
                try {
                    const appsResponse = await fetch(`${API_BASE}/jobs/${job.id}/applications`, {
                        headers: {
                            'Authorization': `Bearer ${currentToken}`
                        }
                    });
                    if (appsResponse.ok) {
                        const applications = await appsResponse.json();
                        totalApplications += applications.length;
                        pendingReviews += applications.filter(app => app.status === 'pending').length;
                    }
                } catch (error) {
                    console.error('Error loading applications for job:', error);
                }
            }
            
            document.getElementById('totalJobs').textContent = totalJobs;
            document.getElementById('totalApplicationsReceived').textContent = totalApplications;
            document.getElementById('pendingReviews').textContent = pendingReviews;
            
            // Show recent jobs (last 3)
            const recentJobs = jobs.slice(0, 3);
            const container = document.getElementById('recentJobs');
            
            if (recentJobs.length === 0) {
                container.innerHTML = '<p>You haven\'t posted any jobs yet. <a href="#" onclick="showPostJobForm(); return false;">Post your first job</a> to get started!</p>';
            } else {
                container.innerHTML = recentJobs.map(job => `
                    <div class="job-card" onclick="viewJobApplications('${job.id}')">
                        <h3>${job.title}</h3>
                        <div class="company">${job.company}</div>
                        <div class="location">📍 ${job.location}</div>
                        <div class="type">${job.type}</div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading employer stats:', error);
    }
}

// Update navigation based on user type
function updateNavigation() {
    const loginLink = document.getElementById('loginLink');
    const registerLink = document.getElementById('registerLink');
    const logoutLink = document.getElementById('logoutLink');
    const jobsLink = document.getElementById('jobsLink');
    const postJobLink = document.getElementById('postJobLink');
    const myJobsLink = document.getElementById('myJobsLink');
    const myApplicationsLink = document.getElementById('myApplicationsLink');
    const adminDashboardLink = document.getElementById('adminDashboardLink');
    const profileLink = document.getElementById('profileLink');
    
    if (currentUser) {
        loginLink.style.display = 'none';
        registerLink.style.display = 'none';
        logoutLink.style.display = 'block';
        
        if (currentUser.userType === 'admin') {
            adminDashboardLink.style.display = 'block';
            jobsLink.style.display = 'none';
            myApplicationsLink.style.display = 'none';
            postJobLink.style.display = 'none';
            myJobsLink.style.display = 'none';
        } else if (currentUser.userType === 'jobseeker') {
            jobsLink.style.display = 'block';
            myApplicationsLink.style.display = 'block';
            postJobLink.style.display = 'none';
            myJobsLink.style.display = 'none';
            adminDashboardLink.style.display = 'none';
        } else {
            jobsLink.style.display = 'none';
            myApplicationsLink.style.display = 'none';
            postJobLink.style.display = 'block';
            myJobsLink.style.display = 'block';
            adminDashboardLink.style.display = 'none';
        }
    } else {
        loginLink.style.display = 'block';
        registerLink.style.display = 'block';
        logoutLink.style.display = 'none';
        jobsLink.style.display = 'none';
        postJobLink.style.display = 'none';
        myJobsLink.style.display = 'none';
        myApplicationsLink.style.display = 'none';
        adminDashboardLink.style.display = 'none';
    }
}

// Show login page
function showLogin() {
    showPage('loginPage');
}

// Show register page
function showRegister() {
    showPage('registerPage');
    // Reset form and clear any error messages
    document.getElementById('registerForm').reset();
    document.getElementById('passwordMatchError').style.display = 'none';
    document.getElementById('registerPassword').style.borderColor = 'var(--border-color)';
    document.getElementById('registerConfirmPassword').style.borderColor = 'var(--border-color)';
    // Hide user type specific fields
    document.getElementById('jobSeekerFields').style.display = 'none';
    document.getElementById('employerFields').style.display = 'none';
    // Scroll to top of form
    document.getElementById('registerPage').scrollTop = 0;
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentToken = data.token;
            currentUser = data.user;
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showToast('Login successful!', 'success');
            updateNavigation();
            loadHomePage();
        } else {
            showToast(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Login error:', error);
    }
}

// Handle register
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const phone = document.getElementById('registerPhone').value;
    const location = document.getElementById('registerLocation').value;
    const userType = document.getElementById('userType').value;
    const passwordMatchError = document.getElementById('passwordMatchError');
    
    // Validate password match
    if (password !== confirmPassword) {
        passwordMatchError.textContent = 'Passwords do not match';
        passwordMatchError.style.display = 'block';
        document.getElementById('registerConfirmPassword').style.borderColor = 'var(--danger-color)';
        return;
    } else {
        passwordMatchError.style.display = 'none';
        document.getElementById('registerConfirmPassword').style.borderColor = 'var(--success-color)';
    }
    
    // Validate password length
    if (password.length < 6) {
        passwordMatchError.textContent = 'Password must be at least 6 characters long';
        passwordMatchError.style.display = 'block';
        document.getElementById('registerPassword').style.borderColor = 'var(--danger-color)';
        document.getElementById('registerConfirmPassword').style.borderColor = 'var(--border-color)';
        return;
    } else {
        document.getElementById('registerPassword').style.borderColor = 'var(--border-color)';
    }
    
    // Collect user type specific fields
    let additionalData = {
        location
    };
    
    if (userType === 'jobseeker') {
        additionalData.education = document.getElementById('registerEducation').value || '';
        additionalData.experience = document.getElementById('registerExperience').value || '';
        additionalData.skills = document.getElementById('registerSkills').value || '';
        additionalData.employmentStatus = document.getElementById('registerEmploymentStatus').value || '';
        additionalData.resume = document.getElementById('registerResume').value || '';
    } else if (userType === 'employer') {
        additionalData.companyName = document.getElementById('registerCompanyName').value;
        additionalData.companyWebsite = document.getElementById('registerCompanyWebsite').value || '';
        additionalData.industry = document.getElementById('registerIndustry').value || '';
        additionalData.companySize = document.getElementById('registerCompanySize').value || '';
        additionalData.companyDescription = document.getElementById('registerCompanyDescription').value || '';
        additionalData.calendlyLink = document.getElementById('registerCalendlyLink').value || '';
    }
    
    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                password,
                phone,
                location,
                userType,
                ...additionalData
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Registration successful! Please login to continue.', 'success');
            // Clear the registration form
            document.getElementById('registerForm').reset();
            document.getElementById('passwordMatchError').style.display = 'none';
            document.getElementById('registerPassword').style.borderColor = 'var(--border-color)';
            document.getElementById('registerConfirmPassword').style.borderColor = 'var(--border-color)';
            document.getElementById('jobSeekerFields').style.display = 'none';
            document.getElementById('employerFields').style.display = 'none';
            // Pre-fill email in login form and redirect to login
            document.getElementById('loginEmail').value = email;
            // Redirect to login page after a short delay
            setTimeout(() => {
                showLogin();
            }, 1500);
        } else {
            showToast(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Registration error:', error);
    }
}

// Logout
function logout() {
    currentUser = null;
    currentToken = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateNavigation();
    loadHomePage();
    showToast('Logged out successfully', 'success');
}

// Load appropriate dashboard (for navigation to specific dashboards)
function loadDashboard() {
    if (!currentUser) {
        loadHomePage();
        return;
    }
    
    if (currentUser.userType === 'admin') {
        loadAdminDashboard();
    } else if (currentUser.userType === 'jobseeker') {
        loadJobSeekerDashboard();
    } else {
        loadEmployerDashboard();
    }
}

// Load admin dashboard
async function loadAdminDashboard() {
    if (!currentUser || currentUser.userType !== 'admin') return;
    
    showPage('adminDashboardPage');
    
    try {
        // Load jobs with application counts
        const jobsResponse = await fetch(`${API_BASE}/admin/jobs`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        // Load users for statistics
        const usersResponse = await fetch(`${API_BASE}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (jobsResponse.ok && usersResponse.ok) {
            const jobs = await jobsResponse.json();
            const users = await usersResponse.json();
            
            // Update statistics
            document.getElementById('adminTotalJobs').textContent = jobs.length;
            const totalApplications = jobs.reduce((sum, job) => sum + job.applicationCount, 0);
            document.getElementById('adminTotalApplications').textContent = totalApplications;
            document.getElementById('adminTotalEmployers').textContent = users.filter(u => u.userType === 'employer').length;
            document.getElementById('adminTotalJobSeekers').textContent = users.filter(u => u.userType === 'jobseeker').length;
            
            // Populate jobs table
            const tableBody = document.getElementById('adminJobsTable');
            if (jobs.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 2rem;">No jobs posted yet.</td></tr>';
            } else {
                tableBody.innerHTML = jobs.map(job => `
                    <tr>
                        <td><strong>${job.title}</strong></td>
                        <td>${job.company}</td>
                        <td>${job.location}</td>
                        <td>${job.employerName}<br><small style="color: var(--text-secondary);">${job.employerEmail}</small></td>
                        <td>${job.type}</td>
                        <td><span class="status ${job.status}">${job.status.toUpperCase()}</span></td>
                        <td><strong>${job.applicationCount}</strong></td>
                        <td>${job.pendingApplications}</td>
                        <td style="color: var(--success-color);">${job.acceptedApplications}</td>
                        <td>${new Date(job.createdAt).toLocaleDateString()}</td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        showToast('Error loading admin dashboard', 'error');
        console.error('Error:', error);
    }
}

// Load job seeker dashboard
async function loadJobSeekerDashboard() {
    if (!currentUser || currentUser.userType !== 'jobseeker') return;
    
    showPage('jobSeekerDashboard');
    
    try {
        const response = await fetch(`${API_BASE}/jobs`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        const jobs = await response.json();
        allJobs = jobs; // Store all jobs for filtering
        
        // Populate location filter
        const locations = [...new Set(jobs.map(job => job.location).filter(Boolean))].sort();
        const locationFilter = document.getElementById('filterLocation');
        locationFilter.innerHTML = '<option value="">All Locations</option>';
        locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            locationFilter.appendChild(option);
        });
        
        filterJobs(); // Display filtered jobs
    } catch (error) {
        showToast('Error loading jobs', 'error');
        console.error('Error loading jobs:', error);
    }
}

// Filter jobs based on search and filters
function filterJobs() {
    const searchTerm = document.getElementById('jobSearchInput').value.toLowerCase();
    const locationFilter = document.getElementById('filterLocation').value;
    const typeFilter = document.getElementById('filterType').value;
    const salaryFilter = document.getElementById('filterSalary').value;
    
    let filteredJobs = allJobs.filter(job => {
        // Search filter
        const matchesSearch = !searchTerm || 
            job.title.toLowerCase().includes(searchTerm) ||
            job.company.toLowerCase().includes(searchTerm) ||
            job.description.toLowerCase().includes(searchTerm) ||
            job.location.toLowerCase().includes(searchTerm);
        
        // Location filter
        const matchesLocation = !locationFilter || job.location === locationFilter;
        
        // Type filter
        const matchesType = !typeFilter || job.type === typeFilter;
        
        // Salary filter (basic parsing)
        let matchesSalary = true;
        if (salaryFilter) {
            const salaryStr = job.salary.toLowerCase();
            if (salaryFilter === '0-30000') {
                matchesSalary = salaryStr.includes('0') || salaryStr.includes('20') || salaryStr.includes('30');
            } else if (salaryFilter === '30000-50000') {
                matchesSalary = salaryStr.includes('30') || salaryStr.includes('40') || salaryStr.includes('50');
            } else if (salaryFilter === '50000-70000') {
                matchesSalary = salaryStr.includes('50') || salaryStr.includes('60') || salaryStr.includes('70');
            } else if (salaryFilter === '70000+') {
                matchesSalary = salaryStr.includes('70') || salaryStr.includes('80') || salaryStr.includes('90') || salaryStr.includes('100');
            }
        }
        
        return matchesSearch && matchesLocation && matchesType && matchesSalary;
    });
    
    // Update jobs count
    const jobsCount = document.getElementById('jobsCount');
    jobsCount.textContent = `Showing ${filteredJobs.length} of ${allJobs.length} jobs`;
    
    displayJobs(filteredJobs, 'jobsList');
}

// Clear all filters
function clearFilters() {
    document.getElementById('jobSearchInput').value = '';
    document.getElementById('filterLocation').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterSalary').value = '';
    filterJobs();
}

// Load employer dashboard
async function loadEmployerDashboard() {
    if (!currentUser || currentUser.userType !== 'employer') return;
    
    showPage('employerDashboard');
    
    try {
        const response = await fetch(`${API_BASE}/jobs/employer/my-jobs`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        const jobs = await response.json();
        displayJobs(jobs, 'myJobsList', true);
    } catch (error) {
        showToast('Error loading jobs', 'error');
        console.error('Error loading jobs:', error);
    }
}

// Display jobs
function displayJobs(jobs, containerId, isEmployer = false) {
    const container = document.getElementById(containerId);
    
    if (jobs.length === 0) {
        container.innerHTML = '<p>No jobs found.</p>';
        return;
    }
    
    container.innerHTML = jobs.map(job => `
        <div class="job-card">
            <div onclick="${isEmployer ? `viewJobApplications('${job.id}')` : `viewJobDetails('${job.id}')`}">
                <h3>${job.title}</h3>
                <div class="company">${job.company}</div>
                <div class="location">📍 ${job.location}</div>
                <div class="salary">💰 ${job.salary}</div>
                <div class="type">${job.type}</div>
                ${job.status && job.status !== 'active' ? `<div class="status ${job.status}" style="margin-top: 0.5rem; display: inline-block; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600; background-color: #fee2e2; color: #991b1b;">${job.status.toUpperCase()}</div>` : ''}
                <div class="description">${job.description}</div>
            </div>
            ${isEmployer ? `
            <div class="job-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                <button class="btn btn-primary" style="flex: 1;" onclick="event.stopPropagation(); openEditJobModal('${job.id}')">Edit</button>
                <button class="btn btn-danger" style="flex: 1;" onclick="event.stopPropagation(); deleteJob('${job.id}')">Delete</button>
            </div>
            ` : ''}
        </div>
    `).join('');
}

// View job details
async function viewJobDetails(jobId) {
    try {
        const response = await fetch(`${API_BASE}/jobs/${jobId}`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        const job = await response.json();
        
        const modalContent = document.getElementById('jobModalContent');
        modalContent.innerHTML = `
            <div class="job-details">
                <h2>${job.title}</h2>
                <div class="detail-item">
                    <div class="detail-label">Company</div>
                    <div class="detail-value">${job.company}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Location</div>
                    <div class="detail-value">${job.location}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Salary</div>
                    <div class="detail-value">${job.salary}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Job Type</div>
                    <div class="detail-value">${job.type}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Description</div>
                    <div class="detail-value">${job.description}</div>
                </div>
                ${job.requirements && job.requirements.length > 0 ? `
                <div class="detail-item">
                    <div class="detail-label">Requirements</div>
                    <ul class="requirements">
                        ${job.requirements.map(req => `<li>${req}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                <div class="apply-form">
                    <h3>Apply for this Job</h3>
                    <form id="applyForm">
                        <div class="form-group">
                            <label for="coverLetter">Cover Letter</label>
                            <textarea id="coverLetter" rows="4" placeholder="Tell us why you're a good fit for this position..."></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">Submit Application</button>
                    </form>
                </div>
            </div>
        `;
        
        document.getElementById('jobModal').style.display = 'flex';
        
        // Handle application form
        document.getElementById('applyForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleApply(jobId);
        });
    } catch (error) {
        showToast('Error loading job details', 'error');
        console.error('Error:', error);
    }
}

// Handle job application
async function handleApply(jobId) {
    const coverLetter = document.getElementById('coverLetter').value;
    
    try {
        const response = await fetch(`${API_BASE}/jobs/${jobId}/apply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ coverLetter })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Application submitted successfully!', 'success');
            closeJobModal();
        } else {
            showToast(data.error || 'Failed to submit application', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Application error:', error);
    }
}

// View job applications (for employers)
async function viewJobApplications(jobId) {
    try {
        const response = await fetch(`${API_BASE}/jobs/${jobId}/applications`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        const applications = await response.json();
        
        showPage('jobApplicationsPage');
        
        const container = document.getElementById('jobApplicationsList');
        
        // Store jobId for refresh after status update
        container.dataset.jobId = jobId;
        
        if (applications.length === 0) {
            container.innerHTML = '<p>No applications yet.</p>';
            return;
        }
        
        container.innerHTML = applications.map(app => {
            const details = app.applicantDetails || {};
            return `
            <div class="application-card">
                <h3>${app.applicantName}</h3>
                <div class="detail-item">
                    <div class="detail-label">Email</div>
                    <div class="detail-value">${app.applicantEmail}</div>
                </div>
                ${details.phone ? `
                <div class="detail-item">
                    <div class="detail-label">Phone</div>
                    <div class="detail-value">${details.phone}</div>
                </div>
                ` : ''}
                ${details.location ? `
                <div class="detail-item">
                    <div class="detail-label">Location</div>
                    <div class="detail-value">${details.location}</div>
                </div>
                ` : ''}
                ${details.education ? `
                <div class="detail-item">
                    <div class="detail-label">Education</div>
                    <div class="detail-value">${details.education}</div>
                </div>
                ` : ''}
                ${details.experience ? `
                <div class="detail-item">
                    <div class="detail-label">Experience</div>
                    <div class="detail-value">${details.experience} years</div>
                </div>
                ` : ''}
                ${details.skills ? `
                <div class="detail-item">
                    <div class="detail-label">Skills</div>
                    <div class="detail-value">${details.skills}</div>
                </div>
                ` : ''}
                ${details.employmentStatus ? `
                <div class="detail-item">
                    <div class="detail-label">Employment Status</div>
                    <div class="detail-value">${details.employmentStatus}</div>
                </div>
                ` : ''}
                <div class="detail-item">
                    <div class="detail-label">Cover Letter</div>
                    <div class="detail-value">${app.coverLetter || 'No cover letter provided'}</div>
                </div>
                ${details.resume ? `
                <div class="detail-item">
                    <div class="detail-label">Resume</div>
                    <div class="detail-value"><a href="${details.resume}" target="_blank" rel="noopener noreferrer">View Resume</a></div>
                </div>
                ` : ''}
                <div class="detail-item">
                    <div class="detail-label">Applied On</div>
                    <div class="detail-value">${new Date(app.appliedAt).toLocaleDateString()}</div>
                </div>
                ${app.reviewedAt ? `
                <div class="detail-item">
                    <div class="detail-label">Reviewed On</div>
                    <div class="detail-value">${new Date(app.reviewedAt).toLocaleDateString()}</div>
                </div>
                ` : ''}
                <div class="status ${app.status}">${app.status.toUpperCase()}</div>
                ${app.status === 'pending' ? `
                <div class="application-actions">
                    <button class="btn btn-success" onclick="openEmailSender('${app.id}', '${app.applicantEmail}', '${app.applicantName}', '${jobId}')">✓ Approve & Send Email</button>
                    <button class="btn btn-danger" onclick="updateApplicationStatus('${app.id}', 'rejected', '${jobId}')">✗ Reject</button>
                </div>
                ` : ''}
            </div>
        `;
        }).join('');
    } catch (error) {
        showToast('Error loading applications', 'error');
        console.error('Error:', error);
    }
}

// Store current application data for email sender
let currentApplicationData = null;

// Open email sender modal for approved application
async function openEmailSender(applicationId, applicantEmail, applicantName, jobId) {
    // Store application data
    currentApplicationData = {
        applicationId,
        applicantEmail,
        applicantName,
        jobId
    };
    
    // Get employer's Calendly link from profile
    let calendlyLink = '';
    try {
        const profileResponse = await fetch(`${API_BASE}/profile`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        if (profileResponse.ok) {
            const profile = await profileResponse.json();
            calendlyLink = profile.calendlyLink || '';
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
    
    // Get job details for email template
    let jobTitle = 'the position';
    try {
        const jobResponse = await fetch(`${API_BASE}/jobs/${jobId}`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        if (jobResponse.ok) {
            const job = await jobResponse.json();
            jobTitle = job.title;
        }
    } catch (error) {
        console.error('Error fetching job:', error);
    }
    
    // Pre-fill email form
    document.getElementById('emailTo').value = applicantEmail;
    document.getElementById('emailSubject').value = `Interview Invitation - ${jobTitle}`;
    document.getElementById('emailCalendlyLink').value = calendlyLink;
    
    // Pre-fill email body with template
    const emailTemplate = `Dear ${applicantName},

Congratulations! We are pleased to inform you that your application for the ${jobTitle} position has been accepted.

We were impressed with your qualifications and experience, and we would like to invite you for an interview to discuss this opportunity further.

Please use the following link to schedule a convenient time for your interview:

${calendlyLink || '[Your Calendly Link]'}

We look forward to speaking with you soon.

Best regards,
${currentUser.name}
${currentUser.companyName || ''}`;
    
    document.getElementById('emailBody').value = emailTemplate;
    
    // Show email modal
    document.getElementById('emailModal').style.display = 'flex';
}

// Close email modal
function closeEmailModal() {
    document.getElementById('emailModal').style.display = 'none';
    currentApplicationData = null;
}

// Open default email client
function openEmailClient() {
    const to = document.getElementById('emailTo').value;
    const subject = encodeURIComponent(document.getElementById('emailSubject').value);
    const body = encodeURIComponent(document.getElementById('emailBody').value);
    
    const mailtoLink = `mailto:${to}?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
    
    // After opening email client, approve the application
    if (currentApplicationData) {
        approveApplicationAfterEmail();
    }
}

// Copy email to clipboard
async function copyEmailToClipboard() {
    const to = document.getElementById('emailTo').value;
    const subject = document.getElementById('emailSubject').value;
    const body = document.getElementById('emailBody').value;
    
    const emailText = `To: ${to}\nSubject: ${subject}\n\n${body}`;
    
    try {
        await navigator.clipboard.writeText(emailText);
        showToast('Email copied to clipboard!', 'success');
        
        // After copying, approve the application
        if (currentApplicationData) {
            approveApplicationAfterEmail();
        }
    } catch (error) {
        showToast('Failed to copy to clipboard', 'error');
        console.error('Copy error:', error);
    }
}

// Approve application after email is sent
async function approveApplicationAfterEmail() {
    if (!currentApplicationData) return;
    
    const { applicationId, jobId } = currentApplicationData;
    
    try {
        const response = await fetch(`${API_BASE}/applications/${applicationId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ status: 'accepted' })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Application approved successfully!', 'success');
            closeEmailModal();
            // Reload applications to show updated status
            await viewJobApplications(jobId);
        } else {
            showToast(data.error || 'Failed to approve application', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Update application status error:', error);
    }
}

// Update application status (approve/reject)
async function updateApplicationStatus(applicationId, status, jobId) {
    if (!confirm(`Are you sure you want to ${status === 'accepted' ? 'approve' : 'reject'} this application?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/applications/${applicationId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ status })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast(`Application ${status === 'accepted' ? 'approved' : 'rejected'} successfully!`, 'success');
            // Reload applications to show updated status
            await viewJobApplications(jobId);
        } else {
            showToast(data.error || 'Failed to update application status', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Update application status error:', error);
    }
}

// Show post job form
function showPostJobForm() {
    if (!currentUser || currentUser.userType !== 'employer') return;
    
    showPage('postJobPage');
    document.getElementById('postJobForm').reset();
    if (currentUser.companyName) {
        document.getElementById('jobCompany').value = currentUser.companyName;
    }
}

// Handle post job
async function handlePostJob(e) {
    e.preventDefault();
    
    const title = document.getElementById('jobTitle').value;
    const company = document.getElementById('jobCompany').value;
    const location = document.getElementById('jobLocation').value;
    const type = document.getElementById('jobType').value;
    const salary = document.getElementById('jobSalary').value;
    const description = document.getElementById('jobDescription').value;
    const requirements = document.getElementById('jobRequirements').value
        .split('\n')
        .filter(req => req.trim() !== '');
    
    try {
        const response = await fetch(`${API_BASE}/jobs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({
                title,
                company,
                location,
                type,
                salary,
                description,
                requirements
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Job posted successfully!', 'success');
            document.getElementById('postJobForm').reset();
            loadEmployerDashboard();
        } else {
            showToast(data.error || 'Failed to post job', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Post job error:', error);
    }
}

// Load my applications
async function loadMyApplications() {
    if (!currentUser || currentUser.userType !== 'jobseeker') return;
    
    showPage('myApplicationsPage');
    
    try {
        const response = await fetch(`${API_BASE}/applications/my-applications`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        const applications = await response.json();
        
        const container = document.getElementById('myApplicationsList');
        
        if (applications.length === 0) {
            container.innerHTML = '<p>You haven\'t applied to any jobs yet.</p>';
            return;
        }
        
        container.innerHTML = applications.map(app => `
            <div class="application-card">
                <h3>${app.job ? app.job.title : 'Job Deleted'}</h3>
                ${app.job ? `
                <div class="detail-item">
                    <div class="detail-label">Company</div>
                    <div class="detail-value">${app.job.company}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Location</div>
                    <div class="detail-value">${app.job.location}</div>
                </div>
                ` : ''}
                <div class="detail-item">
                    <div class="detail-label">Applied On</div>
                    <div class="detail-value">${new Date(app.appliedAt).toLocaleDateString()}</div>
                </div>
                <div class="status ${app.status}">${app.status.toUpperCase()}</div>
            </div>
        `).join('');
    } catch (error) {
        showToast('Error loading applications', 'error');
        console.error('Error:', error);
    }
}

// Close job modal
function closeJobModal() {
    document.getElementById('jobModal').style.display = 'none';
}

// Load edit profile page
async function loadEditProfile() {
    if (!currentUser) return;
    
    showPage('editProfilePage');
    
    try {
        const response = await fetch(`${API_BASE}/profile`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (response.ok) {
            const profile = await response.json();
            
            // Populate form fields
            document.getElementById('editName').value = profile.name || '';
            document.getElementById('editEmail').value = profile.email || '';
            document.getElementById('editPhone').value = profile.phone || '';
            document.getElementById('editLocation').value = profile.location || '';
            
            if (profile.userType === 'jobseeker') {
                document.getElementById('editJobSeekerFields').style.display = 'block';
                document.getElementById('editEmployerFields').style.display = 'none';
                document.getElementById('editEducation').value = profile.education || '';
                document.getElementById('editExperience').value = profile.experience || '';
                document.getElementById('editSkills').value = profile.skills || '';
                document.getElementById('editEmploymentStatus').value = profile.employmentStatus || '';
                document.getElementById('editResume').value = profile.resume || '';
            } else {
                document.getElementById('editJobSeekerFields').style.display = 'none';
                document.getElementById('editEmployerFields').style.display = 'block';
                document.getElementById('editCompanyName').value = profile.companyName || '';
                document.getElementById('editCompanyWebsite').value = profile.companyWebsite || '';
                document.getElementById('editIndustry').value = profile.industry || '';
                document.getElementById('editCompanySize').value = profile.companySize || '';
                document.getElementById('editCompanyDescription').value = profile.companyDescription || '';
                document.getElementById('editCalendlyLink').value = profile.calendlyLink || '';
            }
        }
    } catch (error) {
        showToast('Error loading profile', 'error');
        console.error('Error:', error);
    }
}

// Handle edit profile
async function handleEditProfile(e) {
    e.preventDefault();
    
    const name = document.getElementById('editName').value;
    const phone = document.getElementById('editPhone').value;
    const location = document.getElementById('editLocation').value;
    
    let updateData = {
        name,
        phone,
        location
    };
    
    if (currentUser.userType === 'jobseeker') {
        updateData.education = document.getElementById('editEducation').value || '';
        updateData.experience = document.getElementById('editExperience').value || '';
        updateData.skills = document.getElementById('editSkills').value || '';
        updateData.employmentStatus = document.getElementById('editEmploymentStatus').value || '';
        updateData.resume = document.getElementById('editResume').value || '';
    } else {
        updateData.companyName = document.getElementById('editCompanyName').value;
        updateData.companyWebsite = document.getElementById('editCompanyWebsite').value || '';
        updateData.industry = document.getElementById('editIndustry').value || '';
        updateData.companySize = document.getElementById('editCompanySize').value || '';
        updateData.companyDescription = document.getElementById('editCompanyDescription').value || '';
        updateData.calendlyLink = document.getElementById('editCalendlyLink').value || '';
    }
    
    try {
        const response = await fetch(`${API_BASE}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(updateData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            localStorage.setItem('user', JSON.stringify(data.user));
            showToast('Profile updated successfully!', 'success');
            loadHomePage();
        } else {
            showToast(data.error || 'Failed to update profile', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Error:', error);
    }
}

// Open edit job modal
async function openEditJobModal(jobId) {
    try {
        const response = await fetch(`${API_BASE}/jobs/${jobId}`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (response.ok) {
            const job = await response.json();
            
            document.getElementById('editJobTitle').value = job.title;
            document.getElementById('editJobCompany').value = job.company;
            document.getElementById('editJobLocation').value = job.location;
            document.getElementById('editJobType').value = job.type;
            document.getElementById('editJobSalary').value = job.salary || '';
            document.getElementById('editJobDescription').value = job.description;
            document.getElementById('editJobRequirements').value = job.requirements ? job.requirements.join('\n') : '';
            document.getElementById('editJobStatus').value = job.status || 'active';
            
            document.getElementById('editJobModal').dataset.jobId = jobId;
            document.getElementById('editJobModal').style.display = 'flex';
        }
    } catch (error) {
        showToast('Error loading job details', 'error');
        console.error('Error:', error);
    }
}

// Close edit job modal
function closeEditJobModal() {
    document.getElementById('editJobModal').style.display = 'none';
    document.getElementById('editJobForm').reset();
}

// Handle update job
async function handleUpdateJob(e) {
    e.preventDefault();
    
    const jobId = document.getElementById('editJobModal').dataset.jobId;
    const title = document.getElementById('editJobTitle').value;
    const company = document.getElementById('editJobCompany').value;
    const location = document.getElementById('editJobLocation').value;
    const type = document.getElementById('editJobType').value;
    const salary = document.getElementById('editJobSalary').value;
    const description = document.getElementById('editJobDescription').value;
    const requirements = document.getElementById('editJobRequirements').value
        .split('\n')
        .filter(req => req.trim() !== '');
    const status = document.getElementById('editJobStatus').value;
    
    try {
        const response = await fetch(`${API_BASE}/jobs/${jobId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({
                title,
                company,
                location,
                type,
                salary,
                description,
                requirements,
                status
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Job updated successfully!', 'success');
            closeEditJobModal();
            loadEmployerDashboard();
        } else {
            showToast(data.error || 'Failed to update job', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Error:', error);
    }
}

// Delete job
async function deleteJob(jobId) {
    if (!confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/jobs/${jobId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Job deleted successfully!', 'success');
            loadEmployerDashboard();
        } else {
            showToast(data.error || 'Failed to delete job', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Error:', error);
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

