// Course list
const courses = [
    'PHY 101', 'PHY 103', 'CHE 101', 'BIO 101', 'MTS 101',
    'MTS 201', 'EEE 201', 'MME 201', 'MEE 207', 
    'EEE 305', 'EEE 307', 'MTS 315'
];

const courseCountSelect = document.getElementById('courseCount');
const courseSelectionDiv = document.getElementById('courseSelection');
const totalAmountSpan = document.getElementById('totalAmount');
const registrationForm = document.getElementById('registrationForm');

// Update course selection based on number of courses
courseCountSelect.addEventListener('change', function() {
    const numCourses = parseInt(this.value);
    updateCourseSelection(numCourses);
    updateTotalAmount(numCourses);
});

function updateCourseSelection(numCourses) {
    if (numCourses > 0) {
        courseSelectionDiv.style.display = 'block';
        courseSelectionDiv.innerHTML = '<h3>Select Your Courses:</h3>';
        
        for (let i = 0; i < numCourses; i++) {
            const courseDiv = document.createElement('div');
            courseDiv.className = 'course-option';
            courseDiv.innerHTML = `
                <label for="course${i}">Course ${i + 1}:</label>
                <select id="course${i}" name="course${i}" required>
                    <option value="">Select a course</option>
                    ${courses.map(course => `<option value="${course}">${course}</option>`).join('')}
                </select>
            `;
            courseSelectionDiv.appendChild(courseDiv);
        }
    } else {
        courseSelectionDiv.style.display = 'none';
    }
}

function updateTotalAmount(numCourses) {
    const amount = numCourses * 200;
    totalAmountSpan.textContent = `₦${amount}`;
}

// Form submission
registrationForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        department: document.getElementById('department').value,
        matricNumber: document.getElementById('matricNumber').value,
        courseCount: document.getElementById('courseCount').value,
        courses: [],
        amount: parseInt(courseCountSelect.value) * 200
    };
    
    // Get selected courses
    for (let i = 0; i < formData.courseCount; i++) {
        const course = document.getElementById(`course${i}`).value;
        if (course) {
            formData.courses.push(course);
        }
    }
    
    // Validate course selection
    if (formData.courses.length !== parseInt(formData.courseCount)) {
        alert('Please select all courses');
        return;
    }
    
    // Check for duplicate courses
    if (new Set(formData.courses).size !== formData.courses.length) {
        alert('Please select different courses for each selection');
        return;
    }
    
    // Store form data and redirect to payment
    localStorage.setItem('registrationData', JSON.stringify(formData));
    window.location.href = 'payment.html';
});

// Initialize
updateCourseSelection(0);