# 🛡️ CloudSentinel - Zero-Trust Secure File Storage

A modern, enterprise-grade secure file storage system with Zero-Trust architecture, built with Flask and AWS S3.

## Preview  

![Image](https://github.com/user-attachments/assets/8f014d22-8b36-45ad-85d8-40fa6c43c6ec)

![Image](https://github.com/user-attachments/assets/3d69c1e5-31f5-4063-bfee-6431eaee1e1f)

![Image](https://github.com/user-attachments/assets/0174a55c-97c8-4509-81f6-ef7d8abbe31e)

![Image](https://github.com/user-attachments/assets/202cd172-86ac-4504-8bcc-f6839e2a55b8)

![Image](https://github.com/user-attachments/assets/49c23f6a-b337-4cf4-be46-c797de64ef7a)

## ✨ Features

### 🔐 Security Features
- **AES-256 Encryption** - Military-grade file encryption
- **Zero-Trust Architecture** - Multi-layer access verification
- **JWT Authentication** - Secure user sessions
- **Time-Based Access Control** - Files accessible only during specific hours
- **Location-Based Access** - Geographic access restrictions
- **Complete Audit Logging** - Track every action

### 📁 File Management
- Secure file upload with client-side encryption
- Encrypted storage in AWS S3
- Password-protected file download and decryption
- File sharing with granular permissions
- Access control management

### 👥 User Management
- User registration and authentication
- Role-based access control
- User activity tracking
- Security reports and analytics

### 🎨 Modern UI
- Beautiful glassmorphism design
- Responsive dashboard
- Real-time statistics
- Smooth animations and transitions

## 🏗️ Architecture
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend    │────▶│   AWS S3    │
│  (HTML/JS)  │     │   (Flask)    │     │  (Storage)  │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Database   │
                    │    (JSON)    │
                    └──────────────┘
```

### Backend Components
- **Flask API** - RESTful API server
- **Encryption Module** - AES-256 with PBKDF2 key derivation
- **AWS Handler** - S3 integration and file management
- **User Manager** - Authentication and user operations
- **Access Control** - Zero-Trust policy enforcement
- **Audit Logger** - Security event tracking

### Frontend Components
- **Authentication Pages** - Login/Register
- **Dashboard** - Statistics and overview
- **Upload Interface** - File encryption and upload
- **File Manager** - Browse and manage files
- **Audit Viewer** - Security logs

## 🚀 Getting Started

### Prerequisites
- Python 3.10 or higher
- AWS Account with S3 access
- Modern web browser

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/cloudsentinel.git
cd cloudsentinel
```

2. **Create virtual environment**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables**
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your actual credentials
# Add your AWS credentials and JWT secret
```

5. **Set up AWS S3**
- Create an S3 bucket in AWS Console
- Generate AWS access keys
- Update `.env` with your credentials

### Running the Application

1. **Start the backend server**
```bash
cd backend
python app.py
```
Server will run on `http://127.0.0.1:5000`

2. **Start the frontend** (in a new terminal)
- Open `frontend/index.html` with Live Server in VS Code
- Or serve it with any HTTP server

3. **Access the application**
- Open browser and go to `http://127.0.0.1:5500/frontend/index.html`
- Create an account or login

## 📋 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

### File Operations

#### Upload File
```http
POST /api/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: <binary>
password: string
allowed_users: string (comma-separated)
access_start_time: string (HH:MM)
access_end_time: string (HH:MM)
allowed_regions: string (comma-separated)
```

#### Download File
```http
POST /api/download/{file_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "password": "string"
}
```

#### List Files
```http
GET /api/files
Authorization: Bearer {token}
```

### Audit Endpoints

#### Get User Activity
```http
GET /api/audit/me?limit=50
Authorization: Bearer {token}
```

## 🔒 Security Features Explained

### Zero-Trust Access Control
Every file access request goes through three verification layers:

1. **User Permission Check**
   - Verifies user is in the file's allowed users list
   - Owner always has access

2. **Time-Based Verification**
   - Checks current time against access window
   - Example: File only accessible 9 AM - 6 PM

3. **Location-Based Verification**
   - Checks user's IP geolocation
   - Restricts access to allowed regions

### Encryption Flow

**Upload:**
```
File → Password → PBKDF2 Key Derivation → AES-256 Encryption → AWS S3
```

**Download:**
```
AWS S3 → Zero-Trust Check → AES-256 Decryption → Original File
```

## 🧪 Testing

Run the zero-trust tests:
```bash
python test_zerotrust.py
```

This will test:
- User registration and login
- File upload with encryption
- Access control enforcement
- Permission management
- Audit logging

## 📂 Project Structure
```
cloudsentinel/
├── backend/
│   ├── app.py                 # Main Flask application
│   ├── encryption.py          # AES-256 encryption module
│   ├── aws_handler.py         # AWS S3 operations
│   ├── user_manager.py        # User authentication
│   ├── access_control.py      # Zero-Trust policies
│   ├── audit_logger.py        # Security logging
│   └── database.py            # JSON database handler
├── frontend/
│   ├── index.html             # Login/Register page
│   ├── pages/
│   │   ├── dashboard.html     # Dashboard
│   │   ├── upload.html        # File upload
│   │   ├── files.html         # File management
│   │   └── audit.html         # Audit logs
│   ├── css/
│   │   ├── style.css          # Global styles
│   │   ├── auth.css           # Authentication styles
│   │   └── dashboard.css      # Dashboard styles
│   └── js/
│       ├── api.js             # API client
│       ├── auth.js            # Authentication logic
│       ├── dashboard.js       # Dashboard logic
│       ├── upload.js          # Upload logic
│       └── utils.js           # Utility functions
├── database/                  # JSON database files (gitignored)
├── requirements.txt           # Python dependencies
├── .env.example              # Environment template
└── README.md                 # This file
```

## 🛠️ Technologies Used

### Backend
- **Flask** - Web framework
- **boto3** - AWS SDK for Python
- **cryptography** - Encryption library
- **bcrypt** - Password hashing
- **flask-jwt-extended** - JWT authentication
- **python-dotenv** - Environment management

### Frontend
- **HTML5/CSS3** - Structure and styling
- **Vanilla JavaScript** - No frameworks, pure JS
- **Modern CSS** - Glassmorphism, gradients, animations

### Cloud Services
- **AWS S3** - Encrypted file storage
- **AWS KMS** - Key management (optional)

## 🎓 Educational Value

This project demonstrates:
- Secure application architecture
- Encryption and cryptography
- Zero-Trust security model
- Cloud storage integration
- RESTful API design
- Modern frontend development
- Security best practices

Perfect for:
- College projects
- Security coursework
- Learning cloud technologies
- Portfolio projects

## 🤝 Contributing

This is an educational project. Feel free to fork and improve!

## 📝 License

This project is for educational purposes.

## 👨‍💻 Author

**Your Name**
- BTech CSE Student
- Cloud Security Project

## 🙏 Acknowledgments

- AWS for cloud infrastructure
- Flask framework
- Cryptography library maintainers

---

**⚠️ Security Notice:** This project is for educational purposes. For production use, consider additional security measures like:
- PostgreSQL/MongoDB instead of JSON database
- AWS KMS for key management
- Rate limiting and DDoS protection
- Regular security audits
- HTTPS/SSL certificates
