/**
 * ========================================
 * Dashboard Controller Logic
 * ========================================
 * Handles fetching data from Firestore, full CRUD operations (adding, updating,
 * deleting courses), live search, category filtering, tab switching, and mobile drawer navigation.
 */

import { 
    auth, 
    db, 
    onAuthStateChanged, 
    signOut, 
    collection, 
    getDocs, 
    doc, 
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    updateProfile
} from './firebase.js';
import { seedInitialUserData } from './data.js';

// Global state variables
let currentUser = null;
let cachedCourses = []; 
let activeFilter = 'all';
let searchQuery = '';

// Active course being edited in the Manage Modal
let currentEditingCourse = null; 

// Chart.js Instances
let gradesChartInstance = null;
let progressChartInstance = null;
let attendanceChartInstance = null;
let gradesChartDetailedInstance = null;
let attendanceChartDetailedInstance = null;

// Wait for the DOM to fully load before attaching event listeners
document.addEventListener('DOMContentLoaded', () => {
    
    // ----------------------------------------------------------------------
    // 1. Theme & Tab Persistence (Dashboard State)
    // ----------------------------------------------------------------------
    const themeSelect = document.getElementById('settings-theme-select');
    const body = document.body;
    
    // Apply saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
    }
    if (themeSelect) themeSelect.value = savedTheme;

    // Theme selector change listener (in settings)
    themeSelect?.addEventListener('change', (e) => {
        const selectedTheme = e.target.value;
        if (selectedTheme === 'dark') {
            body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
        
        // Re-render charts to adjust text color for readability if needed
        triggerChartRebuild();
    });

    // Restore last active tab from localStorage
    const savedTab = localStorage.getItem('activeTab') || 'dashboard';
    const navItems = document.querySelectorAll('.nav-item');
    const tabViews = document.querySelectorAll('.tab-view');

    function switchTab(targetTab) {
        navItems.forEach(item => {
            if (item.getAttribute('data-tab') === targetTab) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        tabViews.forEach(view => {
            view.classList.remove('active');
            if (view.id === `view-${targetTab}`) {
                view.classList.add('active');
            }
        });
        localStorage.setItem('activeTab', targetTab);

        // Fill settings form values when switching to Settings
        if (targetTab === 'settings' && currentUser) {
            const nameInput = document.getElementById('settings-name-input');
            if (nameInput) {
                nameInput.value = currentUser.displayName || currentUser.email.split('@')[0];
            }
        }
    }

    // Switch to saved tab initially
    switchTab(savedTab);

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = item.getAttribute('data-tab');
            switchTab(targetTab);
            closeMobileSidebar();
        });
    });

    // Mobile Navigation Controls
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const closeMobileMenu = document.getElementById('close-mobile-menu');
    const sidebar = document.getElementById('sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');

    function openMobileSidebar() {
        sidebar?.classList.add('open');
        sidebarBackdrop?.classList.add('active');
    }

    function closeMobileSidebar() {
        sidebar?.classList.remove('open');
        sidebarBackdrop?.classList.remove('active');
    }

    mobileMenuToggle?.addEventListener('click', openMobileSidebar);
    closeMobileMenu?.addEventListener('click', closeMobileSidebar);
    sidebarBackdrop?.addEventListener('click', closeMobileSidebar);

    // ----------------------------------------------------------------------
    // 2. Live Search & Filter Chips Event Listeners
    // ----------------------------------------------------------------------
    const searchInput = document.getElementById('search-input');
    searchInput?.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderFilteredCourses();
    });

    const filterChips = document.querySelectorAll('.chip');
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeFilter = chip.getAttribute('data-filter');
            renderFilteredCourses();
        });
    });

    // ----------------------------------------------------------------------
    // 3. Add Course Modal Controls
    // ----------------------------------------------------------------------
    const addCourseModal = document.getElementById('add-course-modal');
    const openAddBtn1 = document.getElementById('open-add-course-btn');
    const openAddBtn2 = document.getElementById('open-add-course-btn-2');
    const addCourseForm = document.getElementById('add-course-form');

    function openAddModal() {
        if (addCourseModal) addCourseModal.style.display = 'flex';
    }

    openAddBtn1?.addEventListener('click', openAddModal);
    openAddBtn2?.addEventListener('click', openAddModal);

    // Close Modal Listeners
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-close');
            const modal = document.getElementById(modalId);
            if (modal) modal.style.display = 'none';
        });
    });

    // Handle Adding New Course to Firestore
    addCourseForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('course-title-input').value.trim();
        const instructor = document.getElementById('course-instructor-input').value.trim();
        const category = document.getElementById('course-category-select').value;
        const totalModules = parseInt(document.getElementById('course-modules-input').value, 10) || 10;

        const newCourseId = `course_${Date.now()}`;
        const newCourse = {
            id: newCourseId,
            title,
            instructor,
            category,
            totalModules,
            modulesCompleted: 0,
            progress: 0,
            status: 'in-progress'
        };

        try {
            const saveBtn = document.getElementById('save-course-btn');
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';

            await setDoc(doc(db, `users/${currentUser.uid}/courses`, newCourseId), newCourse);

            cachedCourses.push(newCourse);
            recalculateMetricsAndUpdateUI();

            addCourseForm.reset();
            addCourseModal.style.display = 'none';
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Course';

        } catch (error) {
            console.error("Error adding new course:", error);
            alert("Failed to add course. Please try again.");
        }
    });

    // ----------------------------------------------------------------------
    // 4. Manage Course / Edit Progress Modal Controls
    // ----------------------------------------------------------------------
    const manageModal = document.getElementById('manage-course-modal');
    const decrementBtn = document.getElementById('decrement-module-btn');
    const incrementBtn = document.getElementById('increment-module-btn');
    const saveProgressBtn = document.getElementById('save-progress-btn');
    const deleteCourseBtn = document.getElementById('delete-course-btn');

    decrementBtn?.addEventListener('click', () => {
        if (currentEditingCourse && currentEditingCourse.modulesCompleted > 0) {
            currentEditingCourse.modulesCompleted--;
            updateManageModalUI();
        }
    });

    incrementBtn?.addEventListener('click', () => {
        if (currentEditingCourse && currentEditingCourse.modulesCompleted < currentEditingCourse.totalModules) {
            currentEditingCourse.modulesCompleted++;
            updateManageModalUI();
        }
    });

    saveProgressBtn?.addEventListener('click', async () => {
        if (!currentEditingCourse || !currentUser) return;

        try {
            saveProgressBtn.disabled = true;
            saveProgressBtn.textContent = 'Saving...';

            const newProgress = Math.round((currentEditingCourse.modulesCompleted / currentEditingCourse.totalModules) * 100);
            const newStatus = newProgress === 100 ? 'completed' : 'in-progress';
            
            currentEditingCourse.progress = newProgress;
            currentEditingCourse.status = newStatus;

            const courseRef = doc(db, `users/${currentUser.uid}/courses`, currentEditingCourse.id);
            await updateDoc(courseRef, {
                modulesCompleted: currentEditingCourse.modulesCompleted,
                progress: newProgress,
                status: newStatus
            });

            const index = cachedCourses.findIndex(c => c.id === currentEditingCourse.id);
            if (index !== -1) {
                cachedCourses[index] = { ...currentEditingCourse };
            }

            recalculateMetricsAndUpdateUI();
            manageModal.style.display = 'none';
            saveProgressBtn.disabled = false;
            saveProgressBtn.textContent = 'Save Changes';

        } catch (error) {
            console.error("Error updating progress:", error);
            alert("Failed to save progress update.");
        }
    });

    deleteCourseBtn?.addEventListener('click', async () => {
        if (!currentEditingCourse || !currentUser) return;
        if (!confirm(`Are you sure you want to delete "${currentEditingCourse.title}"?`)) return;

        try {
            deleteCourseBtn.disabled = true;
            deleteCourseBtn.textContent = 'Deleting...';

            const courseRef = doc(db, `users/${currentUser.uid}/courses`, currentEditingCourse.id);
            await deleteDoc(courseRef);

            cachedCourses = cachedCourses.filter(c => c.id !== currentEditingCourse.id);
            
            recalculateMetricsAndUpdateUI();
            manageModal.style.display = 'none';
            deleteCourseBtn.disabled = false;
            deleteCourseBtn.textContent = 'Delete Course';

        } catch (error) {
            console.error("Error deleting course:", error);
            alert("Failed to delete course.");
        }
    });

    // ----------------------------------------------------------------------
    // 5. Settings profile update & database reset
    // ----------------------------------------------------------------------
    const profileForm = document.getElementById('settings-profile-form');
    const resetDbBtn = document.getElementById('reset-database-btn');

    profileForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newName = document.getElementById('settings-name-input').value.trim();
        const successMsg = document.getElementById('profile-success-msg');
        const saveProfileBtn = document.getElementById('save-profile-btn');

        if (!newName || !currentUser) return;

        try {
            saveProfileBtn.disabled = true;
            saveProfileBtn.textContent = 'Saving...';

            // 1. Update Auth Display Name
            await updateProfile(auth.currentUser, { displayName: newName });
            
            // 2. Update UI Header
            document.getElementById('user-name').textContent = newName;
            document.getElementById('user-avatar').textContent = newName.charAt(0).toUpperCase();

            // Show temporary success message
            if (successMsg) {
                successMsg.style.display = 'inline';
                setTimeout(() => { successMsg.style.display = 'none'; }, 2500);
            }
        } catch (error) {
            console.error("Error updating profile display name:", error);
            alert("Failed to update profile name.");
        } finally {
            saveProfileBtn.disabled = false;
            saveProfileBtn.textContent = 'Save Settings';
        }
    });

    resetDbBtn?.addEventListener('click', async () => {
        if (!currentUser) return;
        if (!confirm("WARNING: This will completely delete all of your current courses and reset your dashboard back to the initial template database setup. Continue?")) return;

        try {
            const loader = document.getElementById('loading-overlay');
            if (loader) {
                loader.style.display = 'flex';
                loader.style.opacity = '1';
                loader.querySelector('p').textContent = 'Resetting Database...';
            }

            // 1. Delete all current courses from Firestore
            const coursesRef = collection(db, `users/${currentUser.uid}/courses`);
            const coursesSnap = await getDocs(coursesRef);
            for (const docSnap of coursesSnap.docs) {
                await deleteDoc(doc(db, `users/${currentUser.uid}/courses`, docSnap.id));
            }

            // 2. Re-seed default dummy data
            await seedInitialUserData(currentUser.uid);

            // 3. Reload dashboard state
            await fetchAndRenderDashboardData();

            // Redirect back to main dashboard view
            switchTab('dashboard');

        } catch (error) {
            console.error("Error resetting database state:", error);
            alert("Error occurred while resetting database.");
        }
    });

    // ----------------------------------------------------------------------
    // 6. Protected Route & Main Auth Listener
    // ----------------------------------------------------------------------
    if (window.location.pathname.endsWith('dashboard.html')) {
        onAuthStateChanged(auth, async (user) => {
            if (!user) {
                window.location.href = 'index.html'; 
            } else {
                currentUser = user;
                const nameToDisplay = user.displayName || user.email.split('@')[0];
                document.getElementById('user-name').textContent = nameToDisplay;
                document.getElementById('user-email').textContent = user.email;
                document.getElementById('user-avatar').textContent = nameToDisplay.charAt(0).toUpperCase();
                
                await fetchAndRenderDashboardData();
            }
        });
    }

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    });
});

