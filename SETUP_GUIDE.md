# 🚀 Quick Setup Guide

Follow these steps to get your Trip Expense Manager up and running in 15 minutes!

## ✅ Step-by-Step Setup

### 1️⃣ Create Firebase Project (5 minutes)

1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `mumbai-trip-expenses` (or your choice)
4. **Disable** Google Analytics (optional for small projects)
5. Click **"Create project"**

### 2️⃣ Enable Firebase Services (5 minutes)

#### Enable Authentication

1. In Firebase Console, click **"Authentication"** in left sidebar
2. Click **"Get started"**
3. Enable **"Google"** sign-in provider
   - Click "Google" → Enable → Save
4. Enable **"Email/Password"** sign-in provider
   - Click "Email/Password" → Enable → Save

#### Enable Firestore Database

1. Click **"Firestore Database"** in left sidebar
2. Click **"Create database"**
3. Select **"Start in production mode"**
4. Choose a location (closest to your users)
5. Click **"Enable"**

#### Enable Storage

1. Click **"Storage"** in left sidebar
2. Click **"Get started"**
3. Click **"Next"** (keep default rules)
4. Choose same location as Firestore
5. Click **"Done"**

### 3️⃣ Configure the App (3 minutes)

#### Get Firebase Config

1. Click **⚙️ (gear icon)** → **"Project settings"**
2. Scroll to **"Your apps"** section
3. Click **Web icon** `</>`
4. Register app: name it "Trip Expense Manager"
5. **Copy** the `firebaseConfig` object

#### Update Config File

1. Open `public/js/config.js` in your code editor
2. Replace the placeholder values with your Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "AIza...",  // Paste your values here
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
};
```

3. Update your college information:

```javascript
const APP_CONFIG = {
    COLLEGE_NAME: 'ABC College of Engineering',
    TRIP_NAME: 'Mumbai Industrial Trip 2024'
};
```

4. **Save** the file

### 4️⃣ Deploy the App (2 minutes)

#### Install Firebase CLI (one-time)

```bash
npm install -g firebase-tools
```

#### Login and Deploy

```bash
# Login to Firebase
firebase login

# Initialize Firebase (first time only)
firebase init

# Select:
# - Firestore
# - Hosting
# - Storage
#
# Use existing project → select your project
# Accept all defaults (press Enter)

# Update .firebaserc with your project ID
# Edit .firebaserc and replace "your-project-id" with actual ID

# Deploy everything
firebase deploy
```

### 5️⃣ Set Up First Admin

1. Visit your deployed app URL: `https://your-project-id.firebaseapp.com`
2. Sign in with Google or create an email account
3. Go to **Firebase Console** → **Firestore Database**
4. Find the `users` collection
5. Click on your user document
6. Edit the `role` field: change `"member"` to `"admin"`
7. Refresh your app - you should now see the **Admin** menu

### 6️⃣ Create First Trip

1. In **Firebase Console** → **Firestore Database**
2. Click **"Start collection"**
3. Collection ID: `trips`
4. Document ID: (auto-generate)
5. Add fields:
   - `name` (string): "Mumbai Trip 2024"
   - `startDate` (timestamp): Select your trip start date
   - `endDate` (timestamp): Select your trip end date
   - `members` (array): Leave empty or add member names
   - `createdBy` (string): Your user ID
   - `createdAt` (timestamp): Current timestamp

6. Click **"Save"**

## 🎉 You're Done!

Your app is now live and ready to use!

### Share with Your Team

Send them the app URL: `https://your-project-id.firebaseapp.com`

They can:
- Sign in with Google or create an account
- Upload receipts immediately
- Track expenses in real-time

### Admin Tasks

As admin, you can:
- Verify uploaded receipts
- Approve/reject expenses
- Generate final reports
- Export PDF for college submission

## 🔥 Quick Commands Reference

```bash
# Deploy everything
firebase deploy

# Deploy only hosting (faster for code changes)
firebase deploy --only hosting

# Deploy only security rules
firebase deploy --only firestore:rules,storage:rules

# Test locally
firebase serve

# View logs
firebase functions:log

# Use emulators for testing
firebase emulators:start
```

## 📱 Test the App

1. **Upload a test receipt**
   - Login → Upload Receipt
   - Fill details, attach an image
   - Submit

2. **Verify as admin**
   - Go to Admin Dashboard
   - See your receipt
   - Approve it

3. **Generate report**
   - Go to Reports
   - Select trip
   - Preview
   - Export PDF

## ❓ Common Issues

### "Permission denied" errors

**Solution**: Deploy Firestore and Storage rules:
```bash
firebase deploy --only firestore:rules,storage:rules
```

### Can't see Admin menu

**Solution**:
1. Check Firestore → users → your user document
2. Ensure `role` field is set to `"admin"`
3. Refresh the app

### Upload fails

**Solution**:
1. Check file size (must be < 10MB)
2. Check file type (JPG, PNG, or PDF only)
3. Ensure Storage rules are deployed

### App won't load

**Solution**:
1. Check `public/js/config.js` has correct Firebase config
2. Verify deployment: `firebase deploy --only hosting`
3. Check browser console for errors

## 🆘 Need Help?

1. Check browser console for errors (F12)
2. Check Firebase Console for error messages
3. Review the main [README.md](README.md) for detailed docs
4. Verify all steps were completed

## 📋 Pre-Trip Checklist

- [ ] Firebase project created
- [ ] All services enabled (Auth, Firestore, Storage)
- [ ] App configured with Firebase credentials
- [ ] App deployed successfully
- [ ] First admin account set up
- [ ] Test trip created
- [ ] Test receipt uploaded and verified
- [ ] Test report generated
- [ ] Team members invited
- [ ] Everyone has app URL and can login

## 🎯 During Trip

- Upload receipts immediately after expense
- Admin should verify receipts daily
- Record all money transfers
- Keep original receipts as backup

## 📊 After Trip

1. Ensure all receipts uploaded
2. Verify all pending receipts
3. Generate final report
4. Export PDF for college
5. Export CSV for backup
6. Submit to college administration

---

**Ready to track your trip expenses! Have a great trip! 🎒✨**
