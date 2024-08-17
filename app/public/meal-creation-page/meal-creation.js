let appetizerCount = 0;
let mainCourseCount = 0;
let dessertCount = 0;

function addOption(courseType) {
    let container = document.getElementById(`${courseType}Container`);
    let count;

    if (courseType === 'appetizer') {
        count = ++appetizerCount;
    } else if (courseType === 'mainCourse') {
        count = ++mainCourseCount;
    } else if (courseType === 'dessert') {
        count = ++dessertCount;
    }

    let inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.placeholder = `Enter ${courseType} option ${count}`;
    inputField.id = `${courseType}Option${count}`;
    inputField.className = 'meal-option-input';

    container.appendChild(inputField);
}

document.getElementById('mealForm').addEventListener('submit', function(event) {
    event.preventDefault();  // Prevent the default form submission

    // Clear all input fields
    document.querySelectorAll('#appetizerContainer input, #mainCourseContainer input, #dessertContainer input').forEach(input => {
        input.value = '';
    });

    // Optionally, reset the counters
    appetizerCount = 0;
    mainCourseCount = 0;
    dessertCount = 0;

    // Clear all containers
    document.getElementById('appetizerContainer').innerHTML = '';
    document.getElementById('mainCourseContainer').innerHTML = '';
    document.getElementById('dessertContainer').innerHTML = '';
});