/**
 * Fetch all initial data from Firestore
 */
async function fetchAndRenderDashboardData() {
    try {
        const userId = currentUser.uid;
        
        // Fetch Courses
        const coursesRef = collection(db, `users/${userId}/courses`);
        let coursesSnap = await getDocs(coursesRef);
        cachedCourses = [];
        coursesSnap.forEach((docSnap) => cachedCourses.push(docSnap.data()));

        // AUTO-SEEDING SAFEGUARD
        if (cachedCourses.length === 0) {
            console.log("No courses found. Auto-seeding mock data for deployment...");
            await seedInitialUserData(userId);
            coursesSnap = await getDocs(coursesRef);
            coursesSnap.forEach((docSnap) => cachedCourses.push(docSnap.data()));
        }

        // Calculate and display metrics & course list
        recalculateMetricsAndUpdateUI();

        // Fetch Analytics Docs
        const gradesDoc = await getDoc(doc(db, `users/${userId}/analytics`, 'grades'));
        const progressDoc = await getDoc(doc(db, `users/${userId}/analytics`, 'weeklyProgress'));
        const attendanceDoc = await getDoc(doc(db, `users/${userId}/analytics`, 'attendance'));

        let gradeLabels = ['Quiz 1', 'Assignment 1', 'Midterm', 'Quiz 2', 'Final Project'];
        let gradeScores = [85, 92, 78, 95, 88];
        let progLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
        let progHours = [10, 15, 12, 18, 14];
        let attLabels = ['Present', 'Absent', 'Excused'];
        let attCounts = [45, 3, 2];

        if (gradesDoc.exists()) {
            gradeLabels = gradesDoc.data().labels;
            gradeScores = gradesDoc.data().scores;
        }
        if (progressDoc.exists()) {
            progLabels = progressDoc.data().labels;
            progHours = progressDoc.data().hours;
        }
        if (attendanceDoc.exists()) {
            attLabels = attendanceDoc.data().labels;
            attCounts = attendanceDoc.data().counts;
        }

        renderCharts(gradeLabels, gradeScores, progLabels, progHours, attLabels, attCounts);

        // Hide loading overlay
        const loader = document.getElementById('loading-overlay');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => { loader.style.display = 'none'; }, 300);
        }

    } catch (error) {
        console.error("Error loading dashboard data:", error);
        document.getElementById('loading-overlay').style.display = 'none';
        document.getElementById('courses-container').innerHTML = `
            <div class="empty-state glass-card">
                <h3 class="error-msg">Unable to load dashboard data</h3>
                <p>There was a network failure or permission issue connecting to the database. Please refresh the page.</p>
            </div>
        `;
    }
}

