# 🎒 Trip Expense Manager

A lightweight web application for managing team expenses during college trips. Built with Firebase for easy deployment and real-time updates.

## 📋 Features

- **User Authentication**: Google Sign-In and Email/Password authentication
- **Receipt Management**: Upload and track expense receipts (images/PDFs)
- **Money Transfers**: Record payments between team members
- **Admin Dashboard**: Verify and approve submitted receipts
- **Reports & Export**: Generate consolidated PDF and CSV reports for college submission
- **Role-Based Access**: Member, Admin, and Viewer roles
- **Audit Logging**: Track all actions for accountability
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🚀 Quick Start

### Prerequisites

- A Google account
- Basic knowledge of Firebase (helpful but not required)

### Step 1: Set Up Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" and create a new project
3. Enable the following services:
   - **Authentication**: Enable Google Sign-In and Email/Password
   - **Firestore Database**: Create a database in production mode
   - **Storage**: Enable Firebase Storage

### Step 2: Get Firebase Configuration

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Web" app icon (</>) to create a web app
4. Copy the Firebase configuration object

### Step 3: Configure the Application

1. Open `public/js/config.js`
2. Replace the placeholder values with your Firebase configuration:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

3. Update the college and trip information:

```javascript
const APP_CONFIG = {
    COLLEGE_NAME: 'Your College Name',
    TRIP_NAME: 'Mumbai Trip 2024'
};
```

### Step 4: Deploy Security Rules

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase (if not already done):
```bash
firebase init
```
   - Select Firestore, Hosting, and Storage
   - Choose your existing project
   - Accept default file names

4. Update `.firebaserc` with your project ID:
```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

5. Deploy Firestore and Storage rules:
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### Step 5: Deploy the Application

```bash
firebase deploy --only hosting
```

Your app will be live at: `https://your-project-id.firebaseapp.com`

## 🎯 Usage Guide

### For Team Members

1. **Sign In**: Use Google Sign-In or create account with email/password
2. **Upload Receipts**:
   - Navigate to "Upload Receipt"
   - Fill in details (amount, date, category, description)
   - Attach receipt image or PDF
   - Submit for approval
3. **Record Transfers**:
   - Go to "Transfers" page
   - Enter payment details
   - Optionally attach proof
4. **View Dashboard**: Track your uploads and trip expenses

### For Admins

1. **Verify Receipts**:
   - Access "Admin Dashboard"
   - Review pending receipts
   - Click "View" to see details
   - Approve or reject with comments
2. **Manage Users**:
   - Add user emails and assign roles
   - View all registered users
3. **Generate Reports**:
   - Go to "Reports" page
   - Select trip and filters
   - Preview the report
   - Export as PDF or CSV for college submission

## 🔐 Setting Up the First Admin

After deploying, the first user needs to be manually set as admin:

1. Sign up as the first user
2. Go to Firebase Console > Firestore Database
3. Find your user document in the `users` collection
4. Edit the document and change `role` from `"member"` to `"admin"`
5. Refresh the app to see admin features

## 📊 Data Structure

### Collections

- **users**: User profiles and roles
- **trips**: Trip information (dates, members)
- **receipts**: Expense receipts with status tracking
- **transfers**: Money transfers between members
- **audit_log**: Activity logs for accountability

### Receipt Statuses

- **pending**: Awaiting admin verification
- **approved**: Verified and approved for reimbursement
- **rejected**: Rejected with admin comments

### User Roles

- **member**: Can upload receipts and view own data
- **admin**: Can verify receipts and generate reports
- **viewer**: Read-only access (optional)

## 🎨 Customization

### Update College/Trip Information

Edit `public/js/config.js`:

```javascript
const APP_CONFIG = {
    COLLEGE_NAME: 'Your College Name',
    TRIP_NAME: 'Your Trip Name',
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    CURRENCY: 'INR'
};
```

### Add Custom Categories

1. Update categories in `public/js/config.js`
2. Update the select options in `public/upload.html`

### Customize Styling

Edit `public/css/styles.css` to change:
- Colors (update CSS variables in `:root`)
- Fonts
- Layout

## 🔧 Development

### Run Locally

1. Install Firebase Emulator Suite:
```bash
firebase init emulators
```

2. Start emulators:
```bash
firebase emulators:start
```

3. Serve the app locally:
```bash
firebase serve
```

Visit `http://localhost:5000`

### Project Structure

```
trip-expense-manager/
├── public/
│   ├── css/
│   │   └── styles.css          # Application styling
│   ├── js/
│   │   ├── config.js           # Firebase configuration
│   │   ├── auth.js             # Authentication logic
│   │   ├── utils.js            # Utility functions
│   │   ├── dashboard.js        # Dashboard functionality
│   │   ├── upload.js           # Receipt upload
│   │   ├── transfers.js        # Transfer management
│   │   ├── admin.js            # Admin panel
│   │   └── reports.js          # Report generation
│   ├── index.html              # Login page
│   ├── dashboard.html          # Main dashboard
│   ├── upload.html             # Receipt upload
│   ├── transfers.html          # Transfers page
│   ├── admin.html              # Admin dashboard
│   └── reports.html            # Reports & export
├── firestore.rules             # Firestore security rules
├── storage.rules               # Storage security rules
├── firebase.json               # Firebase config
├── firestore.indexes.json      # Database indexes
└── README.md                   # This file
```

## 📱 Mobile Support

The application is fully responsive and works on:
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Tablets
- Mobile phones

## 🔒 Security Features

- Firebase Authentication for secure login
- Firestore security rules prevent unauthorized access
- Storage rules validate file types and sizes
- Role-based access control
- Audit logging for all actions

## 💡 Tips

1. **Backup Data**: Regularly export data using the CSV export feature
2. **File Sizes**: Keep receipt files under 10MB for optimal performance
3. **Clear Instructions**: Add notes to receipts for easier verification
4. **Regular Verification**: Admins should verify receipts daily during trips
5. **Internet Connection**: App requires internet; offline mode not supported

## 🐛 Troubleshooting

### Authentication Issues

- Ensure authentication providers are enabled in Firebase Console
- Check that the domain is authorized in Firebase Authentication settings

### Upload Failures

- Verify Storage rules are deployed
- Check file size (must be < 10MB)
- Ensure file type is JPG, PNG, or PDF

### Permission Errors

- Verify Firestore rules are deployed correctly
- Check user role in Firestore Database
- Ensure user is signed in

### Reports Not Generating

- Make sure trip has approved receipts
- Check browser console for errors
- Try refreshing the page

## 📞 Support

For issues or questions:
1. Check the Firebase Console for errors
2. Review browser console logs
3. Verify security rules are deployed
4. Ensure all required fields are filled

## 📄 License

This project is open source and available for educational use.

## 🎓 For College Trip Organizers

### Before the Trip

1. Deploy the application
2. Set up admin accounts
3. Share the app URL with team members
4. Brief the team on how to upload receipts

### During the Trip

1. Team members upload receipts immediately after expenses
2. Admin verifies receipts daily
3. Record all transfers between members

### After the Trip

1. Ensure all receipts are uploaded
2. Verify all pending receipts
3. Generate final consolidated report
4. Export PDF for college submission
5. Keep CSV backup for records

## 🌟 Features for Future Enhancement

- Offline support with data sync
- OCR for automatic amount extraction
- Budget tracking and alerts
- Per-person expense breakdown
- Mobile app (React Native)
- WhatsApp/Email notifications

---

**Built with ❤️ for college trip management**
