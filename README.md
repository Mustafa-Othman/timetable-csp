# 🎓 Automated Timetable Generation System

## 📋 Project Overview
Advanced timetable generation system for CSIT department using **Greedy CSP Algorithm** with comprehensive academic structure constraints. Features modern web interface with multiple visualization modes and export capabilities.

## 🏫 Academic Structure
- **1 Year = 3 Groups**
- **1 Group = 3 Sections** (Total: 9 sections per year)
- **Each Year uses 4 days out of 5** (1 rest day per year, rotating)
- **4 Academic Years** with year-specific course assignments

## 📚 Course Scheduling Rules
- **Lectures**: Whole group (3 sections together) - 90 minutes
- **Labs**: Each section separately - 90 minutes  
- **Tutorials**: Each section separately - 45 minutes (half slot)
- **Projects**: Group-level scheduling - 90 minutes

## 🚀 Key Features

### 🧠 **Greedy CSP Algorithm**
- **Fast Performance**: Completes in seconds vs minutes
- **Course-Aware Prioritization**: Ensures complete course scheduling
- **Smart Variable Ordering**: Most constrained variables first
- **Intelligent Domain Selection**: Optimal time/room/instructor matching
- **Fallback Mechanism**: Simple backtracking if greedy fails

### 🎨 **Modern Web Interface**
- **Multiple View Modes**: Table, Day, and Grid views
- **Horizontal Weekly Grid**: Days as columns for easy visualization
- **Year Filtering**: Filter by academic year (1-4)
- **Real-time Statistics**: Course completion and resource utilization
- **Responsive Design**: Works on desktop and mobile

### 📊 **Export Capabilities**
- **PDF Export**: High-quality landscape timetable
- **Excel Export**: Structured spreadsheet with formatting
- **Multiple Formats**: Choose your preferred output format

### 🔧 **Advanced Constraints**
- **No Instructor Conflicts**: Prevents double-booking
- **Room Type Matching**: Labs in lab rooms, lectures in classrooms
- **Capacity Management**: Respects room capacity limits
- **Instructor Qualifications**: Only qualified instructors assigned
- **Student Conflict Prevention**: No scheduling conflicts for students

## 📁 Project Structure
```
timetable-csp/
├── backend/                    # Python Flask Backend
│   ├── app.py                  # Main Flask server with REST API
│   ├── csp/                    # CSP Algorithm Implementation
│   │   ├── csp_solver.py       # Greedy CSP solver with course-aware logic
│   │   ├── constraints.py      # Academic constraint definitions
│   │   └── model.py            # CSP variables and domains
│   ├── data/                   # CSV Data Files
│   │   ├── Courses.csv         # Course information (52 courses)
│   │   ├── Instructor.csv      # Instructor qualifications (53 instructors)
│   │   ├── Rooms.csv           # Room information (62 rooms)
│   │   ├── Sections.csv        # Academic structure (36 sections)
│   │   └── timeslots.csv       # Available time slots (20 slots)
│   └── utils/
│       └── csv_loader.py       # Flexible CSV data loading
├── frontend/                   # Modern Web Interface
│   ├── index.html              # Web interface
│   ├── style.css               # Styling
│   └── app.js                  # Frontend logic
└── README.md
```

## Installation & Setup
1. Install Python dependencies:
   ```bash
   pip install flask flask-cors
   ```

2. Add your CSV data files to the `backend/data/` directory

3. Start the server:
   ```bash
   cd backend
   python app.py
   ```

4. Open `http://localhost:5000` in your browser

## Expected CSV Format
- **courses.csv**: course_id, course, type, Year, Semester
- **instructors.csv**: name, qualifications (comma-separated course IDs)
- **rooms.csv**: room_id, type, capacity
- **sections.csv**: section, group, year, student
- **timeslots.csv**: day, start_time, end_time

## Features
- CSP-based scheduling with academic structure constraints
- Web interface for timetable generation and visualization
- Support for lectures (group-level), labs and tutorials (section-level)
- Automatic handling of year-specific day restrictions
- Tutorial half-slot optimization

output

Timetable generated with table view, daily view, and Grid view 
can download the table as a PDF or Excel file 
