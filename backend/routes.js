/*
====================================================
? => Backend/Routes :---
====================================================
*/

const express = require('express');
const db = require('./db');
const router = express.Router();

//* Endpoint to save UTM data
router.post('/save-utm-data', async (req, res) => {
    const { utm_source, utm_medium, utm_campaign, utm_term, utm_content } = req.body;

    try {
        // Insert all UTM data into the database
        const [result] = await db.execute(
            'INSERT INTO utm_data (utm_source, utm_medium, utm_campaign, utm_term, utm_content) VALUES (?, ?, ?, ?, ?)',
            [utm_source, utm_medium, utm_campaign, utm_term, utm_content]  // Include values for new UTM parameters
        );
        res.status(200).json({ message: 'Data saved successfully', id: result.insertId });
    } catch (error) {
        console.error('Error saving UTM data:', error);
        res.status(500).json({ message: 'Error saving data' });
    }
});

//* Endpoint to fetch UTM data
router.get('/utm-data', async (req, res) => {
    try {
        // Fetch all UTM data from the database, including the new parameters
        const [rows] = await db.execute('SELECT * FROM utm_data ORDER BY created_at DESC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching UTM data:', error);
        res.status(500).json({ message: 'Error fetching data' });
    }
});



module.exports = router;
