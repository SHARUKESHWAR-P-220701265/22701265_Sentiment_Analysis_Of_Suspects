const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const User = require('./models/User');
const Case = require('./models/Case');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/simpleApp', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Multer setup for handling file uploads
const upload = multer({ dest: 'uploads/' });

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
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });
        res.status(200).json({ message: 'Login successful!', userId: user._id });
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
    const filePath = req.file.path;

    // Read the JSON file
    fs.readFile(filePath, 'utf8', async (err, data) => {
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
        } finally {
            // Clean up the uploaded file
            fs.unlink(filePath, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        }
    });
});

// Analysis route
app.post('/api/cases/analyze/:caseId', async (req, res) => {
    const caseId = req.params.caseId;
    const { participant } = req.body;

    // Here, implement the call to your ML model
    // For the sake of demonstration, let's return a mock threat score and summary
    const mockThreatScore = 8.986; // Mock score
    const mockSummary = `Analysis for ${participant} - Highly suspicious with very negative and harmful intentions.`; // Mock summary

    try {
        const analysisResult = { threatScore: mockThreatScore, summary: mockSummary };
        res.status(200).json(analysisResult);
    } catch (error) {
        res.status(500).json({ message: 'Error analyzing case', error });
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