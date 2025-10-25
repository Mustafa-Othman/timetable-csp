// Timetable CSP Generator Frontend JavaScript

class TimetableApp {
    constructor() {
        this.apiBase = '';
        this.currentTimetable = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.showStatus('Ready to generate timetable', 'info');
    }

    bindEvents() {
        document.getElementById('loadDataBtn').addEventListener('click', () => this.loadDataSummary());
        document.getElementById('validateBtn').addEventListener('click', () => this.validateData());
        document.getElementById('generateBtn').addEventListener('click', () => this.generateTimetable());
        document.getElementById('tableViewBtn').addEventListener('click', () => this.showTableView());
        document.getElementById('dayViewBtn').addEventListener('click', () => this.showDayView());
        document.getElementById('gridViewBtn').addEventListener('click', () => this.showGridView());

        // Dropdown filter will be initialized when timetable is displayed
    }

    async loadDataSummary() {
        this.showStatus('Loading data summary...', 'loading');

        try {
            const response = await fetch(`${this.apiBase}/api/data-summary`);
            const data = await response.json();

            if (data.success) {
                this.displayDataSummary(data.summary);
                this.showStatus(data.message, 'success');
            } else {
                this.showStatus(`Error: ${data.error}`, 'error');
            }
        } catch (error) {
            this.showStatus(`Network error: ${error.message}`, 'error');
        }
    }

    async validateData() {
        this.showStatus('Validating data...', 'loading');

        try {
            const response = await fetch(`${this.apiBase}/api/validate`);
            const data = await response.json();

            if (data.success) {
                this.displayValidationResults(data.validation);
                this.showStatus('Data validation completed', 'success');
            } else {
                this.showStatus(`Validation error: ${data.error}`, 'error');
            }
        } catch (error) {
            this.showStatus(`Network error: ${error.message}`, 'error');
        }
    }

