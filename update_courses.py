#!/usr/bin/env python3
"""
Update courses.csv to only include courses needed by sections
"""
import sys
import os

# Add backend to path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

from utils.csv_loader import CSVDataLoader

def update_courses():
    loader = CSVDataLoader(os.path.join(backend_path, 'data'))
    
    # Get courses needed by sections
    sections = loader.load_sections()
    courses_needed = set()
    for section in sections:
        courses = section['Courses'].split(',')
        courses_needed.update(c.strip() for c in courses)
    
    # Get current courses
    current_courses = loader.load_courses()
    
    # Filter to only needed courses
    needed_courses = []
    for course in current_courses:
        if course['CourseID'] in courses_needed:
            needed_courses.append(course)
    
    # Create missing courses with default values
    existing_ids = {c['CourseID'] for c in needed_courses}
    for course_id in courses_needed:
        if course_id not in existing_ids:
            # Create a default course entry
            needed_courses.append({
                'CourseID': course_id,
                'CourseName': course_id.replace('_', ' '),  # Simple name
                'Credits': '3',
                'Type': 'Lab' if 'LAB' in course_id.upper() else 'Lecture'
            })
    
    # Write updated courses.csv
    import csv
    courses_file = os.path.join(backend_path, 'data', 'courses.csv')
    with open(courses_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['CourseID', 'CourseName', 'Credits', 'Type'])
        writer.writeheader()
        writer.writerows(needed_courses)
    
    print(f"Updated courses.csv with {len(needed_courses)} courses")
    print("Courses included:", sorted([c['CourseID'] for c in needed_courses]))

if __name__ == '__main__':
    update_courses()