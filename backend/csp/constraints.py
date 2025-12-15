"""
Constraint definitions for timetable CSP
Implements hard constraints for academic structure
"""

class Constraint:
    """Base constraint class"""
    def is_satisfied(self, assignment):
        """Check if constraint is satisfied by current assignment"""
        raise NotImplementedError


class NoInstructorConflictConstraint(Constraint):
    """No instructor can teach multiple classes at the same time"""
    def __init__(self, variables, debug=False):
        self.variables = variables
        self.debug = debug

    def is_satisfied(self, assignment):
        instructor_schedule = {}
        for var_id, domain in assignment.items():
            instructor = domain.instructor
            timeslot = domain.timeslot
            variable = self.variables[var_id]
            key = (instructor, timeslot)
            instructor_schedule.setdefault(key, []).append(variable)

        for (instructor, timeslot), variables in instructor_schedule.items():
            if len(variables) > 1:
                full_duration_count = sum(1 for var in variables if getattr(var, 'duration', 1.0) == 1.0)
                tutorial_count = sum(1 for var in variables if getattr(var, 'duration', 1.0) == 0.5)
                if full_duration_count > 1 or tutorial_count > 2:
                    if self.debug:
                        print(f"[NoInstructorConflict] Instructor '{instructor}' conflict at '{timeslot}': "
                              f"{len(variables)} assignments, full={full_duration_count}, tut={tutorial_count}")
                    return False
                if full_duration_count > 0 and tutorial_count > 0:
                    if self.debug:
                        print(f"[NoInstructorConflict] Instructor '{instructor}' mix full+tutorial at '{timeslot}'")
                    return False
        return True


class NoRoomConflictConstraint(Constraint):
    """Room capacity-aware constraint allowing strategic sharing"""
    def __init__(self, variables, rooms=None, debug=False):
        self.variables = variables
        self.rooms = {room['room_id']: room for room in rooms} if rooms else {}
        self.debug = debug

    def is_satisfied(self, assignment):
        room_schedule = {}
        for var_id, domain in assignment.items():
            room = domain.room
            timeslot = domain.timeslot
            variable = self.variables[var_id]
            key = (room, timeslot)
            room_schedule.setdefault(key, []).append(variable)

        for (room, timeslot), variables in room_schedule.items():
            if len(variables) > 1:
                room_info = self.rooms.get(room, {'capacity': 15})
                try:
                    room_capacity = int(room_info.get('capacity', 15))
                except Exception:
                    room_capacity = 15
                total_students = 0
                for var in variables:
                    stype = getattr(var, 'session_type', '').lower() or ''
                    if stype == 'lecture':
                        total_students += 45
                    else:
                        total_students += 15

                if total_students > room_capacity:
                    if self.debug:
                        print(f"[NoRoomConflict] Room '{room}' over capacity at '{timeslot}': need {total_students}, cap {room_capacity}")
                    return False

                full_duration_count = sum(1 for var in variables if getattr(var, 'duration', 1.0) == 1.0)
                tutorial_count = sum(1 for var in variables if getattr(var, 'duration', 1.0) == 0.5)

                if full_duration_count > 1:
                    if self.debug:
                        print(f"[NoRoomConflict] Room '{room}' has multiple full classes at '{timeslot}'")
                    return False
                if tutorial_count > 2:
                    if self.debug:
                        print(f"[NoRoomConflict] Room '{room}' has {tutorial_count} tutorials at '{timeslot}' (max 2)")
                    return False
                if full_duration_count > 0 and tutorial_count > 0:
                    if self.debug:
                        print(f"[NoRoomConflict] Room '{room}' mixes full class and tutorial at '{timeslot}'")
                    return False
        return True


