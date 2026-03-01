# CodeCraft Studio

A comprehensive web application for a digital agency featuring client management, employee management, project tracking, payment processing, and analytics dashboard.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)
![Express](https://img.shields.io/badge/Express-4.18.x-green.svg)

## Features

### Client Features
- **User Authentication**: Secure login and registration system
- **Dashboard**: Personalized dashboard with project overview
- **Services**: Browse and request digital services
- **Portfolio**: View completed projects and work samples
- **Pricing**: Transparent pricing plans
- **Contact**: Get in touch with the team
- **Order Management**: Track your orders and requests
- **Payment Processing**: Secure payment system
- **Profile Management**: Update personal information

### Admin Features
- **Admin Dashboard**: Overview of all business metrics
- **Client Management**: Manage registered clients
- **Employee Management**: Manage team members
- **Order Management**: Handle client orders
- **Payment Management**: Track and manage payments
- **Message Management**: Respond to client inquiries
- **Service Management**: Manage offered services
- **Analytics**: View business performance metrics
- **Settings**: Configure application settings

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Frontend**: HTML5, CSS3, JavaScript
- **Authentication**: bcryptjs, express-session
- **Validation**: express-validator

## Project Structure

```
codecraft-studio/
├── server.js                 # Main server file
├── package.json              # Dependencies
├── start-server.bat          # Windows startup script
├── Database/
│   └── Codecraftstudio_Database.sql  # Database schema
├── public/
│   ├── index.html           # Home page
│   ├── login_temp.html      # Login page
│   ├── signup.html          # Registration page
│   ├── dashboard.html       # User dashboard
│   ├── admin.html           # Admin dashboard
│   ├── about.html           # About page
│   ├── contact.html         # Contact page
│   ├── services.html        # Services page
│   ├── portfolio.html       # Portfolio page
│   ├── pricing.html         # Pricing page
│   ├── projects.html        # Projects page
│   ├── profile.html         # Profile page
│   ├── settings.html        # Settings page
│   ├── messages.html        # Messages page
│   ├── payment.html         # Payment page
│   ├── admin-*.html         # Admin pages
│   ├── analytics.html       # Analytics page
│   ├── style.css            # Main stylesheet
│   └── js/
│       ├── api.js           # API functions
│       └── storage.js       # Storage utilities
└── .gitignore               # Git ignore file
```

## Installation

### Prerequisites
- Node.js (v18 or higher)
- MySQL (v5.7 or higher)

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/codecraft-studio.git
   cd codecraft-studio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   - Open MySQL and create a new database:
     ```sql
     CREATE DATABASE codecraft_studio;
     ```
   - Import the database schema:
     ```bash
     mysql -u username -p codecraft_studio < Database/Codecraftstudio_Database.sql
     ```

4. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=codecraft_studio
   SESSION_SECRET=your_secret_key
   ```

5. **Start the server**
   ```bash
   npm start
   ```
   
   Or on Windows:
   ```bash
   start-server.bat
   ```

6. **Access the application**
   Open your browser and navigate to: `http://localhost:3000`

## Deployment

### Deploying to Render.com (Recommended)

1. **Push your code to GitHub**
   - Create a new repository on GitHub
   - Push your code to the repository

2. **Deploy on Render**
   - Sign up at [render.com](https://render.com)
   - Connect your GitHub account
   - Create a new Web Service
   - Select your repository
   - Configure the following:
     - **Build Command**: `npm install`
     - **Start Command**: `node server.js`
   - Add environment variables in the Render dashboard
   - Deploy

### Deploying to Heroku

1. **Create a Heroku app**
   ```bash
   heroku create codecraft-studio
   ```

2. **Add MySQL database**
   ```bash
   heroku addons:create jawsdb:kitefin
   ```

3. **Set environment variables**
   ```bash
   heroku config:set PORT=3000
   heroku config:set SESSION_SECRET=your_secret
   ```

4. **Push to Heroku**
   ```bash
   git push heroku main
   ```

## Usage

### For Clients
1. Register a new account
2. Login to access the dashboard
3. Browse services and place orders
4. Make payments for services
5. Track order status
6. Contact support via messages

### For Admins
1. Login with admin credentials
2. Manage clients and employees
3. Process orders and payments
4. Respond to client messages
5. Update services and pricing
6. View analytics and reports

## License

This project is licensed under the MIT License.

## Author

M. Ahsan Shah

## Acknowledgments

- Thanks to all contributors
- Built with Express.js and MySQL