/**
 * Recalculates metrics and updates the DOM list of courses
 */
function recalculateMetricsAndUpdateUI() {
    let totalProgress = 0;
    let activeCount = 0;
    let totalPending = 0;

    if (cachedCourses.length > 0) {
        cachedCourses.forEach(c => {
            totalProgress += c.progress;
            if (c.status === 'in-progress') activeCount++;
            totalPending += (c.totalModules - c.modulesCompleted);
        });
        totalProgress = Math.round(totalProgress / cachedCourses.length);
    }

    document.getElementById('overall-progress-text').textContent = `${totalProgress}%`;
    document.getElementById('overall-progress-circle').style.background = `conic-gradient(var(--text-primary) ${totalProgress}%, var(--border) 0%)`;
    document.getElementById('active-courses-count').textContent = activeCount;
    document.getElementById('pending-modules-count').textContent = totalPending;

    renderFilteredCourses();
}

/**
 * Filters cached courses by Search Query & Filter Chip, then updates DOM containers
 */
function renderFilteredCourses() {
    const containerMain = document.getElementById('courses-container');
    const containerTab = document.getElementById('courses-container-tab');
    const emptyState = document.getElementById('empty-state');

    const filtered = cachedCourses.filter(course => {
        const matchesStatus = (activeFilter === 'all') || (course.status === activeFilter);
        const matchesQuery = !searchQuery || 
            course.title.toLowerCase().includes(searchQuery) || 
            course.instructor.toLowerCase().includes(searchQuery);
        return matchesStatus && matchesQuery;
    });

    if (containerMain) containerMain.innerHTML = '';
    if (containerTab) containerTab.innerHTML = '';

    if (filtered.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
    } else {
        if (emptyState) emptyState.style.display = 'none';

        filtered.forEach(course => {
            const cardHtml = createCourseCardComponent(course);
            if (containerMain) containerMain.insertAdjacentHTML('beforeend', cardHtml);
            if (containerTab) containerTab.insertAdjacentHTML('beforeend', cardHtml);
        });

        // Trigger progress bar width animation
        setTimeout(() => {
            document.querySelectorAll('.progress-fill').forEach(bar => {
                bar.style.width = bar.getAttribute('data-target');
            });
        }, 50);

        // Attach click listeners to "Manage" buttons
        document.querySelectorAll('.manage-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const courseId = e.currentTarget.getAttribute('data-id');
                const course = cachedCourses.find(c => c.id === courseId);
                if (course) {
                    currentEditingCourse = { ...course };
                    openManageModal();
                }
            });
        });
    }
}

