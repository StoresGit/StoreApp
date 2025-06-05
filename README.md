# True Presence - Attendance Management System

A full-stack attendance management system built with React (Frontend) and Django (Backend).

## Project Structure

```
Project/
├── attendance_frontend/    # React frontend application
└── attendance_portal/      # Django backend application
```

## Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- pip (Python package manager)
- npm (Node package manager)

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd attendance_portal
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run migrations:
   ```bash
   python manage.py migrate
   ```

5. Start the development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd attendance_frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Features

- Employee attendance tracking
- Report generation
- User authentication
- Admin dashboard
- Real-time updates

## API Documentation

The API documentation is available at `/api/docs/` when running the backend server.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 