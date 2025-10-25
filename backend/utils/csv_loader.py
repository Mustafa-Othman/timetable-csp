"""
CSV Data Loader for Timetable CSP
Loads and validates CSV data files
"""

import csv
import os


class CSVDataLoader:
    """Loads CSV data files for timetable generation"""
    
    def __init__(self, data_dir='data'):
        self.data_dir = data_dir
    
    def load_courses(self):
        """Load courses from CSV file"""
        return self._load_csv_flexible('courses.csv')
    
    def load_instructors(self):
        """Load instructors from CSV file"""
        return self._load_csv_flexible('Instructor.csv', 'instructors.csv')
    
    def load_rooms(self):
        """Load rooms from CSV file"""
        return self._load_csv_flexible('rooms.csv', 'Rooms.csv')
    
    def load_sections(self):
        """Load sections from CSV file"""
        return self._load_csv_flexible('sections.csv', 'Sections.csv')
    
    def load_timeslots(self):
        """Load timeslots from CSV file"""
        return self._load_csv_flexible('timeslots.csv')
    
    def _load_csv_flexible(self, *possible_filenames):
        """Load CSV with flexible filename matching"""
        for filename in possible_filenames:
            file_path = os.path.join(self.data_dir, filename)
            if os.path.exists(file_path):
                return self._load_csv(file_path)
        
        # Also try capitalized versions
        for filename in possible_filenames:
            capitalized = filename.replace('.csv', '').capitalize() + '.csv'
            file_path = os.path.join(self.data_dir, capitalized)
            if os.path.exists(file_path):
                return self._load_csv(file_path)
        
        print(f"Warning: None of {possible_filenames} found")
        return []
    
    def _load_csv(self, file_path):
        """Generic CSV loader"""
        if not os.path.exists(file_path):
            print(f"Warning: {file_path} not found")
            return []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                # Try UTF-8 first, fallback to other encodings if needed
                reader = csv.DictReader(file)
                data = list(reader)
                
                # Clean up any BOM characters
                if data and data[0]:
                    first_key = list(data[0].keys())[0]
                    if first_key.startswith('\ufeff'):
                        # Remove BOM from first column name
                        clean_key = first_key.replace('\ufeff', '')
                        for row in data:
                            row[clean_key] = row.pop(first_key)
                
                return data
                
        except UnicodeDecodeError:
            # Try with different encoding
            try:
                with open(file_path, 'r', encoding='cp1252') as file:
                    reader = csv.DictReader(file)
                    return list(reader)
            except Exception as e:
                print(f"Error loading {file_path}: {e}")
                return []
        except Exception as e:
            print(f"Error loading {file_path}: {e}")
            return []
    
    def get_data_summary(self):
        """Get summary of loaded data"""
        # Count unique base courses (remove L/B/T suffixes)
        courses = self.load_courses()
        unique_courses = set()
        
        for course in courses:
            course_id = course.get('course_id', '')
            # Remove L/B/T suffix to get base course ID
            base_course_id = course_id.rstrip('LBT')
            unique_courses.add(base_course_id)
        
        return {
            'courses': len(unique_courses),
            'instructors': len(self.load_instructors()),
            'rooms': len(self.load_rooms()),
            'sections': len(self.load_sections()),
            'timeslots': len(self.load_timeslots())
        }
    
    def validate_data(self):
        """Validate that all required data files exist and have content"""
        # Check if files have content by trying to load them
        summary = self.get_data_summary()
        empty_files = [k for k, v in summary.items() if v == 0]
        
        if empty_files:
            return False, f"Empty or missing files: {empty_files}"
        
        return True, "All data files are valid"