/**
 * Opens the Manage Course Modal and sets initial UI state
 */
function openManageModal() {
    if (!currentEditingCourse) return;
    const modal = document.getElementById('manage-course-modal');
    document.getElementById('manage-course-title').textContent = currentEditingCourse.title;
    document.getElementById('manage-course-instructor').textContent = `Instructor: ${currentEditingCourse.instructor}`;
    
    updateManageModalUI();
    if (modal) modal.style.display = 'flex';
}

/**
 * Updates progress preview calculations in the Manage Modal
 */
function updateManageModalUI() {
    if (!currentEditingCourse) return;
    document.getElementById('manage-modules-count').textContent = currentEditingCourse.modulesCompleted;
    
    const pct = Math.round((currentEditingCourse.modulesCompleted / currentEditingCourse.totalModules) * 100);
    document.getElementById('manage-progress-text').textContent = `${pct}%`;
    document.getElementById('manage-progress-fill').style.width = `${pct}%`;
}

/**
 * Reusable Component Function to generate Course Card HTML
 */
function createCourseCardComponent(course) {
    const thumbnailClass = course.category || 'tech';
    const statusClass = course.status === 'in-progress' ? 'in-progress' : 'completed';
    const statusText = course.status.replace('-', ' ');

    return `
        <article class="course-card glass-card">
            <div class="course-thumbnail ${thumbnailClass}" aria-hidden="true"></div>
            <div class="course-content">
                <header class="course-header">
                    <h3 class="course-title">${course.title}</h3>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </header>
                <p class="instructor">${course.instructor}</p>
                <div class="progress-container">
                    <div class="progress-header">
                        <span>Progress</span>
                        <span>${course.progress}%</span>
                    </div>
                    <div class="progress-bar" role="progressbar" aria-valuenow="${course.progress}" aria-valuemin="0" aria-valuemax="100">
                        <div class="progress-fill" style="width: 0%" data-target="${course.progress}%"></div>
                    </div>
                </div>
                <div class="course-card-footer">
                    <span style="font-size: 0.85rem; color: var(--text-secondary);">
                        ${course.modulesCompleted}/${course.totalModules} Modules
                    </span>
                    <button class="btn btn-outline manage-btn" data-id="${course.id}" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">
                        ⚙️ Manage
                    </button>
                </div>
            </div>
        </article>
    `;
}

