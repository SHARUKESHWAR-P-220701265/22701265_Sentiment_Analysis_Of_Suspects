const apiUrl = 'http://localhost:5000/api/users';
const caseApiUrl = 'http://localhost:5000/api/cases';

// Handle login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${apiUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('username', data.uname);
            window.location.href = 'home.html';
        } else {
            document.getElementById('loginMessage').innerText = data.message || 'Login failed';
        }
    } catch (error) {
        document.getElementById('loginMessage').innerText = 'Error logging in';
    }
});

// Handle registration
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${apiUrl}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();
        if (response.ok) {
            window.location.href = 'login.html';
        } else {
            document.getElementById('registerMessage').innerText = data.message || 'Registration failed';
        }
    } catch (error) {
        document.getElementById('registerMessage').innerText = 'Error registering';
    }
});

// Handle case creation
const userId = localStorage.getItem('userId');
document.getElementById('caseForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const caseNumber = document.getElementById('caseNumber').value;
    const description = document.getElementById('description').value;

    try {
        const response = await fetch(caseApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                caseNumber,
                description
            })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Case created successfully!');
            loadCases(); // Reload cases after creation
        } else {
            alert(data.message || 'Error creating case');
        }
    } catch (error) {
        alert('Error creating case');
    }
});

// Load user cases on page load
const loadCases = async () => {
    try {
        const response = await fetch(`${caseApiUrl}?userId=${userId}`);
        const cases = await response.json();

        const casesContainer = document.getElementById('casesContainer');
        casesContainer.innerHTML = '';

        cases.forEach(c => {
            const caseDiv = document.createElement('div');
            caseDiv.classList.add('case-card');
            caseDiv.innerHTML = `
                <h3>Case Number: ${c.caseNumber}</h3>
                <p>Description: ${c.description}</p>
                <button onclick="uploadFile('${c._id}')">Upload JSON for Analysis</button>
            `;
            casesContainer.appendChild(caseDiv);
        });
    } catch (error) {
        console.error('Error loading cases', error);
    }
};

// Function to handle file upload for analysis
const uploadFile = async (caseId) => {
    console.log('Uploading file for caseId:', caseId);
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';

    fileInput.onchange = async (event) => {
        const file = event.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            console.log("Im gonna request file upload from server.js")
            const response = await fetch(`${caseApiUrl}/upload/${caseId}`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (response.ok) {
                // Redirect to results.html with the caseId and participants
                const participantNames = encodeURIComponent(JSON.stringify(data.participants));
                window.location.href = `results.html?caseId=${caseId}&participants=${participantNames}`;
            } else {
                alert(data.message || 'Error uploading file');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error uploading file');
        }
    };
    fileInput.click();
};

// Display welcome message on home page
const displayWelcomeMessage = () => {
    const username = localStorage.getItem('username');
    const usernameSpan = document.getElementById('username');
    if (username && usernameSpan) {
        usernameSpan.innerText = username;
    }
};

// Initial load of user cases and display welcome message
document.addEventListener('DOMContentLoaded', () => {
    loadCases();
    displayWelcomeMessage();
});
