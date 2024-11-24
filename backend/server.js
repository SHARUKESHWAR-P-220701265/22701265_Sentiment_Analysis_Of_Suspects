const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const User = require('./models/User');
const Case = require('./models/Case');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/simpleApp', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Multer setup for handling file uploads

const upload = multer({dest : "uploads/"});

app.post('/api/users/register', async (req, res) => {
    const { username, email, password } = req.body;
    const newUser = new User({ username, email, password });
    
    try {
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        res.status(400).json({ message: 'Error registering user', error });
    }
});

app.post('/api/users/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const user = await User.findOne({ email, password });
        if (!user) return res.status(401).json({ message: 'User does not exist. Register Now.' });
        res.status(200).json({ message: 'Login successful!', userId: user._id, uname: user.username});
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
});

app.post('/api/cases', async (req, res) => {
    const { userId, caseNumber, description, jsonFile, threatScore, summary } = req.body;
    const newCase = new Case({ userId, caseNumber, description, jsonFile, threatScore, summary });
    
    try {
        await newCase.save();
        await User.findByIdAndUpdate(userId, { $push: { cases: newCase._id } });
        res.status(201).json({ message: 'Case created successfully!' });
    } catch (error) {
        res.status(400).json({ message: 'Error creating case', error });
    }
});

// File upload route
app.post('/api/cases/upload/:caseId', upload.single('file'), (req, res) => {
    const caseId = req.params.caseId;
    const file = req.file;
    // Log the file details to ensure it's uploaded
    console.log('File uploaded:', file);
    if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const filePath = path.resolve(file.path).replace(/\\/g, '\\\\'); // Get the file path from Multer’s storage location
    console.log('File path:', filePath);
    // Read the JSON file
    fs.readFile(filePath.replace(/\\\\/g, '\\'), 'utf8', async (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading file', error: err });
        }
        
        try {
            const jsonData = JSON.parse(data);
            // Extract participant names correctly
            const participants = jsonData.participants.map(participant => participant.name); // Extracting names from nested objects
            console.log(participants);
            // Update the case with the uploaded JSON data
            await Case.findByIdAndUpdate(caseId, { jsonFile: filePath });
            res.status(200).json({ message: 'File uploaded successfully', participants });
        } catch (error) {
            res.status(400).json({ message: 'Error processing JSON', error });
        }
    });
});

// Analysis route
app.post('/api/cases/analyze/:caseId', async (req, res) => {
    const caseId = req.params.caseId;
    const { participant } = req.body;

    try {
        // Find the case to get the file path
        const caseData = await Case.findById(caseId);
        if (!caseData || !caseData.jsonFile) {
            return res.status(404).json({ message: 'Case or JSON file not found' });
        }

        const filePath = caseData.jsonFile; // Path to the uploaded JSON file

        // Call the Flask API using fetch
        const response = await fetch('http://localhost:5001/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                file_path: filePath,
                participant_name: participant,
            }),
        });

        if (!response.ok) {
            return res.status(response.status).json({ message: 'Error analyzing conversation', error: await response.text() });
        }

        const analysisResult = await response.json();
        const { threatScore, summary } = analysisResult;

        // Update the case with the analysis results
        await Case.findByIdAndUpdate(caseId, { threatScore, summary }, { new: true });

        res.status(200).json({ threatScore, summary });

    } catch (error) {
        console.error('Error in analysis route:', error);
        res.status(500).json({ message: 'Error analyzing conversation', error });
    }
});

// Get user cases
app.get('/api/cases', async (req, res) => {
    const userId = req.query.userId;

    try {
        const cases = await Case.find({ userId });
        res.status(200).json(cases);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching cases', error });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});