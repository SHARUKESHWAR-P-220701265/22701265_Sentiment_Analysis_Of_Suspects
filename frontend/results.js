const caseApiUrl = 'http://localhost:5000/api/cases';

// Get URL parameters
const params = new URLSearchParams(window.location.search);
const caseId = params.get('caseId');
const participants = JSON.parse(decodeURIComponent(params.get('participants')));

// Populate participant list
const participantListDiv = document.getElementById('participantList');
participants.forEach(participant => {
    const label = document.createElement('label');
    label.innerHTML = `
        <input type="radio" name="participant" value="${participant}">${participant}
    `;
    participantListDiv.appendChild(label);
});

// Handle participant selection and analysis
document.getElementById('participantForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const selectedParticipant = document.querySelector('input[name="participant"]:checked');

    if (!selectedParticipant) {
        alert('Please select a participant!');
        return;
    }

    try {
        const response = await fetch(`${caseApiUrl}/analyze/${caseId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participant: selectedParticipant.value })
        });

        const data = await response.json();
        if (response.ok) {
            const resultDiv = document.getElementById('analysisResult');
            resultDiv.innerHTML = `<p>Threat Score: ${data.threatScore}</p><p>Summary: ${data.summary}</p>`;
        } else {
            alert(data.message || 'Error analyzing case');
        }
    } catch (error) {
        alert('Error analyzing case');
    }
});
