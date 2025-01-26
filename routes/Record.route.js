const express = require('express');
const moment = require('moment'); // For date formatting
const router = express.Router();
const Record = require('../models/record');
const Admin = require('../models/admin');
const User = require('../models/user');
const DailyRecord = require('../models/dailyRecord');
const CheckList = require('../models/CheckedList');
const PackedList = require('../models/PackedList');
const DeliveredList = require('../models/DeliveredList');

function getIndianDate() {
    const offset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    return new Date().getTime() + offset;
}

// router.post('/record')

router.post('/daily-records/generate/add', async (req, res) => {
    const { date, records, startInvoiceNumber } = req.body;
    try {

        const actualDate = getIndianDate();
        const formattedDate = moment(actualDate).format('YYYY-MM-DD'); // Format the date as "YYYY-MM-DD"

        // Check if there is an existing daily record for the same formatted date
        let existingDailyRecord = await DailyRecord.findOne({ date: formattedDate });

        // Find the most recent record before the provided date
        const lastRecord = await DailyRecord.findOne({ date: { $lt: formattedDate } }).sort({ timestamp: -1 });

        // Default endInvoiceNumber
        let endInvoiceNumber;

        if (lastRecord) {
            // Ensure the new startInvoiceNumber is valid
            if (startInvoiceNumber <= lastRecord.endInvoiceNumber) {
                return res.status(400).json({
                    message: `Constraint violation: The last record's endInvoiceNumber (${lastRecord.endInvoiceNumber}) must be less than today's startInvoiceNumber (${startInvoiceNumber}).`,
                });
            }

            // Inherit the previous endInvoiceNumber if last record exists
            endInvoiceNumber = lastRecord.endInvoiceNumber;
        } else {
            // No prior record exists
            endInvoiceNumber = startInvoiceNumber - 1;
        }

        if (existingDailyRecord) {
            // update should not decrease size of indexes cause we already added some data here
            if (existingDailyRecord.endInvoiceNumber > endInvoiceNumber) {
                return res.status(400).json({
                    message: `Constraint violation: The last record's endInvoiceNumber (${existingDailyRecord.endInvoiceNumber}) must be less than today's startInvoiceNumber (${startInvoiceNumber}).`,
                });
            }

            // Update the existing daily record
            existingDailyRecord.startInvoiceNumber = startInvoiceNumber;
            existingDailyRecord.endInvoiceNumber = endInvoiceNumber;
            existingDailyRecord.timestamp = actualDate;
            existingDailyRecord.records = records;
            await existingDailyRecord.save();

            return res.status(200).json({
                message: "Daily record updated successfully.",
                data: existingDailyRecord,
            });
        } else {
            // Create a new daily record
            const newDailyRecord = new DailyRecord({
                date: formattedDate,
                timestamp: actualDate, // Store the actual date and time
                records,
                startInvoiceNumber,
                endInvoiceNumber,
            });

            await newDailyRecord.save();

            return res.status(201).json({
                message: "Daily record created successfully.",
                data: newDailyRecord,
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post('/daily-records/date', async (req, res) => {
    const { date } = req.body; // Extract the date from the request body
    console.log(date);

    if (!date) {
        return res.status(400).json({ message: "Date is required in the request body." });
    }

    try {
        const formattedDate = moment(new Date(date)).format('YYYY-MM-DD'); // Format the provided date

        // Find the daily record for the provided date
        const dailyRecord = await DailyRecord.findOne({ date: formattedDate }).populate({
            path: 'records',
            populate: [
                { path: 'invoiceUsername', model: 'User', select: 'name email' }, // Fetch username details
                { path: 'checkUsername', model: 'User', select: 'name email' }, // Fetch check user details
                { path: 'packageUser', model: 'User', select: 'name email' }, // Fetch package user details
                { path: 'pickupUser', model: 'User', select: 'name email' }, // Fetch pickup user details
                { path: 'deliveredUser', model: 'User', select: 'name email' }, // Fetch delivery user details
            ],
        });

        if (!dailyRecord) {
            return res.status(404).json({ message: `No records found for the date: ${formattedDate}.` });
        }

        // Transform data for the frontend table
        const transformedRecords = dailyRecord.records.map(record => ({
            date: dailyRecord.date, // Date of the record
            invoiceNo: record.invoiceNumber, // Invoice Number
            partyCode: record.partyCode, // Party Code
            image1: record.imageLinks[0] || '', // First image URL
            image2: record.imageLinks[1] || '', // Second image URL
            save: "Save Action", // Placeholder for Save action
            reset: "Reset Action", // Placeholder for Reset action
            isOtc: record.isOtc, // OTC status
            timestamp: record.invoiceTimestamp, // Timestamp
        }));
        dailyRecord.records = transformedRecords;
        res.status(200).json({
            message: `Records for the date ${formattedDate} retrieved successfully.`,
            data: dailyRecord,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});



module.exports = router;
