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
const TransitList = require("../models/TransitList");

function getIndianDate() {
    const now = new Date();
    // IST is UTC + 5 hours 30 minutes
    const istOffset = 5.5 * 60 * 60 * 1000; // Offset in milliseconds
    // Convert to IST
    const istTime = new Date(now.getTime() + istOffset + (now.getTimezoneOffset() * 60000));

    return istTime;
}

// Update checkUsername and remove record from checklist in a single query
router.post('/delivered/update', async (req, res) => {
    try {
        const { record_id, locationLink } = req.body;

        // Ensure user is authenticated
        if (!res.locals.username) {
            return res.status(401).json({ message: 'Unauthorized: No user session found' });
        }

        // Find the logged-in user
        const user = await User.findOne({ username: res.locals.username });
        if (!user) {
            return res.status(404).json({ message: 'No user found. Please log in again' });
        }

        // Update `Record` with `checkUsername` and `checkTimestamp`
        const updatedRecord = await Record.findByIdAndUpdate(
            record_id,
            {
                deliveredUser: user._id, // Assign the user ID
                deliveredTimestamp: getIndianDate(), // Set the current timestamp
                deliveryStatus: 'delivered',
                locationLink: locationLink
            },
            { new: true } // Return the updated record
        );

        if (!updatedRecord) {
            return res.status(404).json({ message: 'Record not found' });
        }

        // Remove the record from `CheckedList`
        const updatedTransitList = await TransitList.findOneAndUpdate(
            { records: record_id }, // Find checklist that contains the record
            { $pull: { records: record_id } }, // Remove record from checklist
            { new: true } // Return updated checklist
        ).populate('records');

        res.status(200).json({
            message: 'Check status updated and record removed from checklist',
            updatedTransitList,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating packed status and removing record', error });
    }
});


// Update checkUsername and remove record from checklist in a single query
router.post('/pickup/update', async (req, res) => {
    try {
        const { record_id } = req.body;
        console.log(record_id);

        // Ensure user is authenticated
        if (!res.locals.username) {
            return res.status(401).json({ message: 'Unauthorized: No user session found' });
        }

        // Find the logged-in user
        const user = await User.findOne({ username: res.locals.username });
        if (!user) {
            return res.status(404).json({ message: 'No user found. Please log in again' });
        }

        // Update `Record` with `checkUsername` and `checkTimestamp`
        const updatedRecord = await Record.findByIdAndUpdate(
            record_id,
            {
                pickupUser: user._id, // Assign the user ID
                pickupTimestamp: getIndianDate(), // Set the current timestamp
                deliveryStatus: 'waiting' // Mark as checked
            },
            { new: true } // Return the updated record
        );

        if (!updatedRecord) {
            return res.status(404).json({ message: 'Record not found' });
        }

        // Remove the record from `CheckedList`
        const updatedDeliveredList = await DeliveredList.findOneAndUpdate(
            { records: record_id }, // Find checklist that contains the record
            { $pull: { records: record_id } }, // Remove record from checklist
            { new: true } // Return updated checklist
        ).populate('records');

        /*
        Add this to checklist as well
        */
        let transitList = await TransitList.findOne();
        if (!transitList) {
            transitList = new TransitList({ records: [] });
        }
        transitList.records.push(updatedRecord._id);
        await transitList.save();

        res.status(200).json({
            message: 'Check status updated and record removed from checklist',
            updatedDeliveredList,
            transitList: transitList ? transitList.records : []
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating packed status and removing record', error });
    }
});



router.post('/deliver/get', async (req, res) => {
    try {
        const deliveredList = await DeliveredList.find({}, {
            generatedDate: 1,
            invoiceNumber: 1,
            partyCode: 1,
            medicalName: 1,
            medicalCity: 1,
            imageLinks: 1,
            checkStatus: 1,
            _id: 0 // Exclude _id from response
        }).populate('records'); // Populate the records field

        const transitList = await TransitList.find({}, {
            generatedDate: 1,
            invoiceNumber: 1,
            partyCode: 1,
            medicalName: 1,
            medicalCity: 1,
            imageLinks: 1,
            checkStatus: 1,
            _id: 0 // Exclude _id from response
        }).populate('records'); // Populate the records field


        const actualDate = getIndianDate();
        const formattedDate = moment(actualDate).format('YYYY-MM-DD'); // Format the date as "YYYY-MM-DD"

        const dailyRecords = await DailyRecord.findOne({ date: formattedDate })
            .populate({
                path: 'records',
                model: 'Record',
                populate: {
                    path: 'deliveredUser',
                    model: 'User',
                    select: 'username email' // Explicitly select required fields
                }
            }).exec();

        if (!dailyRecords)
            return res.status(200).json({
                success: true,
                deliveredList: (deliveredList.length == 0) ? [] : deliveredList[0].records,
                transitList: (transitList.length == 0) ? [] : transitList[0].records,
                records: []
            });


        const filteredRecords =
            dailyRecords.records
                .filter((r) => {
                    return (r.deliveredUser) && (r.deliveredUser.username === res.locals.username);
                })
        console.log(filteredRecords);
        res.status(200).json({
            success: true,
            deliveredList: (deliveredList.length == 0) ? [] : deliveredList[0].records,
            transitList: (transitList.length == 0) ? [] : transitList[0].records,
            records: filteredRecords
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error fetching data', error });
    }
})


// Update checkUsername and remove record from checklist in a single query
router.post('/packedlist/update', async (req, res) => {
    try {
        const { record_id } = req.body;

        // Ensure user is authenticated
        if (!res.locals.username) {
            return res.status(401).json({ message: 'Unauthorized: No user session found' });
        }

        // Find the logged-in user
        const user = await User.findOne({ username: res.locals.username });
        if (!user) {
            return res.status(404).json({ message: 'No user found. Please log in again' });
        }

        // Update `Record` with `checkUsername` and `checkTimestamp`
        const updatedRecord = await Record.findByIdAndUpdate(
            record_id,
            {
                packageUser: user._id, // Assign the user ID
                packageTimestamp: getIndianDate(), // Set the current timestamp
                packageStatus: 'packed' // Mark as checked
            },
            { new: true } // Return the updated record
        );

        if (!updatedRecord) {
            return res.status(404).json({ message: 'Record not found' });
        }

        // Remove the record from `CheckedList`
        const updatedPackedList = await PackedList.findOneAndUpdate(
            { records: record_id }, // Find checklist that contains the record
            { $pull: { records: record_id } }, // Remove record from checklist
            { new: true } // Return updated checklist
        ).populate('records');

        /*
        Add this to checklist as well
        */
        let deliveredList = await DeliveredList.findOne();
        if (!deliveredList) {
            deliveredList = new DeliveredList({ records: [] });
        }
        deliveredList.records.push(updatedRecord._id);
        await deliveredList.save();

        res.status(200).json({
            message: 'Check status updated and record removed from checklist',
            updatedRecord,
            updatedPackedList: updatedPackedList ? updatedPackedList.records : []
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating packed status and removing record', error });
    }
});



router.post('/packedlist/get', async (req, res) => {
    try {
        const packedLists = await PackedList.find({}, {
            generatedDate: 1,
            invoiceNumber: 1,
            partyCode: 1,
            medicalName: 1,
            medicalCity: 1,
            imageLinks: 1,
            checkStatus: 1,
            _id: 0 // Exclude _id from response
        }).populate('records'); // Populate the records field

        const actualDate = getIndianDate();
        const formattedDate = moment(actualDate).format('YYYY-MM-DD'); // Format the date as "YYYY-MM-DD"

        const dailyRecords = await DailyRecord.findOne({ date: formattedDate })
            .populate({
                path: 'records',
                model: 'Record',
                populate: {
                    path: 'packageUser',
                    model: 'User',
                    select: 'username email' // Explicitly select required fields
                }
            }).exec();

        if (!dailyRecords)
            return res.status(200).json({ success: true, packedLists: packedLists[0].records, records: [] });


        const filteredRecords =
            dailyRecords.records
                .filter((r) => {
                    return (r.packageUser) && (r.packageUser.username === res.locals.username);
                })
        res.status(200).json({ success: true, packedLists: packedLists[0].records, records: filteredRecords });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error fetching data', error });
    }
})


router.post('/checklist/get', async (req, res) => {
    try {
        const checkedLists = await CheckList.find({}, {
            generatedDate: 1,
            invoiceNumber: 1,
            partyCode: 1,
            medicalName: 1,
            medicalCity: 1,
            imageLinks: 1,
            checkStatus: 1,
            _id: 0 // Exclude _id from response
        }).populate('records'); // Populate the records field

        const actualDate = getIndianDate();
        const formattedDate = moment(actualDate).format('YYYY-MM-DD'); // Format the date as "YYYY-MM-DD"

        const dailyRecords = await DailyRecord.findOne({ date: formattedDate })
            .populate({
                path: 'records',
                model: 'Record',
                populate: {
                    path: 'checkUsername',
                    model: 'User',
                    select: 'username email' // Explicitly select required fields
                }
            }).exec();

        if (!dailyRecords)
            return res.status(200).json({ success: true, checkList: checkedLists[0].records, records: [] });

        const filteredRecords =
            dailyRecords.records
                .filter((r) => {
                    return (r.checkUsername) && (r.checkUsername.username === res.locals.username);
                })
        res.status(200).json({ success: true, checkList: checkedLists[0].records, records: filteredRecords });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error fetching data', error });
    }
})

// Update checkUsername and remove record from checklist in a single query
router.post('/checklist/update', async (req, res) => {
    try {
        const { record_id } = req.body;

        // Ensure user is authenticated
        if (!res.locals.username) {
            return res.status(401).json({ message: 'Unauthorized: No user session found' });
        }

        // Find the logged-in user
        const user = await User.findOne({ username: res.locals.username });
        if (!user) {
            return res.status(404).json({ message: 'No user found. Please log in again' });
        }

        // Update `Record` with `checkUsername` and `checkTimestamp`
        const updatedRecord = await Record.findByIdAndUpdate(
            record_id,
            {
                checkUsername: user._id, // Assign the user ID
                checkTimestamp: getIndianDate(), // Set the current timestamp
                checkStatus: 'checked' // Mark as checked
            },
            { new: true } // Return the updated record
        );

        if (!updatedRecord) {
            return res.status(404).json({ message: 'Record not found' });
        }

        // Remove the record from `CheckedList`
        const updatedChecklist = await CheckList.findOneAndUpdate(
            { records: record_id }, // Find checklist that contains the record
            { $pull: { records: record_id } }, // Remove record from checklist
            { new: true } // Return updated checklist
        ).populate('records');

        /*
        Add this to checklist as well
        */
        let packedList = await PackedList.findOne();
        if (!packedList) {
            packedList = new PackedList({ records: [] });
        }
        packedList.records.push(updatedRecord._id);
        await packedList.save();

        res.status(200).json({
            message: 'Check status updated and record removed from checklist',
            updatedRecord,
            updatedChecklist: updatedChecklist ? updatedChecklist.records : []
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating check status and removing record', error });
    }
});




router.post('/invoice/create', async (req, res) => {
    const {
        invoiceNumber,
        generatedDate,
        partyCode,
        imageLinks,
    } = req.body;

    try {
        const formattedDate = moment(new Date(generatedDate)).format('YYYY-MM-DD'); // Format the provided date
        const user = await User.findOne({ username: res.locals.username });
        if (!user) return res.status(404).json({
            message: `No user found for the data. Please log in again`,
        });

        // Create the new invoice record
        const newRecord = new Record({
            invoiceNumber,
            generatedDate,
            partyCode,
            imageLinks,
            invoiceUsername: user._id
        });

        await newRecord.save(); // Save the new record in the `Record` collection

        // Find the corresponding daily record
        const dailyRecord = await DailyRecord.findOne({ date: formattedDate });

        // If a daily record exists, add this new record to it
        if (dailyRecord) {
            // Add the new record to the `records` array in the daily record
            dailyRecord.records.push(newRecord._id);

            // Update the `endInvoiceNumber` of the daily record
            dailyRecord.endInvoiceNumber = newRecord.invoiceNumber;

            // Save the updated daily record
            await dailyRecord.save();
        } else {
            return res.status(404).json({
                message: `No daily record found for the date: ${formattedDate}. Please create a daily record first.`,
            });
        }

        /*
            Add this to checklist as well
        */
        let checkedList = await CheckList.findOne();
        if (!checkedList) {
            checkedList = new CheckList({ records: [] });
        }
        checkedList.records.push(newRecord._id);
        await checkedList.save();


        return res.status(201).json({
            message: 'Invoice created successfully.',
            data: newRecord,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }

})

router.post('/invoice/reset', async (req, res) => {
    const { invoiceNumber } = req.body;
    if (!invoiceNumber) {
        return res.status(400).json({ message: 'Invoice number is required.' });
    }

    try {
        const actualDate = getIndianDate();
        const formattedDate = moment(actualDate).format('YYYY-MM-DD'); // Format the date as "YYYY-MM-DD"

        // Check if there is an existing daily record for the same formatted date
        let dailyRecord = await DailyRecord.findOne({ date: formattedDate }).populate({
            path: 'records',
            populate: [
                { path: 'invoiceUsername', model: 'User', select: 'name email' }, // Fetch username details
                { path: 'checkUsername', model: 'User', select: 'name email' }, // Fetch check user details
                { path: 'packageUser', model: 'User', select: 'name email' }, // Fetch package user details
                { path: 'pickupUser', model: 'User', select: 'name email' }, // Fetch pickup user details
                { path: 'deliveredUser', model: 'User', select: 'name email' }, // Fetch delivery user details
            ],
        });;

        if (!dailyRecord) {
            return res.status(404).json({ message: 'daily record database is not exists.' });
        }

        let recordIndex = -1;
        dailyRecord.records.forEach((record, i) => {
            if (record.invoiceNumber == invoiceNumber)
                recordIndex = i;
        })

        if (recordIndex === -1) {
            return res.status(400).json({
                message: 'Record not found in today\'s records. You can only reset records from today.',
            });
        }

        await Record.deleteOne({ invoiceNumber });

        dailyRecord.records.splice(recordIndex, 1);

        let newEndInvoice = dailyRecord.startInvoiceNumber - 1;
        dailyRecord.records.forEach((record, i) => {
            if (record.invoiceNumber != invoiceNumber && record.invoiceNumber > newEndInvoice) {
                newEndInvoice = record.invoiceNumber;
            }
        })

        dailyRecord.endInvoiceNumber = newEndInvoice;
        // Save the updated DailyRecord
        await dailyRecord.save();


        // last step
        res.status(200).json({
            message: 'Record reset successfully.',
            updatedDailyRecord: dailyRecord,
        });
    } catch (error) {
        console.error('Error resetting the record:', error);
        res.status(500).json({
            message: 'An error occurred while resetting the record.',
            error: error.message,
        });
    }


})


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
        // const transformedRecords = dailyRecord.records.map(record => ({
        //     date: dailyRecord.date, // Date of the record
        //     invoiceNo: record.invoiceNumber, // Invoice Number
        //     partyCode: record.partyCode, // Party Code
        //     image1: record.imageLinks[0] || '', // First image URL
        //     image2: record.imageLinks[1] || '', // Second image URL
        //     save: "Save Action", // Placeholder for Save action
        //     reset: "Reset Action", // Placeholder for Reset action
        //     isOtc: record.isOtc, // OTC status
        //     timestamp: record.invoiceTimestamp, // Timestamp
        // }));
        // console.log(transformedRecords);

        // dailyRecord.records = transformedRecords;

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
