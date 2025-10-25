#!/usr/bin/env python3
"""
Test script for the CSP solver
"""
import os
import sys

# Add backend to path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

from utils.csv_loader import CSVDataLoader
from csp.csp_solver import TimetableSolver

def test_solver():
    print("Testing Timetable CSP Solver...")
    
    # Initialize data loader
    data_loader = CSVDataLoader(os.path.join(backend_path, 'data'))
    
    # Check data
    print("Data summary:", data_loader.get_data_summary())
    
    # Test solver
    solver = TimetableSolver(data_loader)
    print("Generating timetable...")
    
    try:
        timetable = solver.generate_timetable()
        
        if timetable:
            print(f"Success! Generated timetable with {len(timetable)} classes:")
            for entry in timetable[:5]:  # Show first 5 entries
                print(f"  {entry['course_name']} - {entry['section_id']} - {entry['day']} {entry['start_time']} - {entry['room']} - {entry['instructor']}")
            if len(timetable) > 5:
                print(f"  ... and {len(timetable) - 5} more classes")
        else:
            print("No solution found!")
    
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_solver()