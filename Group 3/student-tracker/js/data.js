/**
 * ========================================
 * Data Seeding Utility
 * ========================================
 * This script is called exactly once when a brand-new user signs up.
 * Because we don't have a backend to automatically provision databases for new users,
 * we handle it on the client side here. It populates their Firestore account with 
 * dummy courses and chart data so they immediately see a populated dashboard.
 */

import { db, doc, setDoc } from './firebase.js';

export async function seedInitialUserData(userId) {
    try {
        // 1. Create the root user profile document
        await setDoc(doc(db, 'users', userId), {
            createdAt: new Date(),
            // These will eventually be calculated dynamically based on courses, 
            // but we provide initial fallback values here.
            overallProgress: 0,
            activeCourses: 3,
            pendingModules: 12 
        });

        // 2. Define our 3 Dummy Courses
        const courses = [
            {
                id: 'course_1',
                title: 'Advanced Web Development',
                instructor: 'Sarah Jenkins',
                progress: 75,
                modulesCompleted: 15,
                totalModules: 20,
                status: 'in-progress',
                category: 'tech' // This drives the thumbnail background gradient in CSS
            },
            {
                id: 'course_2',
                title: 'Data Science Fundamentals',
                instructor: 'Dr. Robert Chen',
                progress: 100,
                modulesCompleted: 10,
                totalModules: 10,
                status: 'completed',
                category: 'science'
            },
            {
                id: 'course_3',
                title: 'UI/UX Design Principles',
                instructor: 'Emily Carter',
                progress: 30,
                modulesCompleted: 3,
                totalModules: 10,
                status: 'in-progress',
                category: 'design'
            }
        ];

        // 3. Write each course to the user's 'courses' subcollection
        for (const course of courses) {
            await setDoc(doc(db, `users/${userId}/courses`, course.id), course);
        }

        // 4. Seed analytics data for our 3 Chart.js charts
        
        // Data for the Bar Chart (Grades)
        const gradeData = {
            labels: ['Quiz 1', 'Assignment 1', 'Midterm', 'Quiz 2', 'Final Project'],
            scores: [85, 92, 78, 95, 88]
        };
        await setDoc(doc(db, `users/${userId}/analytics`, 'grades'), gradeData);

        // Data for the Line Chart (Weekly Progress)
        const progressData = {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
            hours: [10, 15, 12, 18, 14]
        };
        await setDoc(doc(db, `users/${userId}/analytics`, 'weeklyProgress'), progressData);

        // NEW: Data for the Doughnut Chart (Attendance)
        const attendanceData = {
            labels: ['Present', 'Absent', 'Excused'],
            counts: [45, 3, 2] // Represents number of days/classes
        };
        await setDoc(doc(db, `users/${userId}/analytics`, 'attendance'), attendanceData);

        console.log("Dummy data seeded successfully for user: ", userId);
    } catch (error) {
        console.error("Error seeding dummy data: ", error);
        // We log this, but we don't stop the user from logging in.
        // They will just see an empty dashboard if seeding fails.
    }
}
