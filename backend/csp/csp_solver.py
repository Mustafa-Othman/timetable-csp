"""
CSP Solver for Timetable Generation
Implements minimum cost backtracking algorithm with academic structure constraints
"""

import time
from .model import CSPModel, Variable, Domain
from .constraints import ConstraintManager


class CSPSolver:
    """Generic CSP solver using minimum cost backtracking"""
    
    def __init__(self, model, constraint_manager):
        self.model = model
        self.constraint_manager = constraint_manager
        self.iterations = 0
        self.start_time = None
    
    def solve(self):
        """Solve the CSP using minimum cost approach with backtracking"""
        self.iterations = 0
        self.start_time = time.time()
        
        print("🔍 Using Minimum Cost CSP approach...")
        print(f"📊 Problem size: {len(self.model.variables)} variables")
        
        # Print domain statistics
        total_domains = sum(len(domains) for domains in self.model.domains.values())
        avg_domains = total_domains / len(self.model.variables) if self.model.variables else 0
        print(f"📊 Total domain values: {total_domains}, Average per variable: {avg_domains:.1f}")
        
        # Initialize best solution tracking
        self.best_solution = None
        self.best_cost = float('inf')
        
        print("🔍 Starting cost-based backtracking search...")
        
        # Try cost-based approach first
        if self._cost_based_backtrack():
            return self.best_solution
        
        # If cost-based fails, try simple backtracking
        print("⚠️ Cost-based approach failed, trying simple backtracking...")
        self.model.assignment = {}  # Reset assignments
        self.iterations = 0
        
        if self._simple_backtrack():
            print("✅ Simple backtracking found a solution")
            return self.model.assignment
        
        return None
    
    def _cost_based_backtrack(self):
        """Cost-based backtracking that finds first feasible solution quickly"""
        self.iterations += 1
        
        # Check timeout (30 seconds)
        if time.time() - self.start_time > 30:
            return self.best_solution is not None
        
        # Print progress every 1000 iterations
        if self.iterations % 1000 == 0:
            print(f"🔍 Iteration {self.iterations}, assigned: {len(self.model.assignment)}/{len(self.model.variables)}")
        
        if self.model.is_complete():
            # Found a complete solution - calculate its cost
            current_cost = self._calculate_solution_cost()
            if current_cost < self.best_cost:
                self.best_cost = current_cost
                self.best_solution = self.model.assignment.copy()
                print(f"💰 Found solution with cost: {current_cost:.2f}")
                # Return True to stop searching (first solution found)
                return True
            return True
        
        # Select unassigned variable
        variable_id = self._select_unassigned_variable()
        if not variable_id:
            return False
        
        # Order domain values by cost (lowest cost first)
        domain_values = self._order_domain_values_by_cost(variable_id)
        
        for domain in domain_values:
            if self._is_consistent(variable_id, domain):
                # Make assignment
                self.model.assign(variable_id, domain)
                
                # Recursive call - stop if solution found
                if self._cost_based_backtrack():
                    return True
                
                # Backtrack
                self.model.unassign(variable_id)
        
        return False
    
    def _simple_backtrack(self):
        """Simple backtracking without cost optimization"""
        self.iterations += 1
        
        # Check timeout (15 seconds for simple approach)
        if time.time() - self.start_time > 45:  # Total 45 seconds (30 for cost + 15 for simple)
            return False
        
        # Print progress
        if self.iterations % 500 == 0:
            print(f"🔍 Simple backtrack iteration {self.iterations}, assigned: {len(self.model.assignment)}/{len(self.model.variables)}")
        
        if self.model.is_complete():
            return True
        
        # Select unassigned variable (simple heuristic)
        variable_id = self._select_unassigned_variable()
        if not variable_id:
            return False
        
        # Try domain values in original order (no cost sorting)
        for domain in self.model.domains[variable_id]:
            if self._is_consistent(variable_id, domain):
                # Make assignment
                self.model.assign(variable_id, domain)
                
                # Recursive call
                if self._simple_backtrack():
                    return True
                
                # Backtrack
                self.model.unassign(variable_id)
        
        return False
    
    def _calculate_solution_cost(self):
        """Calculate the cost of current solution"""
        total_cost = 0.0
        
        for var_id, domain in self.model.assignment.items():
            variable = self.model.variables[var_id]
            
            # Time slot preference cost (prefer earlier times)
            time_cost = self._get_time_preference_cost(domain.timeslot)
            
            # Room utilization cost (prefer efficient room usage)
            room_cost = self._get_room_cost(variable, domain.room)
            
            # Instructor workload cost (prefer balanced workload)
            instructor_cost = self._get_instructor_cost(domain.instructor)
            
            # Day distribution cost (prefer spread across days)
            day_cost = self._get_day_distribution_cost(domain.timeslot)
            
            # Time slot distribution cost (prefer spread across time slots)
            timeslot_cost = self._get_timeslot_distribution_cost(domain.timeslot)
            
            total_cost += time_cost + room_cost + instructor_cost + day_cost + timeslot_cost
        
        return total_cost
    
    def _get_time_preference_cost(self, timeslot):
        """Equal cost for all time slots - no preference"""
        # All time slots have equal cost for even distribution
        return 1.0
    
    def _get_room_cost(self, variable, room):
        """Cost based on room type matching"""
        session_type = variable.session_type.lower()
        
        # Perfect match has lower cost
        if session_type == 'lab' and 'lab' in room.lower():
            return 0.5
        elif session_type == 'lecture' and ('lecture' in room.lower() or 'classroom' in room.lower()):
            return 0.5
        elif session_type == 'tutorial' and ('tutorial' in room.lower() or 'classroom' in room.lower()):
            return 0.5
        else:
            return 1.5  # Suboptimal room match
    
    def _get_instructor_cost(self, instructor):
        """Cost based on instructor workload (prefer balanced distribution)"""
        # Count how many classes this instructor already has
        instructor_load = sum(1 for domain in self.model.assignment.values() 
                            if domain.instructor == instructor)
        
        # Higher load = higher cost
        return instructor_load * 0.3
    
    def _get_day_distribution_cost(self, timeslot):
        """Equal cost for all days - no preference"""
        # All days have equal cost for even distribution
        return 0.0
    
    def _get_timeslot_distribution_cost(self, timeslot):
        """Cost based on timeslot distribution (prefer spread across time slots)"""
        # Count classes in this exact timeslot
        timeslot_load = sum(1 for domain in self.model.assignment.values() 
                           if domain.timeslot == timeslot)
        
        # Reduced penalty to make solutions easier to find
        return timeslot_load * 0.2
    
    def _order_domain_values_by_cost(self, variable_id):
        """Order domain values by their cost (lowest first)"""
        variable = self.model.variables[variable_id]
        domain_costs = []
        
        for domain in self.model.domains[variable_id]:
            # Calculate cost for this domain assignment
            cost = (self._get_time_preference_cost(domain.timeslot) +
                   self._get_room_cost(variable, domain.room) +
                   self._get_instructor_cost(domain.instructor) +
                   self._get_day_distribution_cost(domain.timeslot) +
                   self._get_timeslot_distribution_cost(domain.timeslot))
            
            domain_costs.append((cost, domain))
        
        # Sort by cost (lowest first)
        domain_costs.sort(key=lambda x: x[0])
        return [domain for cost, domain in domain_costs]
    
    def _backtrack(self):
        """Fallback simple backtracking"""
        return self._cost_based_backtrack()
    
    def _select_unassigned_variable(self):
        """Select variable using Most Constraining Variable heuristic"""
        unassigned = self.model.get_unassigned_variables()
        if not unassigned:
            return None
        
        # Choose variable with smallest domain (most constrained)
        return min(unassigned, key=lambda var_id: len(self.model.domains[var_id]))
    
    def _order_domain_values(self, variable_id):
        """Order domain values using Least Constraining Value heuristic"""
        # For now, return domains in original order
        # Could be improved with more sophisticated heuristics
        return self.model.domains[variable_id]
    
    def _is_consistent(self, variable_id, domain):
        """Check if assignment is consistent with constraints"""
        # Temporarily assign the value
        old_assignment = self.model.assignment.copy()
        self.model.assign(variable_id, domain)
        
        # Check constraints
        is_consistent = self.constraint_manager.check_hard_constraints(self.model.assignment)
        
        # Restore assignment
        self.model.assignment = old_assignment
        
        return is_consistent
    

    
    def _extract_year_from_course_id(self, course_id):
        """Extract year from course ID (handles new format with L/B/T suffixes)"""
        import re
        # Handle new format: CSC 111L, AID 312B, etc.
        match = re.search(r'(\d)(\d)\d[LBT]?', course_id)
        if match:
            first_digit = int(match.group(1))
            second_digit = int(match.group(2))
            if 1 <= first_digit <= 4:
                return first_digit
            elif 1 <= second_digit <= 4:
                return second_digit
        return 1


