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
        console.log('Binding events...');
        const elements = [
            'loadDataBtn', 'validateBtn', 'generateBtn',
            'tableViewBtn', 'dayViewBtn', 'gridViewBtn',
            'year1Filter', 'year2Filter', 'year3Filter', 'year4Filter',
            'selectAllYears', 'clearAllYears', 'downloadBtn', 'downloadExcelBtn'
        ];

        elements.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (id === 'downloadExcelBtn') {
                    el.addEventListener('click', () => {
                        console.log('Excel download clicked');
                        this.downloadExcel();
                    });
                } else if (id === 'downloadBtn') {
                    el.addEventListener('click', () => this.downloadTimetable());
                } else if (id === 'loadDataBtn') {
                    el.addEventListener('click', () => this.loadDataSummary());
                } else if (id === 'validateBtn') {
                    el.addEventListener('click', () => this.validateData());
                } else if (id === 'generateBtn') {
                    el.addEventListener('click', () => this.generateTimetable());
                } else if (id === 'tableViewBtn') {
                    el.addEventListener('click', () => this.showTableView());
                } else if (id === 'dayViewBtn') {
                    el.addEventListener('click', () => this.showDayView());
                } else if (id === 'gridViewBtn') {
                    el.addEventListener('click', () => this.showGridView());
                } else if (id.includes('Filter')) {
                    el.addEventListener('change', () => this.applyYearFilters());
                } else if (id === 'selectAllYears') {
                    el.addEventListener('click', () => this.selectAllYears());
                } else if (id === 'clearAllYears') {
                    el.addEventListener('click', () => this.clearAllYears());
                }
            } else {
                console.error(`Element not found: ${id}`);
            }
        });
        console.log('Events bound.');
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
                Found ${validation.courses_count} courses, ${validation.instructors_count} instructors, ${validation.rooms_count} rooms
            </div>
        `;

        // Years found
        if (validation.years_found && validation.years_found.length > 0) {
            validationHtml += `
                <div class="validation-item success">
                    Academic years: ${validation.years_found.join(', ')}
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
                    Room types: ${roomTypesList}
                </div>
            `;
        }

        // Warnings
        if (validation.warnings && validation.warnings.length > 0) {
            validation.warnings.forEach(warning => {
                validationHtml += `
                    <div class="validation-item warning">
                        ${warning}
                    </div>
                `;
            });
        }

        // Errors
        if (validation.errors && validation.errors.length > 0) {
            validation.errors.forEach(error => {
                validationHtml += `
                    <div class="validation-item error">
                        ${error}
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
                        <h3>Year ${year}</h3>
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

        this.showTableView();
    }

    generateCourseColor(courseId) {
        if (!courseId) return { bg: '#4a5568', border: '#2d3748' };

        // Simple hash function to generate a number from string
        let hash = 0;
        for (let i = 0; i < courseId.length; i++) {
            hash = courseId.charCodeAt(i) + ((hash << 5) - hash);
        }

        // Generate nice distinct colors
        // Use golden ratio conjugate to spread colors better
        const h = Math.abs(hash % 360);

        // We want dark, rich colors for good contrast with white text
        // Saturation: 60-80%, Lightness: 30-45%
        const s = 65 + (Math.abs(hash) % 20);
        const l = 35 + (Math.abs(hash) % 15);

        return {
            bg: `hsla(${h}, ${s}%, ${l}%, 0.85)`,
            border: `hsl(${h}, ${s}%, ${l - 10}%)`
        };
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
        // Use explicit year from backend if available
        if (entry.year) {
            return entry.year;
        }

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
            <h4>Timetable Statistics</h4>
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
                <h5>Breakdown by Academic Year</h5>
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
        // Define time slots and days
        const timeSlots = [
            '9:00 AM - 10:30 AM',
            '10:45 AM - 12:15 PM',
            '12:30 PM - 2:00 PM',
            '2:15 PM - 3:45 PM'
        ];

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

        // Create schedule grid: [timeSlot][day] = [classes]
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

            if (!scheduleGrid[timeSlot]) scheduleGrid[timeSlot] = {};
            if (!scheduleGrid[timeSlot][day]) scheduleGrid[timeSlot][day] = [];

            scheduleGrid[timeSlot][day].push({
                ...entry,
                year: year
            });
        });

        // Generate HTML for horizontal weekly grid
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

                        // Generate dynamic color for the course
                        const courseColor = this.generateCourseColor(classEntry.course_id);

                        gridHtml += `
                            <div class="class-block ${yearClass}-block ${sessionClass}-block" 
                                 style="background: ${courseColor.bg}; border-left-color: ${courseColor.border}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); margin-bottom: 8px;">
                                <div class="class-course" style="color: white; font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${this.truncateCourseName(classEntry.course_name)}</div>
                                <div class="class-id" style="color: rgba(255,255,255,0.9); font-size: 0.8rem;">${classEntry.course_id}</div>
                                <div class="class-type" style="color: rgba(255,255,255,0.8); font-size: 0.7rem;">${classEntry.session_type}</div>
                                <div class="class-sections" style="color: rgba(255,255,255,0.8); font-size: 0.7rem;">${classEntry.sections}</div>
                                <div class="class-room" style="color: rgba(255,255,255,0.8); font-size: 0.7rem;">📍 ${classEntry.room}</div>
                                <div class="class-instructor" style="color: rgba(255,255,255,0.8); font-size: 0.7rem;">👨‍🏫 ${this.truncateInstructorName(classEntry.instructor)}</div>
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

                    // Generate dynamic color for the course
                    const courseColor = this.generateCourseColor(classEntry.course_id);

                    gridHtml += `
                                <div class="section-class-block ${yearClass}-block" 
                                     style="background: ${courseColor.bg}; border-left-color: ${courseColor.border}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);">
                                    <div class="class-code" style="color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${classEntry.course_id}</div>
                                    <div class="class-name" style="color: rgba(255,255,255,0.9);">${this.truncateCourseName(classEntry.course_name)}</div>
                                    <div class="class-type-badge">${classEntry.session_type}</div>
                                    <div class="class-room-info" style="color: rgba(255,255,255,0.8);">Room: ${classEntry.room}</div>
                                    <div class="class-instructor-info" style="color: rgba(255,255,255,0.8);">${this.truncateInstructorName(classEntry.instructor)}</div>
                                </div>
                            `;
                }

                gridHtml += `</td>`;
            });

            gridHtml += `</tr>`;
        });

        gridHtml += `
                        </tbody>
                    </table>
                </div>
                
                <div class="section-legend">
                    <h4>Legend</h4>
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

    getAllSections(timetable = this.currentTimetable) {
        // Get all unique sections from the timetable
        const sections = new Set();

        timetable.forEach(entry => {
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
        console.log('generateFilteredGridView called');
        const gridViewContent = document.getElementById('gridViewContent');
        const timetableToShow = this.filteredTimetable || this.currentTimetable;

        // Create weekly timetable grid using filtered data
        const weeklyGrid = this.createWeeklyTimetableGridFromData(timetableToShow);
        console.log('Generated grid HTML:', weeklyGrid.substring(0, 200) + '...');
        gridViewContent.innerHTML = weeklyGrid;
    }

    createWeeklyTimetableGridFromData(timetableData) {
        console.log('createWeeklyTimetableGridFromData called with data:', timetableData.length, 'entries');
        // Define time slots and days
        const timeSlots = [
            '9:00 AM - 10:30 AM',
            '10:45 AM - 12:15 PM',
            '12:30 PM - 2:00 PM',
            '2:15 PM - 3:45 PM'
        ];

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

        // Create schedule grid: [timeSlot][day] = [classes]
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

                        // Generate dynamic color for the course
                        const courseColor = this.generateCourseColor(classEntry.course_id);

                        gridHtml += `
                        <div class="class-block ${yearClass}-block ${sessionClass}-block" 
                             style="background: ${courseColor.bg}; border-left-color: ${courseColor.border}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); margin-bottom: 8px;">
                            <div class="class-course" style="color: white; font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${this.truncateCourseName(classEntry.course_name)}</div>
                            <div class="class-id" style="color: rgba(255,255,255,0.9); font-size: 0.8rem;">${classEntry.course_id}</div>
                            <div class="class-type" style="color: rgba(255,255,255,0.8); font-size: 0.7rem;">${classEntry.session_type}</div>
                            <div class="class-sections" style="color: rgba(255,255,255,0.8); font-size: 0.7rem;">${classEntry.sections}</div>
                            <div class="class-room" style="color: rgba(255,255,255,0.8); font-size: 0.7rem;">📍 ${classEntry.room}</div>
                            <div class="class-instructor" style="color: rgba(255,255,255,0.8); font-size: 0.7rem;">👨‍🏫 ${this.truncateInstructorName(classEntry.instructor)}</div>
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

    generateFilteredGridView() {
        const gridViewContent = document.getElementById('gridViewContent');
        const timetableToShow = this.filteredTimetable || this.currentTimetable;

        // Create horizontal timetable grid matching the requested shape
        const horizontalGrid = this.createHorizontalSectionGrid(timetableToShow);
        gridViewContent.innerHTML = horizontalGrid;
    }

    createHorizontalSectionGrid(timetableData) {
        const sections = this.getAllSections(timetableData);
        // Use standard 90 min slots as per data logic
        const timeSlots = [
            '9:00 AM - 10:30 AM',
            '10:45 AM - 12:15 PM',
            '12:30 PM - 2:00 PM',
            '2:15 PM - 3:45 PM'
        ];

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

        // Group by Day -> Section -> TimeSlot -> Class
        const gridData = {}; // { Day: { Section: { TimeSlot: ClassEntry } } }

        timetableData.forEach(entry => {
            const day = entry.day_time.split(' ')[0];
            const timeStr = entry.day_time.split(' ').slice(1).join(' ');
            const year = this.extractYearFromCourse(entry);

            let timeSlot = '';
            if (timeStr.includes('9:00 AM')) timeSlot = timeSlots[0];
            else if (timeStr.includes('10:45 AM')) timeSlot = timeSlots[1];
            else if (timeStr.includes('12:30 PM')) timeSlot = timeSlots[2];
            else if (timeStr.includes('2:15 PM')) timeSlot = timeSlots[3];

            const affectedSections = this.getAffectedSections(entry, year);

            if (!gridData[day]) gridData[day] = {};

            affectedSections.forEach(sec => {
                if (!gridData[day][sec]) gridData[day][sec] = {};
                // If collision, we might overwrite, but given CSP there shouldn't be collisions for same section
                gridData[day][sec][timeSlot] = {
                    ...entry,
                    year: year
                };
            });
        });

        let html = '<div class="horizontal-sched-container">';

        days.forEach(day => {
            // Only show table if day has content? Or show empty table?
            // User photo shows populated grid.

            html += `
                <div class="day-schedule-wrapper">
                    <table class="horizontal-grid-table">
                        <thead>
                            <tr class="day-header-row">
                                <th rowspan="2" class="section-col-header">Section</th>
                                <th colspan="${timeSlots.length}" class="day-main-header">${day}</th>
                            </tr>
                            <tr class="time-header-row">
                                ${timeSlots.map(slot => `<th>${slot}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
            `;

            sections.forEach(section => {
                const sectionData = gridData[day] && gridData[day][section] ? gridData[day][section] : {};

                // Get year from section name (e.g., Y1S1) for row styling
                const sectionYearMatch = section.match(/Y(\d+)/);
                const sectionYear = sectionYearMatch ? sectionYearMatch[1] : '1';

                html += `<tr class="section-row year-${sectionYear}-row">`;
                html += `<td class="section-cell">
                            <span class="section-name">${section}</span>
                         </td>`;

                timeSlots.forEach(slot => {
                    const cellData = sectionData[slot];
                    if (cellData) {
                        const yearClass = `year-${cellData.year}`;
                        const sessionType = cellData.session_type.toLowerCase();

                        html += `
                            <td class="class-cell filled ${yearClass}-cell ${sessionType}-cell">
                                <div class="cell-content">
                                    <div class="cell-course-code">${cellData.course_id}</div>
                                    <div class="cell-course-name">${this.truncateCourseName(cellData.course_name)}</div>
                                    <div class="cell-details">
                                        <span class="cell-room">📍 ${cellData.room}</span>
                                        <span class="cell-instructor">👨‍🏫 ${this.truncateInstructorName(cellData.instructor)}</span>
                                    </div>
                                    <div class="cell-type-badge">${cellData.session_type}</div>
                                </div>
                            </td>
                        `;
                    } else {
                        html += `<td class="empty-cell"></td>`;
                    }
                });

                html += `</tr>`;
            });

            html += `
                        </tbody>
                    </table>
                </div>
            `;
        });

        html += '</div>';
        return html;
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

    async downloadTimetable() {
        if (!this.currentTimetable) {
            this.showStatus('No timetable generated to download.', 'error');
            return;
        }

        const btn = document.getElementById('downloadBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '⏳ Processing...';
        btn.disabled = true;

        this.showStatus('Preparing download of Grid View...', 'loading');

        // Store current view state to restore later
        const tableView = document.getElementById('tableView');
        const dayView = document.getElementById('dayView');
        const gridView = document.getElementById('gridView');

        const wasGridVisible = gridView.style.display === 'block';

        try {
            // Force generate Grid View content to ensure it's up to date
            this.generateFilteredGridView();

            // Temporarily make Grid View visible for html2canvas to work
            // We use a trick to show it but keep it "invisible" from user if they were looking at something else
            // However, swapping display:block is safest for html2canvas rendering.
            if (!wasGridVisible) {
                // Hide others to avoid clutter during capture (though we target specific element)
                tableView.style.display = 'none';
                dayView.style.display = 'none';
                gridView.style.display = 'block';
            }

            const elementToCapture = document.querySelector('.horizontal-sched-container');
            if (!elementToCapture) {
                throw new Error('Grid view content could not be generated');
            }

            // Wait a brief moment for DOM to settle (styles, etc)
            await new Promise(resolve => setTimeout(resolve, 100));

            // Use html2canvas
            const canvas = await html2canvas(elementToCapture, {
                scale: 2, // Higher quality
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');

            // Generate PDF - Landscape for Grid View
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'l',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 297; // A4 Landscape width
            const pageHeight = 210; // A4 Landscape height
            const imgHeight = canvas.height * imgWidth / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            // Add first page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Add subsequent pages if content is long
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save('timetable_grid.pdf');
            this.showStatus('Download completed!', 'success');

        } catch (error) {
            console.error('Download error:', error);
            this.showStatus('Failed to generate PDF. See console.', 'error');
        } finally {
            // Restore original view state
            if (!wasGridVisible) {
                gridView.style.display = 'none';
                if (document.getElementById('tableViewBtn').classList.contains('active')) {
                    tableView.style.display = 'block';
                } else if (document.getElementById('dayViewBtn').classList.contains('active')) {
                    dayView.style.display = 'block';
                }
            }

            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    async downloadExcel() {
        if (typeof XLSX === 'undefined') {
            this.showStatus('Excel library (XLSX) not loaded. Please refresh the page.', 'error');
            return;
        }

        if (!this.currentTimetable) {
            this.showStatus('No timetable generated to download.', 'error');
            return;
        }

        const btn = document.getElementById('downloadExcelBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '⏳ Processing...';
        btn.disabled = true;

        this.showStatus('Generating Excel file...', 'loading');

        try {
            // prepare data
            const wb = XLSX.utils.book_new();
            const ws_data = [];
            const merges = [];

            // 1. Get all sections and organize structure
            const years = [1, 2, 3, 4];
            const groupsPerYear = 3;
            const sectionsPerGroup = 3;

            // -- HEADERS --

            // Row 0: Year Headers
            const row0 = ["Day", "Time"];
            // Row 1: Group Headers
            const row1 = ["", ""];

            let colIndex = 2; // Start after Day, Time

            years.forEach(year => {
                // Add Year Header
                row0[colIndex] = `Year ${year}`;
                // Merge Year Header (3 groups * 3 sections = 9 columns)
                // Note: End column is inclusive. Start colIndex, +8 means 9 columns total.
                merges.push({ s: { r: 0, c: colIndex }, e: { r: 0, c: colIndex + 8 } });

                for (let g = 1; g <= groupsPerYear; g++) {
                    // Add Group Header
                    row1[colIndex] = `Group ${g}`;
                    // Merge Group Header (3 sections)
                    merges.push({ s: { r: 1, c: colIndex }, e: { r: 1, c: colIndex + 2 } });

                    // Fill placeholders for underlying columns (sections within group)
                    for (let s = 1; s <= sectionsPerGroup; s++) {
                        if (s > 1) { // First col has the text
                            row1[colIndex + s - 1] = "";
                        }
                    }
                    colIndex += sectionsPerGroup;
                }

                // Fill placeholders for Year header cells that are merged
                for (let i = 1; i < 9; i++) {
                    row0[colIndex - 9 + i] = "";
                }
            });

            ws_data.push(row0);
            ws_data.push(row1);

            // Merge Day and Time headers vertically across the first two rows
            merges.push({ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }); // Day
            merges.push({ s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }); // Time

            // -- DATA --
            const timeSlots = [
                '9:00 AM - 10:30 AM',
                '10:45 AM - 12:15 PM',
                '12:30 PM - 2:00 PM',
                '2:15 PM - 3:45 PM'
            ];
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

            // Build a lookup map for faster access: nested[Year][SectionIndex][Day][TimeSlot] = entry
            const scheduleMap = {};

            this.currentTimetable.forEach(entry => {
                const year = this.extractYearFromCourse(entry);
                const day = entry.day_time.split(' ')[0];
                const timeStr = entry.day_time.split(' ').slice(1).join(' ');

                let timeSlot = '';
                if (timeStr.includes('9:00')) timeSlot = timeSlots[0];
                else if (timeStr.includes('10:45')) timeSlot = timeSlots[1];
                else if (timeStr.includes('12:30')) timeSlot = timeSlots[2];
                else if (timeStr.includes('2:15')) timeSlot = timeSlots[3];

                if (!timeSlot) return;

                if (!scheduleMap[year]) scheduleMap[year] = {};

                // Determine sections affected
                const affectedSections = []; // indices 1-9 relative to year

                if (entry.session_type.toLowerCase() === 'lecture') {
                    // Group based
                    if (entry.sections.includes('Group 1')) affectedSections.push(1, 2, 3);
                    else if (entry.sections.includes('Group 2')) affectedSections.push(4, 5, 6);
                    else if (entry.sections.includes('Group 3')) affectedSections.push(7, 8, 9);
                } else {
                    // Section based: "Section 1", "Section 2"...
                    const secMatch = entry.sections.match(/Section (\d+)/);
                    if (secMatch) {
                        const secNum = parseInt(secMatch[1]);
                        affectedSections.push(secNum);
                    }
                }

                affectedSections.forEach(secIdx => {
                    if (!scheduleMap[year][secIdx]) scheduleMap[year][secIdx] = {};
                    if (!scheduleMap[year][secIdx][day]) scheduleMap[year][secIdx][day] = {};

                    scheduleMap[year][secIdx][day][timeSlot] = entry;
                });
            });

            // Iterate Rows
            let currentRow = 2; // Starting after headers (row 0 and 1)

            // Define Base Styles
            const baseAlignment = { horizontal: "center", vertical: "center", wrapText: true };
            const THIN = { style: "thin", color: { rgb: "000000" } };
            const MEDIUM = { style: "medium", color: { rgb: "000000" } };

            const getStyledCell = (value, type, rowIdx, colIdx, isLastSlot) => {
                // Determine fill color based on type
                let fill = null;
                if (type === 'header') fill = { fgColor: { rgb: "E0E0E0" } };
                else if (type === 'lecture') fill = { fgColor: { rgb: "FFF2CC" } };
                else if (type === 'lab') fill = { fgColor: { rgb: "DDEBF7" } };

                // Determine font
                let font = { name: "Calibri", sz: 11 };
                if (type === 'header') font.bold = true;

                // Determine Borders
                const border = {
                    top: THIN,
                    bottom: THIN,
                    left: THIN,
                    right: THIN
                };

                // Bold Bottom for end of Day (isLastSlot) or Header Row 1
                if (isLastSlot || rowIdx === 1) {
                    border.bottom = MEDIUM;
                }

                // Bold Right for Day, Time, and Year separators
                // Cols: 0(Day), 1(Time), 10(Y1), 19(Y2), 28(Y3), 37(Y4)
                if ([1, 10, 19, 28, 37].includes(colIdx)) {
                    border.right = MEDIUM;
                }

                return {
                    v: value,
                    t: 's',
                    s: {
                        fill: fill,
                        font: font,
                        alignment: baseAlignment,
                        border: border
                    }
                };
            };

            // Re-process Headers with new style logic
            // We need to rebuild ws_data[0] and ws_data[1] with the new style function
            // Temporary storage
            const headerRow0 = [];
            const headerRow1 = [];

            // Row 0
            for (let c = 0; c < ws_data[0].length; c++) {
                headerRow0.push(getStyledCell(ws_data[0][c] || "", 'header', 0, c, false));
            }
            // Row 1
            for (let c = 0; c < ws_data[1].length; c++) {
                headerRow1.push(getStyledCell(ws_data[1][c] || "", 'header', 1, c, false));
            }

            // Replace initial header strings with styled objects
            ws_data[0] = headerRow0;
            ws_data[1] = headerRow1;


            days.forEach(day => {
                // Merge Day column for all 4 slots of this day
                merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow + 3, c: 0 } });

                timeSlots.forEach((slot, slotIdx) => {
                    const rowData = [];
                    const isLastSlot = (slotIdx === timeSlots.length - 1);
                    const visualRowIdx = currentRow;

                    // Col 0: Day
                    rowData.push(getStyledCell(slotIdx === 0 ? day : "", 'default', visualRowIdx, 0, isLastSlot));
                    // Col 1: Time
                    rowData.push(getStyledCell(slot, 'default', visualRowIdx, 1, isLastSlot));

                    // Cols 2+: Years -> Groups -> Sections
                    let colIdx = 2;
                    years.forEach(year => {
                        for (let secIdx = 1; secIdx <= 9; secIdx++) {
                            const entry = scheduleMap[year] && scheduleMap[year][secIdx] && scheduleMap[year][secIdx][day] && scheduleMap[year][secIdx][day][slot];

                            if (entry) {
                                // Content Format
                                const content = `${entry.course_name}\n${entry.session_type}\n${entry.room}\n${entry.instructor}`;
                                const type = entry.session_type.toLowerCase(); // 'lecture' or 'lab' or default

                                rowData.push(getStyledCell(content, type, visualRowIdx, colIdx, isLastSlot));

                                // Handle Merges for Lectures
                                if (type === 'lecture') {
                                    if (secIdx === 1 || secIdx === 4 || secIdx === 7) {
                                        // Start of a group
                                        // Merge 3 cells (current, +1, +2)
                                        merges.push({ s: { r: visualRowIdx, c: colIdx }, e: { r: visualRowIdx, c: colIdx + 2 } });
                                    } else {
                                        // This is a merged cell placeholder, cleared by getStyledCell logic? 
                                        // Actually we just pushed a cell with content. We should probably push empty content for merged cells to stay safe, 
                                        // but Excel usually handles content in top-left of merge.
                                        // However, we MUST push a cell to keep the array aligned and valid for 'aoa_to_sheet'.
                                        // And we want it to have borders!
                                        // So we pushed it above. We just need to make sure text is empty if it's not the start.
                                        if (secIdx % 3 !== 1) {
                                            // Overwrite the content with empty string but keep style
                                            rowData[rowData.length - 1].v = "";
                                        }
                                    }
                                }
                            } else {
                                rowData.push(getStyledCell("", 'default', visualRowIdx, colIdx, isLastSlot));
                            }
                            colIdx++;
                        }
                    });

                    ws_data.push(rowData);
                    currentRow++;
                });
            });

            // Create Sheet
            const ws = XLSX.utils.aoa_to_sheet(ws_data);

            // Apply Merges
            ws['!merges'] = merges;

            // Basic Properties
            ws['!cols'] = [
                { wch: 15 }, // Day
                { wch: 20 }  // Time
            ];
            // Add widths for all section columns
            for (let i = 0; i < years.length * 9; i++) {
                ws['!cols'].push({ wch: 25 });
            }

            // Set Row Heights (approx 100px for content rows to fit ~5 lines)
            const rowHeights = [];
            // Header rows
            rowHeights.push({ hpx: 30 }); // Row 0
            rowHeights.push({ hpx: 30 }); // Row 1
            // Data rows
            for (let i = 2; i < currentRow; i++) {
                rowHeights.push({ hpx: 100 });
            }
            ws['!rows'] = rowHeights;

            // Add Sheet to Book
            XLSX.utils.book_append_sheet(wb, ws, "Timetable");


            // Save File manually to ensure download works
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = "Timetable_All_Years.xlsx";
            document.body.appendChild(anchor);
            anchor.click();

            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(anchor);

            this.showStatus('Excel download completed!', 'success');

        } catch (error) {
            console.error('Excel Generation Error:', error);
            this.showStatus(`Failed to generate Excel: ${error.message}`, 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    extractYearFromCourse(entry) {
        // First priority: Use the year data from the timetable entry (from CSV)
        if (entry.year && entry.year >= 1 && entry.year <= 4) {
            return entry.year;
        }

        // Second priority: Try to extract year from course_id (e.g., CSC 211 -> Year 2)
        const courseId = entry.course_id;
        const match = courseId.match(/(\d)(\d)\d/);

        if (match) {
            const firstDigit = parseInt(match[1]);
            const secondDigit = parseInt(match[2]);

            // If second digit is 1-4, use it as year (more reliable for course numbering)
            if (secondDigit >= 1 && secondDigit <= 4) {
                return secondDigit;
            }
            // If first digit is 1-4, use it as year
            if (firstDigit >= 1 && firstDigit <= 4) {
                return firstDigit;
            }
        }

        // Fallback: try to find year in course name
        if (entry.course_name && entry.course_name.includes('(1)')) return 1;
        if (entry.course_name && entry.course_name.includes('(2)')) return 2;
        if (entry.course_name && entry.course_name.includes('(3)')) return 3;
        if (entry.course_name && entry.course_name.includes('(4)')) return 4;

        return 1; // Default to year 1
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

    generateCourseColor(courseId) {
        if (!courseId) return { bg: '#4a5568', border: '#2d3748' };

        // Simple hash function to generate a number from string
        let hash = 0;
        for (let i = 0; i < courseId.length; i++) {
            hash = courseId.charCodeAt(i) + ((hash << 5) - hash);
        }

        // Generate nice distinct colors
        // Use golden ratio conjugate to spread colors better
        const h = Math.abs(hash % 360);

        // We want dark, rich colors for good contrast with white text
        // Saturation: 60-80%, Lightness: 30-45%
        const s = 65 + (Math.abs(hash) % 20);
        const l = 35 + (Math.abs(hash) % 15);

        return {
            bg: `hsla(${h}, ${s}%, ${l}%, 0.85)`,
            border: `hsl(${h}, ${s}%, ${l - 10}%)`
        };
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