    async generateTimetable() {
        this.showStatus('Generating timetable... This may take a moment.', 'loading');

        try {
            const response = await fetch(`${this.apiBase}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                this.currentTimetable = data.timetable;
                this.displayTimetable(data.timetable);
                this.displayTimetableStats(data.timetable);
                this.showStatus(data.message, 'success');
            } else {
                this.showStatus(`Generation failed: ${data.error}`, 'error');
            }
        } catch (error) {
            this.showStatus(`Network error: ${error.message}`, 'error');
        }
    }

    displayDataSummary(summary) {
        const container = document.getElementById('dataSummary');
        const content = document.getElementById('summaryContent');

        const summaryHtml = `
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="number">${summary.courses}</span>
                    <span class="label">Courses</span>
                </div>
                <div class="summary-item">
                    <span class="number">${summary.instructors}</span>
                    <span class="label">Instructors</span>
                </div>
                <div class="summary-item">
                    <span class="number">${summary.rooms}</span>
                    <span class="label">Rooms</span>
                </div>
                <div class="summary-item">
                    <span class="number">${summary.sections}</span>
                    <span class="label">Sections</span>
                </div>
                <div class="summary-item">
                    <span class="number">${summary.timeslots}</span>
                    <span class="label">Time Slots</span>
                </div>
            </div>
        `;

        content.innerHTML = summaryHtml;
        container.style.display = 'block';
    }

    displayValidationResults(validation) {
        const container = document.getElementById('validationResults');
        const content = document.getElementById('validationContent');

        let validationHtml = '<div class="validation-list">';

        // Basic counts
        validationHtml += `
            <div class="validation-item success">
                ✅ Found ${validation.courses_count} courses, ${validation.instructors_count} instructors, ${validation.rooms_count} rooms
            </div>
        `;

        // Years found
        if (validation.years_found && validation.years_found.length > 0) {
            validationHtml += `
                <div class="validation-item success">
                    ✅ Academic years: ${validation.years_found.join(', ')}
                </div>
            `;
        }

        // Room types
        if (validation.room_types) {
            const roomTypesList = Object.entries(validation.room_types)
                .map(([type, count]) => `${count} ${type}`)
                .join(', ');
            validationHtml += `
                <div class="validation-item success">
                    ✅ Room types: ${roomTypesList}
                </div>
            `;
        }

        // Warnings
        if (validation.warnings && validation.warnings.length > 0) {
            validation.warnings.forEach(warning => {
                validationHtml += `
                    <div class="validation-item warning">
                        ⚠️ ${warning}
                    </div>
                `;
            });
        }

        // Errors
        if (validation.errors && validation.errors.length > 0) {
            validation.errors.forEach(error => {
                validationHtml += `
                    <div class="validation-item error">
                        ❌ ${error}
                    </div>
                `;
            });
        }

        validationHtml += '</div>';

        content.innerHTML = validationHtml;
        container.style.display = 'block';
    }

    displayTimetable(timetable) {
        const container = document.getElementById('timetableContainer');
        const tbody = document.getElementById('timetableBody');

        // Clear existing content
        tbody.innerHTML = '';

        // Group timetable by year
        const yearGroups = this.groupTimetableByYear(timetable);

        // Sort years
        const sortedYears = Object.keys(yearGroups).sort((a, b) => parseInt(a) - parseInt(b));

        // Populate table with year sections
        sortedYears.forEach(year => {
            // Add year header row
            const yearHeaderRow = document.createElement('tr');
            yearHeaderRow.className = 'year-header';
            yearHeaderRow.innerHTML = `
                <td colspan="7" class="year-title">
                    <div class="year-section">
                        <h3>📚 Year ${year}</h3>
                        <div class="year-stats">
                            ${this.getYearStats(yearGroups[year])}
                        </div>
                    </div>
                </td>
            `;
            tbody.appendChild(yearHeaderRow);

            // Group courses by type within the year
            const coursesByType = this.groupCoursesByType(yearGroups[year]);

            // Display courses grouped by type
            ['lecture', 'lab', 'tutorial', 'project'].forEach(type => {
                if (coursesByType[type] && coursesByType[type].length > 0) {
                    // Add type subheader
                    const typeHeaderRow = document.createElement('tr');
                    typeHeaderRow.className = `type-header type-${type}`;
                    typeHeaderRow.innerHTML = `
                        <td colspan="7" class="type-title">
                            <div class="type-section">
                                <span class="session-type ${type}">${type.toUpperCase()}</span>
                                <span class="type-count">${coursesByType[type].length} courses</span>
                            </div>
                        </td>
                    `;
                    tbody.appendChild(typeHeaderRow);

                    // Sort courses within type by day/time
                    const sortedCourses = coursesByType[type].sort((a, b) => {
                        return a.day_time.localeCompare(b.day_time);
                    });

                    // Add courses for this type
                    sortedCourses.forEach(entry => {
                        const row = document.createElement('tr');
                        row.className = `year-${year}-course type-${type}-course`;

                        const sessionTypeClass = entry.session_type.toLowerCase();
                        const durationText = entry.duration === 0.5 ? '½ slot' : '1 slot';

                        row.innerHTML = `
                            <td>
                                <div class="course-info">
                                    <strong>${entry.course_name}</strong><br>
                                    <small class="course-id">${entry.course_id}</small>
                                </div>
                            </td>
                            <td>
                                <span class="session-type ${sessionTypeClass}">${entry.session_type}</span>
                            </td>
                            <td>${entry.sections}</td>
                            <td>${entry.day_time}</td>
                            <td>${entry.room}</td>
                            <td>${entry.instructor}</td>
                            <td>${durationText}</td>
                        `;

                        tbody.appendChild(row);
                    });
                }
            });

            // Add spacing row between years
            if (year !== sortedYears[sortedYears.length - 1]) {
                const spacerRow = document.createElement('tr');
                spacerRow.className = 'year-spacer';
                spacerRow.innerHTML = '<td colspan="7" class="spacer"></td>';
                tbody.appendChild(spacerRow);
            }
        });

        container.style.display = 'block';

        // Initialize filtered timetable to show all years by default
        this.filteredTimetable = this.currentTimetable;

        // Initialize dropdown filter with a small delay to ensure DOM is ready
        setTimeout(() => {
            this.initializeDropdownFilter();
        }, 100);

        this.showTableView();
    }

    groupTimetableByYear(timetable) {
        const yearGroups = {};

        timetable.forEach(entry => {
            // Extract year from course_id or use a default method
            let year = this.extractYearFromCourse(entry);

            if (!yearGroups[year]) {
                yearGroups[year] = [];
            }
            yearGroups[year].push(entry);
        });

        return yearGroups;
    }

    groupCoursesByType(courses) {
        const typeGroups = {
            lecture: [],
            lab: [],
            tutorial: [],
            project: []
        };

        courses.forEach(course => {
            const type = course.session_type.toLowerCase();
            if (typeGroups[type]) {
                typeGroups[type].push(course);
            }
        });

        return typeGroups;
    }

    extractYearFromCourse(entry) {
        // Try to extract year from course_id (e.g., CSC 111 -> Year 1, CSC 211 -> Year 2)
        const courseId = entry.course_id;
        const match = courseId.match(/(\d)(\d)\d/);

        if (match) {
            const firstDigit = parseInt(match[1]);
            const secondDigit = parseInt(match[2]);

            // If first digit is 1-4, use it as year
            if (firstDigit >= 1 && firstDigit <= 4) {
                return firstDigit;
            }
            // If second digit is 1-4, use it as year  
            if (secondDigit >= 1 && secondDigit <= 4) {
                return secondDigit;
            }
        }

        // Fallback: try to find year in course name or default to 1
        if (entry.course_name && entry.course_name.includes('(1)')) return 1;
        if (entry.course_name && entry.course_name.includes('(2)')) return 2;
        if (entry.course_name && entry.course_name.includes('(3)')) return 3;
        if (entry.course_name && entry.course_name.includes('(4)')) return 4;

        return 1; // Default to year 1
    }

    getYearStats(yearCourses) {
        const stats = {
            total: yearCourses.length,
            lecture: 0,
            lab: 0,
            tutorial: 0,
            project: 0
        };

        yearCourses.forEach(course => {
            const type = course.session_type.toLowerCase();
            if (stats.hasOwnProperty(type)) {
                stats[type]++;
            }
        });

        return `
            <span class="stat-badge total">${stats.total} Total</span>
            ${stats.lecture > 0 ? `<span class="stat-badge lecture">${stats.lecture} Lectures</span>` : ''}
            ${stats.lab > 0 ? `<span class="stat-badge lab">${stats.lab} Labs</span>` : ''}
            ${stats.tutorial > 0 ? `<span class="stat-badge tutorial">${stats.tutorial} Tutorials</span>` : ''}
            ${stats.project > 0 ? `<span class="stat-badge project">${stats.project} Projects</span>` : ''}
        `;
    }

    displayTimetableStats(timetable) {
        const statsContainer = document.getElementById('timetableStats');

        // Calculate overall statistics
        const totalClasses = timetable.length;
        const sessionTypes = {};
        const instructors = new Set();
        const rooms = new Set();
        const days = new Set();

        // Calculate year-based statistics
        const yearGroups = this.groupTimetableByYear(timetable);
        const yearStats = {};

        Object.keys(yearGroups).forEach(year => {
            yearStats[year] = {
                total: yearGroups[year].length,
                lecture: 0,
                lab: 0,
                tutorial: 0,
                project: 0
            };

            yearGroups[year].forEach(entry => {
                const type = entry.session_type.toLowerCase();
                if (yearStats[year].hasOwnProperty(type)) {
                    yearStats[year][type]++;
                }
            });
        });

        timetable.forEach(entry => {
            sessionTypes[entry.session_type] = (sessionTypes[entry.session_type] || 0) + 1;
            instructors.add(entry.instructor);
            rooms.add(entry.room);
            days.add(entry.day_time.split(' ')[0]);
        });

        const statsHtml = `
            <h4>📊 Timetable Statistics</h4>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="value">${totalClasses}</span>
                    <span class="label">Total Classes</span>
                </div>
                <div class="stat-item">
                    <span class="value">${instructors.size}</span>
                    <span class="label">Instructors Used</span>
                </div>
                <div class="stat-item">
                    <span class="value">${rooms.size}</span>
                    <span class="label">Rooms Used</span>
                </div>
                <div class="stat-item">
                    <span class="value">${days.size}</span>
                    <span class="label">Days Used</span>
                </div>
                <div class="stat-item">
                    <span class="value">${sessionTypes.lecture || 0}</span>
                    <span class="label">Lectures</span>
                </div>
                <div class="stat-item">
                    <span class="value">${sessionTypes.lab || 0}</span>
                    <span class="label">Labs</span>
                </div>
                <div class="stat-item">
                    <span class="value">${sessionTypes.tutorial || 0}</span>
                    <span class="label">Tutorials</span>
                </div>
            </div>

            <div class="year-breakdown">
                <h5>📚 Breakdown by Academic Year</h5>
                <div class="year-stats-grid">
                    ${Object.keys(yearStats).sort((a, b) => parseInt(a) - parseInt(b)).map(year => `
                        <div class="year-stat-card year-${year}-card">
                            <div class="year-stat-header">Year ${year}</div>
                            <div class="year-stat-details">
                                <div class="year-stat-item">
                                    <span class="value">${yearStats[year].total}</span>
                                    <span class="label">Total</span>
                                </div>
                                ${yearStats[year].lecture > 0 ? `
                                    <div class="year-stat-item">
                                        <span class="value">${yearStats[year].lecture}</span>
                                        <span class="label">Lectures</span>
                                    </div>
                                ` : ''}
                                ${yearStats[year].lab > 0 ? `
                                    <div class="year-stat-item">
                                        <span class="value">${yearStats[year].lab}</span>
                                        <span class="label">Labs</span>
                                    </div>
                                ` : ''}
                                ${yearStats[year].tutorial > 0 ? `
                                    <div class="year-stat-item">
                                        <span class="value">${yearStats[year].tutorial}</span>
                                        <span class="label">Tutorials</span>
                                    </div>
                                ` : ''}
                                ${yearStats[year].project > 0 ? `
                                    <div class="year-stat-item">
                                        <span class="value">${yearStats[year].project}</span>
                                        <span class="label">Projects</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        statsContainer.innerHTML = statsHtml;
    }

    initializeDropdownFilter() {
        console.log('Initializing dropdown filter...');
        const dropdownSelected = document.getElementById('dropdownSelected');
        const dropdownOptions = document.getElementById('dropdownOptions');
        const allYearsCheckbox = document.getElementById('allYears');

        console.log('Elements found:', {
            dropdownSelected: !!dropdownSelected,
            dropdownOptions: !!dropdownOptions,
            allYearsCheckbox: !!allYearsCheckbox
        });

        if (!dropdownSelected || !dropdownOptions) {
            console.error('Dropdown elements not found!');
            return;
        }

        // Toggle dropdown visibility
        dropdownSelected.addEventListener('click', (e) => {
            console.log('Dropdown clicked!');
            e.preventDefault();
            e.stopPropagation();
            dropdownSelected.classList.toggle('active');
            dropdownOptions.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!document.getElementById('yearDropdown').contains(e.target)) {
                dropdownSelected.classList.remove('active');
                dropdownOptions.classList.remove('show');
            }
        });

        // Handle "All Years" checkbox
        if (allYearsCheckbox) {
            allYearsCheckbox.addEventListener('change', () => {
                const yearCheckboxes = ['year1Filter', 'year2Filter', 'year3Filter', 'year4Filter'];
                const isChecked = allYearsCheckbox.checked;

                yearCheckboxes.forEach(id => {
                    const checkbox = document.getElementById(id);
                    if (checkbox) {
                        checkbox.checked = isChecked;
                    }
                });

                this.updateDropdownText();
                this.applyYearFilters();
            });
        }

        // Handle individual year checkboxes
        const yearCheckboxes = ['year1Filter', 'year2Filter', 'year3Filter', 'year4Filter'];
        yearCheckboxes.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    this.updateAllYearsCheckbox();
                    this.updateDropdownText();
                    this.applyYearFilters();
                });
            }
        });

        // Initialize dropdown text
        this.updateDropdownText();
    }

    updateAllYearsCheckbox() {
        const yearCheckboxes = ['year1Filter', 'year2Filter', 'year3Filter', 'year4Filter'];
        const allYearsCheckbox = document.getElementById('allYears');

        const checkedCount = yearCheckboxes.filter(id => {
            const checkbox = document.getElementById(id);
            return checkbox && checkbox.checked;
        }).length;

        if (allYearsCheckbox) {
            allYearsCheckbox.checked = checkedCount === yearCheckboxes.length;
        }
    }

    updateDropdownText() {
        const selectedYears = this.getSelectedYears();
        const selectedText = document.querySelector('.selected-text');

        if (selectedText) {
            if (selectedYears.length === 0) {
                selectedText.textContent = 'No Years Selected';
            } else if (selectedYears.length === 4) {
                selectedText.textContent = 'All Academic Years';
            } else {
                const yearText = selectedYears.map(year => `Year ${year}`).join(', ');
                selectedText.textContent = yearText;
            }
        }
    }

    showTableView() {
        document.getElementById('tableView').style.display = 'block';
        document.getElementById('dayView').style.display = 'none';
        document.getElementById('gridView').style.display = 'none';

        document.getElementById('tableViewBtn').classList.add('active');
        document.getElementById('dayViewBtn').classList.remove('active');
        document.getElementById('gridViewBtn').classList.remove('active');

        // Apply current filters
        if (this.currentTimetable) {
            this.displayFilteredTimetable();
        }
    }

    showDayView() {
        if (!this.currentTimetable) return;

        document.getElementById('tableView').style.display = 'none';
        document.getElementById('dayView').style.display = 'block';
        document.getElementById('gridView').style.display = 'none';

        document.getElementById('tableViewBtn').classList.remove('active');
        document.getElementById('dayViewBtn').classList.add('active');
        document.getElementById('gridViewBtn').classList.remove('active');

        this.generateFilteredDayView();
    }

    showGridView() {
        if (!this.currentTimetable) return;

        document.getElementById('tableView').style.display = 'none';
        document.getElementById('dayView').style.display = 'none';
        document.getElementById('gridView').style.display = 'block';

        document.getElementById('tableViewBtn').classList.remove('active');
        document.getElementById('dayViewBtn').classList.remove('active');
        document.getElementById('gridViewBtn').classList.add('active');

        this.generateFilteredGridView();
    }

    generateDayView() {
        const dayViewContent = document.getElementById('dayViewContent');

        // Group timetable by day
        const dayGroups = {};
        this.currentTimetable.forEach(entry => {
            const day = entry.day_time.split(' ')[0];
            if (!dayGroups[day]) {
                dayGroups[day] = [];
            }
            dayGroups[day].push(entry);
        });

        // Sort days
        const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
        const sortedDays = Object.keys(dayGroups).sort((a, b) => {
            return dayOrder.indexOf(a) - dayOrder.indexOf(b);
        });

        let dayViewHtml = '';

        sortedDays.forEach(day => {
            const dayClasses = dayGroups[day].sort((a, b) => {
                const timeA = a.day_time.split(' ').slice(1).join(' ');
                const timeB = b.day_time.split(' ').slice(1).join(' ');
                return timeA.localeCompare(timeB);
            });

            dayViewHtml += `
                <div class="day-column">
                    <h4>${day}</h4>
            `;

            dayClasses.forEach(entry => {
                const time = entry.day_time.split(' ').slice(1).join(' ');
                const sessionTypeClass = entry.session_type.toLowerCase();
                const durationText = entry.duration === 0.5 ? '(½ slot)' : '';
                const year = this.extractYearFromCourse(entry);

                dayViewHtml += `
                    <div class="time-slot year-${year}-slot">
                        <div class="time">${time} ${durationText}</div>
                        <div class="course">
                            ${entry.course_name}
                            <span class="year-badge-small">Y${year}</span>
                        </div>
                        <div class="details">
                            <span class="session-type ${sessionTypeClass}">${entry.session_type}</span><br>
                            ${entry.sections}<br>
                            Room: ${entry.room}<br>
                            Instructor: ${entry.instructor}
                        </div>
                    </div>
                `;
            });

            dayViewHtml += '</div>';
        });

        dayViewContent.innerHTML = dayViewHtml;
    }

    generateGridView() {
        const gridViewContent = document.getElementById('gridViewContent');

        // Create weekly timetable grid
        const weeklyGrid = this.createWeeklyTimetableGrid();
        gridViewContent.innerHTML = weeklyGrid;
    }

    createWeeklyTimetableGrid() {
        // Create section-based timetable grid (sections as columns, time slots as rows)
        return this.createSectionBasedGrid();
    }

    createSectionBasedGrid() {
        // Get all unique sections from the timetable
        const sections = this.getAllSections();

        // Define time slots and days
        const timeSlots = [
            '9:00 AM - 10:30 AM',
            '10:45 AM - 12:15 PM',
            '12:30 PM - 2:00 PM',
            '2:15 PM - 3:45 PM'
        ];

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

        // Create schedule grid: [day][timeSlot][section] = class
        const scheduleGrid = {};

        this.currentTimetable.forEach(entry => {
            const day = entry.day_time.split(' ')[0];
            const timeStr = entry.day_time.split(' ').slice(1).join(' ');
            const year = this.extractYearFromCourse(entry);

            // Map time string to time slot
            let timeSlot = '';
            if (timeStr.includes('9:00 AM')) timeSlot = timeSlots[0];
            else if (timeStr.includes('10:45 AM')) timeSlot = timeSlots[1];
            else if (timeStr.includes('12:30 PM')) timeSlot = timeSlots[2];
            else if (timeStr.includes('2:15 PM')) timeSlot = timeSlots[3];

            // Determine which sections this class affects
            const affectedSections = this.getAffectedSections(entry, year);

            affectedSections.forEach(sectionKey => {
                if (!scheduleGrid[day]) scheduleGrid[day] = {};
                if (!scheduleGrid[day][timeSlot]) scheduleGrid[day][timeSlot] = {};

                scheduleGrid[day][timeSlot][sectionKey] = {
                    ...entry,
                    year: year
                };
            });
        });

        // Generate HTML
        let gridHtml = `
            <div class="section-timetable-container">
                <h3>📅 Section-Based Timetable</h3>
                <div class="section-grid-wrapper">
                    <table class="section-grid-table">
                        <thead>
                            <tr>
                                <th class="section-header">Section</th>
                                ${sections.map(section => `<th class="section-column-header">${section}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
        `;

        // Generate rows for each day and time slot
        days.forEach(day => {
            timeSlots.forEach((timeSlot, timeIndex) => {
                gridHtml += `<tr class="schedule-row">`;

                // First column: Day and time
                if (timeIndex === 0) {
                    gridHtml += `<td class="day-time-cell" rowspan="${timeSlots.length}">
                        <div class="day-label">${day}</div>
                    </td>`;
                }

                gridHtml += `<td class="time-label-cell">${timeSlot}</td>`;

                // Generate cells for each section
                sections.forEach(sectionKey => {
                    const classEntry = scheduleGrid[day] && scheduleGrid[day][timeSlot] && scheduleGrid[day][timeSlot][sectionKey];

                    gridHtml += `<td class="section-schedule-cell">`;

                    if (classEntry) {
                        const yearClass = `year-${classEntry.year}`;
                        const sessionClass = classEntry.session_type.toLowerCase();

                        gridHtml += `
                            <div class="section-class-block ${yearClass}-block ${sessionClass}-block">
                                <div class="class-code">${classEntry.course_id}</div>
                                <div class="class-name">${this.truncateCourseName(classEntry.course_name)}</div>
                                <div class="class-type-badge">${classEntry.session_type}</div>
                                <div class="class-room-info">Room: ${classEntry.room}</div>
                                <div class="class-instructor-info">${this.truncateInstructorName(classEntry.instructor)}</div>
                            </div>
                        `;
                    }

                    gridHtml += `</td>`;
                });

                gridHtml += `</tr>`;
            });
        });

        gridHtml += `
                        </tbody>
                    </table>
                </div>
                
                <div class="section-legend">
                    <h4>📋 Legend</h4>
                    <div class="legend-items">
                        <div class="legend-item">
                            <div class="legend-color year-1-block"></div>
                            <span>Year 1</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color year-2-block"></div>
                            <span>Year 2</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color year-3-block"></div>
                            <span>Year 3</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color year-4-block"></div>
                            <span>Year 4</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return gridHtml;
    }

    getAllSections() {
        // Get all unique sections from the timetable
        const sections = new Set();

        this.currentTimetable.forEach(entry => {
            const year = this.extractYearFromCourse(entry);
            const affectedSections = this.getAffectedSections(entry, year);
            affectedSections.forEach(section => sections.add(section));
        });

        // Sort sections by year and then by section number
        return Array.from(sections).sort((a, b) => {
            const [yearA, sectionA] = a.split('S');
            const [yearB, sectionB] = b.split('S');

            if (yearA !== yearB) {
                return parseInt(yearA.replace('Y', '')) - parseInt(yearB.replace('Y', ''));
            }
            return parseInt(sectionA) - parseInt(sectionB);
        });
    }

    getAffectedSections(entry, year) {
        // Determine which sections are affected by this class
        const sections = [];

        if (entry.session_type.toLowerCase() === 'lecture') {
            // Lectures affect entire groups (3 sections each)
            if (entry.sections.includes('Group 1')) {
                sections.push(`Y${year}S1`, `Y${year}S2`, `Y${year}S3`);
            } else if (entry.sections.includes('Group 2')) {
                sections.push(`Y${year}S4`, `Y${year}S5`, `Y${year}S6`);
            } else if (entry.sections.includes('Group 3')) {
                sections.push(`Y${year}S7`, `Y${year}S8`, `Y${year}S9`);
            }
        } else {
            // Labs and tutorials affect individual sections
            const sectionMatch = entry.sections.match(/Section (\d+)/);
            if (sectionMatch) {
                const sectionNum = sectionMatch[1];
                sections.push(`Y${year}S${sectionNum}`);
            }
        }

        return sections;
    }

    truncateCourseName(courseName) {
        // Truncate long course names for better display
        if (courseName.length > 25) {
            return courseName.substring(0, 22) + '...';
        }
        return courseName;
    }

    truncateInstructorName(instructorName) {
        // Show only first name and last initial
        const parts = instructorName.split(' ');
        if (parts.length > 1) {
            return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
        }
        return instructorName;
    }

    getSelectedYears() {
        const selectedYears = [];
        if (document.getElementById('year1Filter').checked) selectedYears.push(1);
        if (document.getElementById('year2Filter').checked) selectedYears.push(2);
        if (document.getElementById('year3Filter').checked) selectedYears.push(3);
        if (document.getElementById('year4Filter').checked) selectedYears.push(4);
        return selectedYears;
    }

    applyYearFilters() {
        if (!this.currentTimetable) return;

        const selectedYears = this.getSelectedYears();

        // Filter timetable data by selected years
        this.filteredTimetable = this.currentTimetable.filter(entry => {
            const year = this.extractYearFromCourse(entry);
            return selectedYears.includes(year);
        });

        // Update current view
        const activeView = document.querySelector('.btn.active').id;
        if (activeView === 'tableViewBtn') {
            this.displayFilteredTimetable();
        } else if (activeView === 'dayViewBtn') {
            this.generateFilteredDayView();
        } else if (activeView === 'gridViewBtn') {
            this.generateFilteredGridView();
        }

        // Update statistics
        this.displayTimetableStats(this.filteredTimetable);
    }

    selectAllYears() {
        document.getElementById('year1Filter').checked = true;
        document.getElementById('year2Filter').checked = true;
        document.getElementById('year3Filter').checked = true;
        document.getElementById('year4Filter').checked = true;
        this.applyYearFilters();
    }

    clearAllYears() {
        document.getElementById('year1Filter').checked = false;
        document.getElementById('year2Filter').checked = false;
        document.getElementById('year3Filter').checked = false;
        document.getElementById('year4Filter').checked = false;
        this.applyYearFilters();
    }

    displayFilteredTimetable() {
        const container = document.getElementById('timetableContainer');
        const tbody = document.getElementById('timetableBody');

        // Clear existing content
        tbody.innerHTML = '';

        // Use filtered timetable
        const timetableToShow = this.filteredTimetable || this.currentTimetable;

        // Group timetable by year
        const yearGroups = this.groupTimetableByYear(timetableToShow);

        // Sort years
        const sortedYears = Object.keys(yearGroups).sort((a, b) => parseInt(a) - parseInt(b));

        // Populate table with year sections
        sortedYears.forEach(year => {
            // Add year header row
            const yearHeaderRow = document.createElement('tr');
            yearHeaderRow.className = 'year-header';
            yearHeaderRow.innerHTML = `
                <td colspan="7" class="year-title">
                    <div class="year-section">
                        <h3>📚 Year ${year}</h3>
                        <div class="year-stats">
                            ${this.getYearStats(yearGroups[year])}
                        </div>
                    </div>
                </td>
            `;
            tbody.appendChild(yearHeaderRow);

            // Group courses by type within the year
            const coursesByType = this.groupCoursesByType(yearGroups[year]);

            // Display courses grouped by type
            ['lecture', 'lab', 'tutorial', 'project'].forEach(type => {
                if (coursesByType[type] && coursesByType[type].length > 0) {
                    // Add type subheader
                    const typeHeaderRow = document.createElement('tr');
                    typeHeaderRow.className = `type-header type-${type}`;
                    typeHeaderRow.innerHTML = `
                        <td colspan="7" class="type-title">
                            <div class="type-section">
                                <span class="session-type ${type}">${type.toUpperCase()}</span>
                                <span class="type-count">${coursesByType[type].length} courses</span>
                            </div>
                        </td>
                    `;
                    tbody.appendChild(typeHeaderRow);

                    // Sort courses within type by day/time
                    const sortedCourses = coursesByType[type].sort((a, b) => {
                        return a.day_time.localeCompare(b.day_time);
                    });

                    // Add courses for this type
                    sortedCourses.forEach(entry => {
                        const row = document.createElement('tr');
                        row.className = `year-${year}-course type-${type}-course`;

                        const sessionTypeClass = entry.session_type.toLowerCase();
                        const durationText = entry.duration === 0.5 ? '½ slot' : '1 slot';

                        row.innerHTML = `
                            <td>
                                <div class="course-info">
                                    <strong>${entry.course_name}</strong><br>
                                    <small class="course-id">${entry.course_id}</small>
                                </div>
                            </td>
                            <td>
                                <span class="session-type ${sessionTypeClass}">${entry.session_type}</span>
                            </td>
                            <td>${entry.sections}</td>
                            <td>${entry.day_time}</td>
                            <td>${entry.room}</td>
                            <td>${entry.instructor}</td>
                            <td>${durationText}</td>
                        `;

                        tbody.appendChild(row);
                    });
                }
            });

            // Add spacing row between years
            if (year !== sortedYears[sortedYears.length - 1]) {
                const spacerRow = document.createElement('tr');
                spacerRow.className = 'year-spacer';
                spacerRow.innerHTML = '<td colspan="7" class="spacer"></td>';
                tbody.appendChild(spacerRow);
            }
        });

        container.style.display = 'block';
    }

    generateFilteredDayView() {
        const dayViewContent = document.getElementById('dayViewContent');
        const timetableToShow = this.filteredTimetable || this.currentTimetable;

        // Group timetable by day
        const dayGroups = {};
        timetableToShow.forEach(entry => {
            const day = entry.day_time.split(' ')[0];
            if (!dayGroups[day]) {
                dayGroups[day] = [];
            }
            dayGroups[day].push(entry);
        });

        // Sort days
        const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
        const sortedDays = Object.keys(dayGroups).sort((a, b) => {
            return dayOrder.indexOf(a) - dayOrder.indexOf(b);
        });

        let dayViewHtml = '';

        sortedDays.forEach(day => {
            const dayClasses = dayGroups[day].sort((a, b) => {
                const timeA = a.day_time.split(' ').slice(1).join(' ');
                const timeB = b.day_time.split(' ').slice(1).join(' ');
                return timeA.localeCompare(timeB);
            });

            dayViewHtml += `
                <div class="day-column">
                    <h4>${day}</h4>
            `;

            dayClasses.forEach(entry => {
                const time = entry.day_time.split(' ').slice(1).join(' ');
                const sessionTypeClass = entry.session_type.toLowerCase();
                const durationText = entry.duration === 0.5 ? '(½ slot)' : '';
                const year = this.extractYearFromCourse(entry);

                dayViewHtml += `
                    <div class="time-slot year-${year}-slot">
                        <div class="time">${time} ${durationText}</div>
                        <div class="course">
                            ${entry.course_name}
                            <span class="year-badge-small">Y${year}</span>
                        </div>
                        <div class="details">
                            <span class="session-type ${sessionTypeClass}">${entry.session_type}</span><br>
                            ${entry.sections}<br>
                            Room: ${entry.room}<br>
                            Instructor: ${entry.instructor}
                        </div>
                    </div>
                `;
            });

            dayViewHtml += '</div>';
        });

        dayViewContent.innerHTML = dayViewHtml;
    }

    generateFilteredGridView() {
        const gridViewContent = document.getElementById('gridViewContent');
        const timetableToShow = this.filteredTimetable || this.currentTimetable;

        // Create weekly timetable grid with filtered data
        const weeklyGrid = this.createWeeklyTimetableGridFromData(timetableToShow);
        gridViewContent.innerHTML = weeklyGrid;
    }

    createWeeklyTimetableGridFromData(timetableData) {
        // Define time slots and days
        const timeSlots = [
            '9:00 AM - 10:30 AM',
            '10:45 AM - 12:15 PM',
            '12:30 PM - 2:00 PM',
            '2:15 PM - 3:45 PM'
        ];

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

        // Group timetable by day and time
        const scheduleGrid = {};

        timetableData.forEach(entry => {
            const day = entry.day_time.split(' ')[0];
            const timeStr = entry.day_time.split(' ').slice(1).join(' ');
            const year = this.extractYearFromCourse(entry);

            // Map time string to time slot
            let timeSlot = '';
            if (timeStr.includes('9:00 AM')) timeSlot = timeSlots[0];
            else if (timeStr.includes('10:45 AM')) timeSlot = timeSlots[1];
            else if (timeStr.includes('12:30 PM')) timeSlot = timeSlots[2];
            else if (timeStr.includes('2:15 PM')) timeSlot = timeSlots[3];

            if (!scheduleGrid[timeSlot]) scheduleGrid[timeSlot] = {};
            if (!scheduleGrid[timeSlot][day]) scheduleGrid[timeSlot][day] = [];

            scheduleGrid[timeSlot][day].push({
                ...entry,
                year: year
            });
        });

        // Generate HTML for weekly grid
        let gridHtml = `
            <div class="weekly-timetable-container">
                <h3>📅 Weekly Timetable Grid</h3>
                <div class="timetable-grid">
                    <table class="weekly-grid-table">
                        <thead>
                            <tr>
                                <th class="time-header">Time</th>
                                ${days.map(day => `<th class="day-header">${day}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
        `;

        // Generate rows for each time slot
        timeSlots.forEach(timeSlot => {
            gridHtml += `<tr class="time-row">`;
            gridHtml += `<td class="time-cell">${timeSlot}</td>`;

            days.forEach(day => {
                const classes = scheduleGrid[timeSlot] && scheduleGrid[timeSlot][day] || [];
                gridHtml += `<td class="schedule-cell">`;

                if (classes.length > 0) {
                    classes.forEach(classEntry => {
                        const yearClass = `year-${classEntry.year}`;
                        const sessionClass = classEntry.session_type.toLowerCase();

                        gridHtml += `
                            <div class="class-block ${yearClass}-block ${sessionClass}-block">
                                <div class="class-course">${classEntry.course_name}</div>
                                <div class="class-id">${classEntry.course_id}</div>
                                <div class="class-type">${classEntry.session_type}</div>
                                <div class="class-sections">${classEntry.sections}</div>
                                <div class="class-room">Room: ${classEntry.room}</div>
                                <div class="class-instructor">${classEntry.instructor}</div>
                                <div class="class-year">Year ${classEntry.year}</div>
                            </div>
                        `;
                    });
                }

                gridHtml += `</td>`;
            });

            gridHtml += `</tr>`;
        });

        gridHtml += `
                        </tbody>
                    </table>
                </div>
                
                <div class="legend">
                    <h4>📋 Legend</h4>
                    <div class="legend-items">
                        <div class="legend-item">
                            <div class="legend-color year-1-block"></div>
                            <span>Year 1</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color year-2-block"></div>
                            <span>Year 2</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color year-3-block"></div>
                            <span>Year 3</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color year-4-block"></div>
                            <span>Year 4</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return gridHtml;
    }

    showStatus(message, type) {
        const statusDiv = document.getElementById('status');
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;

        if (type === 'loading') {
            statusDiv.innerHTML = `<span class="loading-spinner"></span>${message}`;
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TimetableApp();
});