# FlowCare Clinic Management System - Complete Deployment Guide

This guide walks you through deploying the **FlowCare** system (React frontend + PHP REST API + MySQL database) to production.

---

## 📋 Table of Contents
1. [Pre-Deployment Configuration Checklist](#1-pre-deployment-configuration-checklist)
2. [Method 1: cPanel / Shared Hosting / Apache (Recommended)](#2-method-1-cpanel--shared-hosting--apache-recommended)
3. [Method 2: Linux VPS (Ubuntu + Nginx + PHP 8.2-FPM + MySQL)](#3-method-2-linux-vps-ubuntu--nginx--php-82-fpm--mysql)
4. [Method 3: Decoupled Cloud (Vercel Frontend + PHP Backend)](#4-method-3-decoupled-cloud-vercel-frontend--php-backend)
5. [Post-Deployment Verification & Troubleshooting](#5-post-deployment-verification--troubleshooting)
6. [Default Administrative Credentials](#6-default-administrative-credentials)

---

## 1. Pre-Deployment Configuration Checklist

Before uploading files to your production server, update the following files with your production values:

### A. Database Credentials (`backend/config/db.php`)
Replace local XAMPP credentials with your production database credentials:
```php
// backend/config/db.php
date_default_timezone_set('Asia/Colombo'); // Or your local timezone

$host     = "localhost";        // Usually localhost or IP from hosting provider
$user     = "your_db_username"; // Production MySQL username
$password = "your_db_password"; // Production MySQL strong password
$database = "your_db_name";     // Production database name
```

### B. CORS Allowed Origin (`backend/config/cors.php`)
Configured for `flowcare.great-site.net`:
```php
// backend/config/cors.php
$allowed_origins = [
	'https://flowcare.great-site.net',
	'http://flowcare.great-site.net',
	'http://localhost:5173',
	'http://127.0.0.1:5173'
];

$http_origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($http_origin, $allowed_origins)) {
	header("Access-Control-Allow-Origin: " . $http_origin);
} else {
	header("Access-Control-Allow-Origin: https://flowcare.great-site.net");
}
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
```
> **Tip:** If deploying frontend and backend on the exact same domain (`flowcare.great-site.net`), CORS errors are avoided, but keeping the correct origin header is best practice.

### C. JWT Secret Key (`backend/config/jwt.php`)
Replace the default fallback secret with a long, cryptographically random key:
```php
// backend/config/jwt.php
if (!defined('JWT_SECRET')) {
    define('JWT_SECRET', 'YOUR_UNIQUE_RANDOM_64_CHAR_SECRET_KEY_HERE_CHANGE_FOR_PRODUCTION');
}
```

---

## 2. Method 1: cPanel / Shared Hosting / Apache (Recommended)

This is the most common deployment setup for PHP/MySQL applications.

### Step 1: Build the React Frontend Locally
On your local machine, open a terminal in the `flowcare/frontend` directory and run:
```bash
cd c:\xampp\htdocs\flowcare\frontend
npm run build
```
This generates the optimized production build in the `frontend/dist/` folder:
- `frontend/dist/index.html`
- `frontend/dist/assets/` (bundled JS, CSS, and images)

---

### Step 2: Set up the MySQL Database in cPanel
1. Log in to your **cPanel** dashboard.
2. Open **MySQL Database Wizard**:
   - Create a new database (e.g., `user_flowcare`).
   - Create a database user with a strong password.
   - Assign the user to the database and grant **ALL PRIVILEGES**.
3. Open **phpMyAdmin**:
   - Select your newly created database.
   - Click the **Import** tab.
   - Choose `backend/database.sql` from the FlowCare project and click **Go**.

---

### Step 3: Directory Structure on Server
Upload files to `public_html` using cPanel **File Manager** or **FTP (FileZilla)** to match this clean structure:

```
public_html/
├── index.html                   ← (from frontend/dist/index.html)
├── assets/                      ← (from frontend/dist/assets/)
├── .htaccess                    ← (created in Step 4 below)
├── uploads/                     ← (from project root uploads/)
│   ├── patients/
│   └── doctors/
└── backend/                     ← (from project root backend/)
    ├── api/
    ├── config/
    └── models/
```

> **Important:** Do NOT upload `node_modules`, `frontend/src`, `.git`, or temporary development files to the server.

---

### Step 4: Create the `.htaccess` File (Crucial)
In your `public_html/` root directory, create a file named `.htaccess`. This file handles:
1. **React Router SPA routing** (prevents 404 errors when refreshing `/patient/dashboard`, `/doctor/queue`, etc.).
2. **API route forwarding** (maps `/api/...` calls directly to `/backend/api/...`).
3. **Uploads routing** (serves patient/doctor images).

Paste the following content into `.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # 1. Forward API requests to the PHP backend
  RewriteRule ^api/(.*)$ backend/api/$1 [L,QSA]

  # 2. Allow direct access to uploaded media files
  RewriteRule ^uploads/(.*)$ uploads/$1 [L]

  # 3. If the requested file or directory exists physically, serve it directly
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # 4. For all other React Router routes, serve the single-page app index.html
  RewriteRule ^ index.html [L]
</IfModule>

# Optional security headers & gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css application/json application/javascript
</IfModule>

# Prevent directory browsing
Options -Indexes
```

---

### Step 5: Configure Folder Permissions
Ensure the web server can write uploaded photos to the uploads directory:
- `uploads/` folder permission: **`755`** or **`775`**
- `uploads/patients/` folder permission: **`755`** or **`775`**
- `uploads/doctors/` folder permission: **`755`** or **`775`**

In cPanel File Manager:
- Right-click the `uploads` folder → **Change Permissions** → Set to `755` (Read & Execute for Group/World, Write for User).

---

## 3. Method 2: Linux VPS (Ubuntu + Nginx + PHP 8.2-FPM + MySQL)

For dedicated performance and custom server environments (AWS EC2, DigitalOcean Droplet, Linode, Hetzner).

### Step 1: Install Required Packages
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx mysql-server php8.2-fpm php8.2-mysql php8.2-mbstring php8.2-curl git nodejs npm certbot python3-certbot-nginx
```

---

### Step 2: Database Setup
```bash
sudo mysql -u root
```
In MySQL console:
```sql
CREATE DATABASE flowcare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'flowcare_user'@'localhost' IDENTIFIED BY 'StrongPassword123!';
GRANT ALL PRIVILEGES ON flowcare.* TO 'flowcare_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```
Import database schema:
```bash
mysql -u flowcare_user -p flowcare < /var/www/flowcare/backend/database.sql
```

---

### Step 3: Clone Code & Build Frontend
```bash
cd /var/www
sudo git clone https://github.com/SajithNuski/Flowcare-clinic-management-system.git flowcare
cd /var/www/flowcare/frontend
sudo npm install
sudo npm run build
```

---

### Step 4: Configure Permissions
```bash
sudo chown -R www-data:www-data /var/www/flowcare
sudo chmod -R 755 /var/www/flowcare
sudo chmod -R 775 /var/www/flowcare/uploads
```

---

### Step 5: Nginx Server Block Configuration
Create an Nginx configuration file:
```bash
sudo nano /etc/nginx/sites-available/flowcare
```
Paste this complete configuration (replace `yourdomain.com` with your real domain):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend React build directory
    root /var/www/flowcare/frontend/dist;
    index index.html;

    # Static assets caching
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }

    # Uploaded image files
    location /uploads/ {
        alias /var/www/flowcare/uploads/;
        try_files $uri =404;
    }

    # Backend PHP API routing
    location /api/ {
        # Rewrite /api/auth/login.php to backend/api/auth/login.php
        alias /var/www/flowcare/backend/api/;
        try_files $uri $uri/ @php_api;

        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }

    # Fallback handler for API requests
    location @php_api {
        rewrite ^/api/(.*)$ /backend/api/$1 last;
    }

    # React Router Single Page Application fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/flowcare /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx php8.2-fpm
```

---

### Step 6: Enable Free SSL (HTTPS) with Certbot
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
Certbot will automatically obtain an SSL certificate, configure HTTPS redirection, and set up automatic renewal.

---

## 4. Method 3: Decoupled Cloud (Vercel Frontend + PHP Backend)

If you prefer hosting the React frontend on **Vercel** and the PHP backend on a separate server:

### 1. Backend Server Setup
Deploy the `backend/` and `uploads/` directories to a PHP hosting provider (e.g. `https://api.yourdomain.com`).

### 2. Configure Frontend Vercel Rewrites (`vercel.json`)
In `flowcare/frontend/`, create a `vercel.json` file:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.yourdomain.com/backend/api/:path*"
    },
    {
      "source": "/uploads/:path*",
      "destination": "https://api.yourdomain.com/uploads/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 3. Deploy to Vercel
Connect your GitHub repository to Vercel, set the **Root Directory** to `frontend`, and deploy.

---

## 5. Post-Deployment Verification & Troubleshooting

After deployment, test the following checklist:

| Check | Expected Behavior | Troubleshooting if Failed |
| :--- | :--- | :--- |
| **Landing Page** | `https://yourdomain.com/` loads clean medical UI and styles | Verify `assets/` path in `index.html`. Check file permissions. |
| **Page Refresh** | Refreshing `/login` or `/patient/dashboard` does not show 404 | Ensure `.htaccess` (Apache) or `try_files` (Nginx) is configured. |
| **User Login** | Successful login stores token in sessionStorage | Open Browser DevTools (F12) → Network tab. Check response of `/api/auth/login.php`. Ensure `db.php` credentials match. |
| **Queue Polling** | Doctor queue updates smoothly every 8-10 seconds | Check Console for any 401 or 500 errors. Verify PHP sessions. |
| **Image Uploads** | Profile photos and clinic assets display properly | Check `uploads/` permissions (`chmod 755` or `775`). |
| **Print Views** | Consultation slip prints formatted receipt without UI chrome | Test clicking "View & Print Clinical Slip" in patient portal. |

---

## 6. Default Administrative Credentials

The database seed (`backend/database.sql`) contains initial test credentials for testing the deployed environment:

| Role | Username / Identifier (NIC or Email) | Password | Default Portal URL |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@flowcare.com` *(or NIC `901234567V`)* | `admin123` | `/admin/dashboard` |
| **Doctor** | `doctor@flowcare.com` *(or NIC `851234567V`)* | `doctor123` | `/doctor/dashboard` |
| **Receptionist** | `reception@flowcare.com` *(or NIC `921234567V`)* | `recep123` | `/receptionist/dashboard` |
| **Patient** | `patient@flowcare.com` *(or NIC `981234567V`)* | `patient123` | `/patient/dashboard` |

> ⚠️ **Security Warning:** Change these default passwords immediately after initial deployment using the **Change Password** feature or directly in the database.
