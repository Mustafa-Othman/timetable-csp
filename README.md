# Automated Timetable Generation as a Constraint Satisfaction Problem (CSP)

## Project Overview
Timetable generation system for CSIT department using CSP approach with specific academic structure constraints.

## Academic Structure
- **1 Year = 3 Groups**
- **1 Group = 3 Sections**
- **Each Year uses only 4 days out of 5** (1 rest day per year)

## Course Scheduling Rules
- **Lecture**: Whole group (3 sections together) in 1 time slot
- **Lab**: Each section separately in any time slot (4 days available)
- **Tutorial**: Each section separately in any half time slot (4 days available)

## Project Structure
```
timetable-csp/
├── backend/
│   ├── app.py                  # Flask server, API /generate
│   ├── csp/
│   │   ├── csp_solver.py       # CSP solver with academic constraints
│   │   ├── constraints.py      # Hard constraints implementation
│   │   ├── model.py            # Variables and Domains
│   ├── data/                   # CSV data files (to be added)
│   │   ├── courses.csv         # Course information with Year column
│   │   ├── instructors.csv     # Instructor qualifications
│   │   ├── rooms.csv           # Room types and capacity
│   │   ├── sections.csv        # Section groupings
│   │   └── timeslots.csv       # Available time slots
│   └── utils/
│       └── csv_loader.py       # CSV data loading utilities
├── frontend/
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