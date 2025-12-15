"""
CSP Model for Timetable Generation
Defines variables and domains for the academic structure
"""

class Variable:
    """Represents a class session to be scheduled"""
    
    def __init__(self, course_id, section_id, session_type, group_id=None, duration=1.0, year=None):
        self.course_id = course_id
        self.section_id = section_id
        self.session_type = session_type  # 'lecture', 'lab', 'tutorial'
        self.group_id = group_id  # For lectures (group-level scheduling)
        self.duration = duration  # 1.0 for full slot, 0.5 for tutorial half-slot
        self.year = year  # Academic year used for conflict detection
        
        # Create unique variable ID
        if group_id:
            self.id = f"{course_id}|{group_id}|{session_type}"
        else:
            self.id = f"{course_id}|{section_id}|{session_type}"
    
    def __str__(self):
        return self.id
    
    def __repr__(self):
        return f"Variable({self.id})"


class Domain:
    """Represents possible assignments for a variable"""
    
    def __init__(self, timeslot, room, instructor):
        self.timeslot = timeslot
        self.room = room
        self.instructor = instructor
    
    def __str__(self):
        return f"({self.timeslot}, {self.room}, {self.instructor})"
    
    def __repr__(self):
        return self.__str__()


class CSPModel:
    """CSP Model containing variables and their domains"""
    
    def __init__(self):
        self.variables = {}  # variable_id -> Variable
        self.domains = {}    # variable_id -> [Domain]
        self.assignment = {} # variable_id -> Domain
    
    def add_variable(self, variable):
        """Add a variable to the model"""
        self.variables[variable.id] = variable
        self.domains[variable.id] = []
    
    def add_domain_value(self, variable_id, domain):
        """Add a domain value to a variable"""
        if variable_id in self.domains:
            self.domains[variable_id].append(domain)
    
    def get_unassigned_variables(self):
        """Get list of unassigned variables"""
        return [var_id for var_id in self.variables.keys() 
                if var_id not in self.assignment]
    
    def assign(self, variable_id, domain):
        """Assign a domain value to a variable"""
        self.assignment[variable_id] = domain
    
    def unassign(self, variable_id):
        """Remove assignment from a variable"""
        if variable_id in self.assignment:
            del self.assignment[variable_id]
    
    def is_complete(self):
        """Check if all variables are assigned"""
        return len(self.assignment) == len(self.variables)
    
    def get_variable_count(self):
        """Get total number of variables"""
        return len(self.variables)
    
    def get_domain_count(self, variable_id):
        """Get domain size for a variable"""
        return len(self.domains.get(variable_id, []))