class RoomTypeConstraint(Constraint):
    """Room type must match course type"""
    def __init__(self, variables, rooms, debug=False):
        self.variables = variables
        self.rooms = {room['room_id']: room for room in rooms}
        self.debug = debug

    def is_satisfied(self, assignment):
        for var_id, domain in assignment.items():
            variable = self.variables[var_id]
            room = self.rooms.get(domain.room)
            if not room:
                if self.debug:
                    print(f"[RoomTypeConstraint] Room '{domain.room}' not found for var {var_id}")
                return False
            room_type = room.get('type', '').strip().lower()
            session_type = (getattr(variable, 'session_type', '') or '').strip().lower()
            if session_type == 'lab' and room_type != 'lab':
                if self.debug:
                    print(f"[RoomTypeConstraint] var {var_id}: session 'lab' but room '{domain.room}' type='{room_type}'")
                return False
            if session_type in ['lecture', 'tutorial', 'project'] and room_type not in ['lecture', 'classroom']:
                if self.debug:
                    print(f"[RoomTypeConstraint] var {var_id}: session '{session_type}' not allowed in room type '{room_type}'")
                return False
        return True


class InstructorQualificationConstraint(Constraint):
    """Instructor must be qualified to teach the course"""
    def __init__(self, variables, instructors, debug=False):
        self.variables = variables
        self.debug = debug
        self.instructor_qualifications = {}
        for instructor in instructors:
            name = instructor.get('name')
            quals = instructor.get('qualifications', '')
            qualifications = [q.strip() for q in quals.split(',')] if quals else []
            if name:
                self.instructor_qualifications[name] = qualifications

    def is_satisfied(self, assignment):
        for var_id, domain in assignment.items():
            variable = self.variables[var_id]
            instructor = domain.instructor
            course_id = getattr(variable, 'course_id', None)
            qualifications = self.instructor_qualifications.get(instructor, [])
            if course_id not in qualifications:
                if self.debug:
                    print(f"[InstructorQualification] var {var_id}: instructor '{instructor}' not qualified for '{course_id}' (quals: {qualifications})")
                return False
        return True


