"""
Flask Web Server for Timetable CSP
Provides REST API for timetable generation
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import sys

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.csv_loader import CSVDataLoader
from csp.csp_solver import TimetableSolver

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Initialize data loader
data_loader = CSVDataLoader('data')

@app.route('/')
def index():
    """Serve the main HTML page"""
    return send_from_directory('../frontend', 'index.html')

@app.route('/style.css')
def serve_css():
    """Serve CSS file"""
    return send_from_directory('../frontend', 'style.css')

@app.route('/app.js')
def serve_js():
    """Serve JavaScript file"""
    return send_from_directory('../frontend', 'app.js')

@app.route('/api/data-summary', methods=['GET'])
def get_data_summary():
    """Get summary of loaded data"""
    try:
        # Validate data files
        is_valid, message = data_loader.validate_data()
        
        if not is_valid:
            return jsonify({
                'success': False,
                'error': message
            }), 400
        
        summary = data_loader.get_data_summary()
        
        return jsonify({
            'success': True,
            'summary': summary,
            'message': 'Data loaded successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/generate', methods=['POST'])
def generate_timetable():
    """Generate timetable using CSP solver"""
    try:
        print("Starting Timetable Generation...")
        
        # Validate data files first
        is_valid, message = data_loader.validate_data()
        if not is_valid:
            return jsonify({
                'success': False,
                'error': f"Data validation failed: {message}"
            }), 400
        
        # Get data summary
        summary = data_loader.get_data_summary()
        print(f"Data summary: {summary}")
        
        # Create solver and generate timetable
        solver = TimetableSolver(data_loader)
        timetable = solver.generate_timetable()
        
        if timetable:
            print(f"✅ Successfully generated timetable with {len(timetable)} classes")
            
            return jsonify({
                'success': True,
                'summary': summary,
                'timetable': timetable,
                'message': f'Generated timetable with {len(timetable)} classes'
            })
        else:
            print("❌ Failed to generate timetable")
            return jsonify({
                'success': False,
                'error': 'No solution found. Please check constraints and data.'
            }), 400
            
    except Exception as e:
        print(f"❌ Error generating timetable: {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/validate', methods=['GET'])
def validate_data():
    """Validate data files and constraints"""
    try:
        # Basic file validation
        is_valid, message = data_loader.validate_data()
        
        if not is_valid:
            return jsonify({
                'success': False,
                'error': message
            })
        
        # Load data for detailed validation
        courses = data_loader.load_courses()
        instructors = data_loader.load_instructors()
        rooms = data_loader.load_rooms()
        sections = data_loader.load_sections()
        timeslots = data_loader.load_timeslots()
        
        validation_results = {
            'files_valid': True,
            'courses_count': len(courses),
            'instructors_count': len(instructors),
            'rooms_count': len(rooms),
            'sections_count': len(sections),
            'timeslots_count': len(timeslots),
            'warnings': [],
            'errors': []
        }
        
        # Check for basic data integrity
        if len(courses) == 0:
            validation_results['errors'].append("No courses found")
        
        if len(instructors) == 0:
            validation_results['errors'].append("No instructors found")
        
        if len(rooms) == 0:
            validation_results['errors'].append("No rooms found")
        
        # Check academic structure
        years = set()
        for section in sections:
            if 'year' in section:
                years.add(section['year'])
        
        validation_results['years_found'] = list(years)
        
        # Check room types
        room_types = {}
        for room in rooms:
            room_type = room.get('type', 'unknown').lower()
            room_types[room_type] = room_types.get(room_type, 0) + 1
        
        validation_results['room_types'] = room_types
        
        return jsonify({
            'success': True,
            'validation': validation_results
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("Starting Timetable CSP Server...")
    print("Academic Structure:")
    print("- 1 Year = 3 Groups")
    print("- 1 Group = 3 Sections")
    print("- Each Year uses 4 days (1 rest day)")
    print("- Lectures: Group-level (3 sections together)")
    print("- Labs: Section-level (individual sections)")
    print("- Tutorials: Section-level (half time slots)")
    print()
    
    # Check if data directory exists
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
        print(f"Created data directory: {data_dir}")
        print("Please add your CSV files to the data directory:")
        print("- courses.csv (course_id, course, type, Year, Semester)")
        print("- instructors.csv (name, qualifications)")
        print("- rooms.csv (room_id, type, capacity)")
        print("- sections.csv (section, group, year, student)")
        print("- timeslots.csv (day, start_time, end_time)")
        print()
    
    summary = data_loader.get_data_summary()
    print(f"Data summary: {summary}")
    print()
    
    app.run(host='0.0.0.0', port=5000, debug=True)