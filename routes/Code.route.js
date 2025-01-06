const express = require('express');
const router = express.Router();
const Record = require('../models/record'); // Adjust path as per your folder structure

router.post('/save-record', async (req, res) => {
    const {
        track,
        drivername,
        date,
        salesman,
        receiptNumber,
        amount,
        city,
        remark,
        name,
        partyCode
    } = req.body;
    try {
        // Create a new record object (ID will be auto-incremented)
        let newRecord = new Record({
            track,
            drivername,
            date,
            salesman,
            receiptNumber,
            amount,
            city,
            remark,
            name,
            partyCode,
        });

        // Save the record to the database
        let data = await newRecord.save();

        // Log the saved data
        console.log(data);

        // Respond with the saved data
        res.status(200).json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
});


// POST API to filter records
router.post('/filter-records', async (req, res) => {
    const filters = req.body;
    try {
        // Find records matching the filter criteria
        let filterLocal = {
            salesman: filters.salesman,
            date: { $gte: req.body.start, $lte: req.body.end }
        }
        console.log(filterLocal);
        const records = await Record.find(filterLocal).sort({ receiptNumber: 1 });;

        // Respond with the matching records
        res.status(200).json(records);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post('/delete-records', async (req, res) => {
    try {
        const result = await Record.deleteMany(req.body); // Delete records based on filters
        res.status(200).json({ deletedCount: result.deletedCount });
        console.log("hello");
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
})


router.post('/grouped-records', async (req, res) => {
    const { salesman, startDate, endDate } = req.body; // Get filter parameters from query string

    try {
        const matchConditions = {};

        // Add salesman filter if provided
        if (salesman) {
            matchConditions.salesman = salesman;
        }

        // Add date range filter if provided
        if (startDate || endDate) {
            matchConditions.date = {};
            if (startDate) {
                matchConditions.date.$gte = new Date(startDate);
            }
            if (endDate) {
                matchConditions.date.$lte = new Date(endDate);
            }
        }

        const groupedRecords = await Record.aggregate([
            { $match: matchConditions }, // Filter by salesman and/or date range
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        salesman: "$salesman"
                    },
                    records: { $push: "$$ROOT" },
                    totalAmount: { $sum: "$amount" },
                }
            },
            { $sort: { "_id.date": 1, "_id.salesman": 1 } },
            {
                $project: {
                    _id: 1,
                    totalAmount: 1,
                    records: {
                        $sortArray: { input: "$records", sortBy: { receiptNumber: 1 } } // NEW: Sorting `records` array
                    }
                }
            }

        ]);

        res.status(200).json(groupedRecords);
    } catch (error) {
        console.error('Error fetching grouped records:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