/**
 * Helper to force a chart rebuild when switching themes
 */
async function triggerChartRebuild() {
    if (!currentUser) return;
    const userId = currentUser.uid;
    const gradesDoc = await getDoc(doc(db, `users/${userId}/analytics`, 'grades'));
    const progressDoc = await getDoc(doc(db, `users/${userId}/analytics`, 'weeklyProgress'));
    const attendanceDoc = await getDoc(doc(db, `users/${userId}/analytics`, 'attendance'));

    let gradeLabels = ['Quiz 1', 'Assignment 1', 'Midterm', 'Quiz 2', 'Final Project'];
    let gradeScores = [85, 92, 78, 95, 88];
    let progLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
    let progHours = [10, 15, 12, 18, 14];
    let attLabels = ['Present', 'Absent', 'Excused'];
    let attCounts = [45, 3, 2];

    if (gradesDoc.exists()) {
        gradeLabels = gradesDoc.data().labels;
        gradeScores = gradesDoc.data().scores;
    }
    if (progressDoc.exists()) {
        progLabels = progressDoc.data().labels;
        progHours = progressDoc.data().hours;
    }
    if (attendanceDoc.exists()) {
        attLabels = attendanceDoc.data().labels;
        attCounts = attendanceDoc.data().counts;
    }

    renderCharts(gradeLabels, gradeScores, progLabels, progHours, attLabels, attCounts);
}

/**
 * Render all Chart.js instances
 */
