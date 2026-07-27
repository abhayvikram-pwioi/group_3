# Student Progress Tracking SaaS

A responsive, vanilla web application for tracking student progress. Built with pure HTML, CSS, JavaScript, and Firebase (Authentication & Firestore). 

## Features
- **Firebase Authentication**: Secure Email/Password login and signup.
- **Dynamic Dashboard**: Fetches and renders live data from Firestore.
- **Analytics Visualization**: Uses Chart.js for Bar, Line, and Doughnut charts.
- **Responsive Design**: Works perfectly across mobile, tablet, and desktop screens.
- **Dark Mode**: Toggleable dark mode that persists in local storage.
- **Semantic & Accessible**: Uses modern HTML5 tags and aria-labels.

## Project Structure
This project intentionally avoids heavy frameworks like React to focus on core web fundamentals and component-based architecture using vanilla JavaScript.
- `/index.html`: Login and Signup view.
- `/dashboard.html`: The main authenticated dashboard view.
- `/css/`: Contains styling and theme variables.
- `/js/`: Contains modular Firebase logic, auth handlers, and dashboard DOM manipulation.

## Local Environment Setup
Because this project uses Vanilla web technologies and CDN-based ES Modules, you do not need `npm install` or any complex build tools.

1. Clone or download this directory.
2. Serve the directory using any local web server. 
   - **Using Python**: `python3 -m http.server 8000`
   - **Using Node/npm**: `npx serve .`
   - **Using VS Code**: Install the "Live Server" extension and click "Go Live".
3. Open `http://localhost:8000` in your browser.

## Deployment Guidelines
This application is completely static on the frontend. It can be deployed to any static hosting provider for free in less than a minute.

### Option A: Vercel (Recommended)
1. Push this code to a GitHub repository.
2. Go to [Vercel](https://vercel.com/) and log in.
3. Click **Add New** > **Project**.
4. Import your GitHub repository.
5. Leave all build settings as default (Framework Preset: Other) and click **Deploy**.

### Option B: Firebase Hosting
1. Install the Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize hosting in this directory: `firebase init hosting`
   - Select your existing Firebase project.
   - Use the current directory `.` as your public directory.
   - Configure as a single-page app: `No`
4. Deploy the app: `firebase deploy`

### Option C: Netlify
1. Go to [Netlify Drop](https://app.netlify.com/drop).
2. Drag and drop the entire project folder into the browser window.
3. Your site is instantly live!

## Screenshots
*(Add screenshots of your deployed index.html and dashboard.html here for your submission)*