class NoStudentConflictConstraint(Constraint):
    """Flexible constraint allowing strategic section merging based on room capacity"""
    def __init__(self, variables, sections, rooms=None, debug=False):
        self.variables = variables
        self.rooms = {room['room_id']: room for room in rooms} if rooms else {}
        self.debug = debug
        self.section_to_group = {}
        for section in sections:
            year = int(section['year'])
            group = int(section['group'])
            section_id = int(section['section'])
            self.section_to_group[(year, section_id)] = group

    def is_satisfied(self, assignment):
        timeslot_room_schedule = {}
        for var_id, domain in assignment.items():
            timeslot = domain.timeslot
            room = domain.room
            variable = self.variables[var_id]
            key = (timeslot, room)
            timeslot_room_schedule.setdefault(key, []).append((variable, domain))

        for (timeslot, room), var_domain_pairs in timeslot_room_schedule.items():
            if not self._check_room_capacity_conflicts(room, var_domain_pairs):
                if self.debug:
                    print(f"[NoStudentConflict] Room check failed for room '{room}' at '{timeslot}'")
                return False

        timeslot_schedule = {}
        for var_id, domain in assignment.items():
            timeslot = domain.timeslot
            variable = self.variables[var_id]
            timeslot_schedule.setdefault(timeslot, []).append((variable, domain))

        for timeslot, var_domain_pairs in timeslot_schedule.items():
            if not self._check_student_conflicts(var_domain_pairs):
                if self.debug:
                    print(f"[NoStudentConflict] Student conflict detected at '{timeslot}'")
                return False
        return True

    def _check_room_capacity_conflicts(self, room, var_domain_pairs):
        room_info = self.rooms.get(room, {'capacity': 15})
        try:
            room_capacity = int(room_info.get('capacity', 15))
        except Exception:
            room_capacity = 15
        total_students = 0
        section_classes = []
        group_classes = []
        for variable, domain in var_domain_pairs:
            year = getattr(variable, 'year', None) or self._extract_year_from_course_id(getattr(variable, 'course_id', ''))
            stype = getattr(variable, 'session_type', '').lower()
            if stype == 'lecture' and getattr(variable, 'group_id', None):
                group_classes.append((variable, domain, year))
                total_students += 45
            elif getattr(variable, 'section_id', None):
                section_classes.append((variable, domain, year))
                total_students += 15

        if total_students > room_capacity:
            if self.debug:
                print(f"[NoStudentConflict::_check_room_capacity] room '{room}' cap {room_capacity} < need {total_students}")
            return False
        if len(section_classes) > 2:
            if self.debug:
                print(f"[NoStudentConflict::_check_room_capacity] room '{room}' has {len(section_classes)} sections (>2)")
            return False
        if len(group_classes) > 1:
            if self.debug:
                print(f"[NoStudentConflict::_check_room_capacity] room '{room}' has {len(group_classes)} group lectures (>1)")
            return False
        return True

    def _check_student_conflicts(self, var_domain_pairs):
        occupied_groups = set()
        occupied_sections = set()
        for variable, domain in var_domain_pairs:
            year = getattr(variable, 'year', None) or self._extract_year_from_course_id(getattr(variable, 'course_id', ''))
            stype = getattr(variable, 'session_type', '').lower()
            if stype == 'lecture' and getattr(variable, 'group_id', None):
                group_key = (year, variable.group_id)
                if group_key in occupied_groups:
                    if self.debug:
                        print(f"[NoStudentConflict::_check_student_conflicts] group {group_key} double-booked")
                    return False
                occupied_groups.add(group_key)
                for (sec_year, section_id), sec_group in self.section_to_group.items():
                    if sec_year == year and sec_group == variable.group_id:
                        occupied_sections.add((year, section_id))
            elif getattr(variable, 'section_id', None):
                section_id = int(variable.section_id)
                section_key = (year, section_id)
                if section_key in occupied_sections:
                    if self.debug:
                        print(f"[NoStudentConflict::_check_student_conflicts] section {section_key} double-booked")
                    return False
                occupied_sections.add(section_key)
        return True

    def _extract_year_from_course_id(self, course_id):
        """Extract year from course ID (handles new format with L/B/T suffixes)"""
        import re
        # Handle new format: CSC 111L, AID 312B, etc.
        match = re.search(r'(\d)(\d)\d[LBT]?', str(course_id))
        if match:
            first_digit = int(match.group(1))
            second_digit = int(match.group(2))
            if 1 <= first_digit <= 4:
                return first_digit
            elif 1 <= second_digit <= 4:
                return second_digit
        return 1


class ConstraintManager:
    """Manages all constraints for the CSP, with diagnostic helpers"""
    def __init__(self, variables, courses, instructors, rooms, sections, debug=False):
        self.debug = debug
        self.hard_constraints = [
            NoInstructorConflictConstraint(variables, debug=debug),
            NoRoomConflictConstraint(variables, rooms, debug=debug),
            RoomTypeConstraint(variables, rooms, debug=debug),
            InstructorQualificationConstraint(variables, instructors, debug=debug),
            NoStudentConflictConstraint(variables, sections, rooms, debug=debug)
        ]

    def check_hard_constraints(self, assignment):
        """Return True if all constraints satisfied; if debug, prints which failed."""
        for constraint in self.hard_constraints:
            ok = constraint.is_satisfied(assignment)
            if not ok:
                if self.debug:
                    print(f"[ConstraintManager] Constraint failed: {constraint.__class__.__name__}")
                return False
        return True

    def diagnose_assignment(self, assignment):
        """
        Run each hard constraint separately and return a list of (constraint_name, result, message).
        Also prints detailed debug information if debug=True.
        """
        results = []
        for constraint in self.hard_constraints:
            try:
                ok = constraint.is_satisfied(assignment)
                msg = "OK" if ok else "FAILED"
            except Exception as e:
                ok = False
                msg = f"ERROR: exception raised: {e!r}"
            results.append((constraint.__class__.__name__, ok, msg))
            if self.debug:
                print(f"[diagnose] {constraint.__class__.__name__}: {msg}")
        return results