function renderCharts(gradeLabels, gradeScores, progLabels, progHours, attLabels, attCounts) {
    // Dynamically adjust label colors based on theme class on body
    const isDark = document.body.classList.contains('dark-mode');
    const labelColor = isDark ? '#9ca3af' : '#475569';
    const gridColor = isDark ? '#1f2937' : '#e2e8f0';
    const barBgColor = isDark ? '#f8fafc' : '#0f172a'; // Monochrome branding style

    Chart.defaults.font.family = "'Outfit', sans-serif";
    Chart.defaults.color = labelColor;

    // 1. Grades Bar Chart
    const ctxGrades = document.getElementById('gradesBarChart')?.getContext('2d');
    if (ctxGrades) {
        if (gradesChartInstance) gradesChartInstance.destroy();
        gradesChartInstance = new Chart(ctxGrades, {
            type: 'bar',
            data: {
                labels: gradeLabels,
                datasets: [{
                    label: 'Score (%)',
                    data: gradeScores,
                    backgroundColor: barBgColor,
                    borderRadius: 3
                }]
            },
            options: { 
                responsive: true, 
                scales: { 
                    y: { beginAtZero: true, max: 100, grid: { color: gridColor }, ticks: { color: labelColor } },
                    x: { grid: { display: false }, ticks: { color: labelColor } }
                }, 
                plugins: { legend: { display: false } } 
            }
        });
    }

    // 1b. Grades Bar Chart Detailed (for Grades Tab)
    const ctxGradesDet = document.getElementById('gradesBarChartDetailed')?.getContext('2d');
    if (ctxGradesDet) {
        if (gradesChartDetailedInstance) gradesChartDetailedInstance.destroy();
        gradesChartDetailedInstance = new Chart(ctxGradesDet, {
            type: 'bar',
            data: {
                labels: gradeLabels,
                datasets: [{
                    label: 'Score (%)',
                    data: gradeScores,
                    backgroundColor: barBgColor,
                    borderRadius: 3
                }]
            },
            options: { 
                responsive: true, 
                scales: { 
                    y: { beginAtZero: true, max: 100, grid: { color: gridColor }, ticks: { color: labelColor } },
                    x: { grid: { display: false }, ticks: { color: labelColor } }
                }, 
                plugins: { legend: { display: false } } 
            }
        });
    }

    // 2. Weekly Progress Line Chart
    const ctxProgress = document.getElementById('progressLineChart')?.getContext('2d');
    if (ctxProgress) {
        if (progressChartInstance) progressChartInstance.destroy();
        progressChartInstance = new Chart(ctxProgress, {
            type: 'line',
            data: {
                labels: progLabels,
                datasets: [{
                    label: 'Hours Spent',
                    data: progHours,
                    borderColor: barBgColor,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: { 
                responsive: true, 
                scales: { 
                    y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: labelColor } },
                    x: { grid: { display: false }, ticks: { color: labelColor } }
                }, 
                plugins: { legend: { display: false } } 
            }
        });
    }

    // 3. Attendance Doughnut Chart
    const ctxAttendance = document.getElementById('attendanceDoughnutChart')?.getContext('2d');
    if (ctxAttendance) {
        if (attendanceChartInstance) attendanceChartInstance.destroy();
        attendanceChartInstance = new Chart(ctxAttendance, {
            type: 'doughnut',
            data: {
                labels: attLabels,
                datasets: [{
                    data: attCounts,
                    backgroundColor: [
                        isDark ? '#34d399' : '#10b981', // green
                        isDark ? '#f87171' : '#ef4444', // red
                        isDark ? '#fbbf24' : '#f59e0b'  // yellow
                    ],
                    borderWidth: 0
                }]
            },
            options: { 
                responsive: true, 
                cutout: '75%', 
                plugins: { 
                    legend: { 
                        position: 'bottom',
                        labels: { color: labelColor, boxWidth: 10, font: { size: 11 } }
                    } 
                } 
            }
        });
    }

    // 3b. Attendance Doughnut Chart Detailed (for Grades Tab)
    const ctxAttDet = document.getElementById('attendanceDoughnutChartDetailed')?.getContext('2d');
    if (ctxAttDet) {
        if (attendanceChartDetailedInstance) attendanceChartDetailedInstance.destroy();
        attendanceChartDetailedInstance = new Chart(ctxAttDet, {
            type: 'doughnut',
            data: {
                labels: attLabels,
                datasets: [{
                    data: attCounts,
                    backgroundColor: [
                        isDark ? '#34d399' : '#10b981',
                        isDark ? '#f87171' : '#ef4444',
                        isDark ? '#fbbf24' : '#f59e0b'
                    ],
                    borderWidth: 0
                }]
            },
            options: { 
                responsive: true, 
                cutout: '75%', 
                plugins: { 
                    legend: { 
                        position: 'bottom',
                        labels: { color: labelColor, boxWidth: 10, font: { size: 11 } }
                    } 
                } 
            }
        });
    }
}