class TimetableSolver:
    """High-level timetable solver using CSP"""
    
    def __init__(self, data_loader):
        self.data_loader = data_loader
        self.model = None
        self.constraint_manager = None
    
    def generate_timetable(self):
        """Generate timetable using CSP approach"""
        # Load data
        courses = self.data_loader.load_courses()
        sections = self.data_loader.load_sections()
        instructors = self.data_loader.load_instructors()
        rooms = self.data_loader.load_rooms()
        timeslots = self.data_loader.load_timeslots()
        
        # Create CSP model
        self.model = self._create_model(courses, sections, timeslots, rooms, instructors)
        
        # Create constraints
        self.constraint_manager = self._create_constraints(courses, instructors, rooms, sections)
        
        # Solve CSP
        solver = CSPSolver(self.model, self.constraint_manager)
        print(f"🔍 Starting CSP solver with {self.model.get_variable_count()} variables...")
        
        solution = solver.solve()
        
        total_time = time.time() - solver.start_time
        print(f"🔍 Solver finished in {total_time:.2f}s after {solver.iterations} iterations")
        if hasattr(solver, 'best_cost') and solver.best_cost != float('inf'):
            print(f"💰 Final solution cost: {solver.best_cost:.2f}") 
        
        if solution:
            return self._format_solution(solution, courses, instructors, rooms, timeslots)
        else:
            return None
    
    def _create_model(self, courses, sections, timeslots, rooms, instructors):
        """Create CSP model with variables and domains"""
        model = CSPModel()
        
        # Group sections by year and group
        year_structure = self._analyze_academic_structure(sections)
        
        # Create variables for each course-section combination
        for course in courses:
            course_id = course['course_id']
            # Each course now has a single type (no more comma-separated types)
            course_types = [course['type'].strip()]
            course_year = int(course['Year'])
            
            # Get sections for this year
            year_sections = [s for s in sections if int(s['year']) == course_year]
            
            for course_type in course_types:
                course_type = course_type.lower()
                
                if course_type == 'lecture':
                    # Lectures: one variable per group (3 sections together)
                    groups = year_structure[course_year]
                    for group_id, group_sections in groups.items():
                        variable = Variable(course_id, None, course_type, group_id, 1.0)
                        model.add_variable(variable)
                        
                        # Create domains for this variable
                        domains = self._create_domains_for_variable(
                            variable, timeslots, rooms, instructors, course_year, course_id
                        )
                        for domain in domains:
                            model.add_domain_value(variable.id, domain)
                
                elif course_type in ['lab', 'tutorial']:
                    # Labs and tutorials: one variable per section
                    duration = 0.5 if course_type == 'tutorial' else 1.0
                    
                    for section in year_sections:
                        section_id = section['section']
                        variable = Variable(course_id, section_id, course_type, None, duration)
                        model.add_variable(variable)
                        
                        # Create domains for this variable
                        domains = self._create_domains_for_variable(
                            variable, timeslots, rooms, instructors, course_year, course_id
                        )
                        for domain in domains:
                            model.add_domain_value(variable.id, domain)
                
                elif course_type == 'project':
                    # Projects: one variable per group (like lectures but different type)
                    groups = year_structure[course_year]
                    for group_id, group_sections in groups.items():
                        variable = Variable(course_id, None, course_type, group_id, 1.0)
                        model.add_variable(variable)
                        
                        # Create domains for this variable
                        domains = self._create_domains_for_variable(
                            variable, timeslots, rooms, instructors, course_year, course_id
                        )
                        for domain in domains:
                            model.add_domain_value(variable.id, domain)
        
        return model
    
    def _analyze_academic_structure(self, sections):
        """Analyze sections to understand year/group structure"""
        year_structure = {}
        
        for section in sections:
            year = int(section['year'])
            group = int(section['group'])
            section_id = section['section']
            
            if year not in year_structure:
                year_structure[year] = {}
            
            if group not in year_structure[year]:
                year_structure[year][group] = []
            
            year_structure[year][group].append(section_id)
        
        return year_structure
    
    def _create_domains_for_variable(self, variable, timeslots, rooms, instructors, course_year, course_id):
        """Create domain values for a variable"""
        domains = []
        
        # Filter timeslots for this year (4 days out of 5)
        available_days = self._get_available_days_for_year(course_year)
        year_timeslots = [ts for ts in timeslots if ts['Day'] in available_days]
        
        # Filter rooms by type
        session_type = variable.session_type
        if session_type == 'lab':
            available_rooms = [r for r in rooms if r['type'].lower() == 'lab']
        else:  # lecture or tutorial
            available_rooms = [r for r in rooms if r['type'].lower() in ['lecture', 'classroom', 'tutorial']]
        
        # Filter instructors by qualification
        qualified_instructors = [
            i for i in instructors 
            if course_id in [q.strip() for q in i['qualifications'].split(',')]
        ]
        
        # Create all combinations
        for timeslot in year_timeslots:
            for room in available_rooms:
                for instructor in qualified_instructors:
                    domain = Domain(
                        f"{timeslot['Day']} {timeslot['StartTime']}",
                        room['room_id'],
                        instructor['name']
                    )
                    domains.append(domain)
        
        return domains
    
    def _get_available_days_for_year(self, year):
        """Get available days for a year (4 out of 5 days)"""
        all_days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
        
        # Each year gets a different rest day
        rest_day_index = (year - 1) % 5
        rest_day = all_days[rest_day_index]
        
        return [day for day in all_days if day != rest_day]
    
    def _create_constraints(self, courses, instructors, rooms, sections):
        """Create constraint manager"""
        return ConstraintManager(self.model.variables, courses, instructors, rooms, sections)
    
    def _format_solution(self, solution, courses, instructors, rooms, timeslots):
        """Format solution into readable timetable"""
        timetable = []
        
        # Create lookup dictionaries
        course_lookup = {c['course_id']: c for c in courses}
        
        for var_id, domain in solution.items():
            variable = self.model.variables[var_id]
            course = course_lookup[variable.course_id]
            
            # Determine sections involved
            if variable.group_id:
                # Lecture: whole group
                sections_involved = f"Group {variable.group_id}"
            else:
                # Lab/Tutorial: single section
                sections_involved = f"Section {variable.section_id}"
            
            timetable_entry = {
                'course_id': variable.course_id,
                'course_name': course['course'],
                'session_type': variable.session_type,
                'sections': sections_involved,
                'day_time': domain.timeslot,
                'room': domain.room,
                'instructor': domain.instructor,
                'duration': variable.duration
            }
            
            timetable.append(timetable_entry)
        
        return timetable



