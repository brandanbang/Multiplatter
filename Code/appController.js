const express = require('express');
const appService = require('./appService');

const router = express.Router();

// ----------------------------------------------------------
// API endpoints
// Modify or extend these routes based on your project's needs.
router.get('/check-db-connection', async (req, res) => {
    const isConnect = await appService.testOracleConnection();
    if (isConnect) {
        res.send('connected');
    } else {
        res.send('unable to connect');
    }
});

router.get('/recipestable', async (req, res) => {
    try{
        console.log('Fetching recipes...');
        const tableContent = await appService.fetchRecipesWithAvgRating();
        console.log('Fetched recipes:', tableContent);
        res.json({data:tableContent});
    } catch (err) {
        console.error('Error fetching recipes:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }

});
router.get('/recipestable1', async (req, res) => {
    const tableContent = await appService.fetchRecipesFromDb();
    res.json({data:tableContent});
});

router.get('/ratingstable', async (req, res) => {
    const tableContent = await appService.fetchRatingsFromDb();
    res.json({data:tableContent});
});


router.post("/initiate-all-tables", async (req, res) => {
    const initiateResult = await appService.initiateAlltables();
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.get('/demotable', async (req, res) => {
    const tableContent = await appService.fetchDemotableFromDb();
    res.json({data: tableContent});
});

router.post("/initiate-demotable", async (req, res) => {
    const initiateResult = await appService.initiateDemotable();
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post("/insert-demotable", async (req, res) => {
    const { id, name } = req.body;
    const insertResult = await appService.insertDemotable(id, name);
    if (insertResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post("/update-name-demotable", async (req, res) => {
    const { oldName, newName } = req.body;
    const updateResult = await appService.updateNameDemotable(oldName, newName);
    if (updateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.get('/count-demotable', async (req, res) => {
    const tableCount = await appService.countDemotable();
    if (tableCount >= 0) {
        res.json({
            success: true,
            count: tableCount
        });
    } else {
        res.status(500).json({
            success: false,
            count: tableCount
        });
    }
});

// Check login status route
router.get('/checkLoginStatus', (req, res) => {
    const isLoggedIn = req.session && req.session.user; // Adjust according to your session management
    res.json({ isLoggedIn });
});

// Save recipe route
router.post('/saveRecipe', async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { recipeId } = req.body;
    const username = req.session.user.username;
    try {
        await saveRecipe(recipeId, username);
        res.status(200).json({ message: 'Recipe saved successfully' });
    } catch (error) {
        console.error('Error saving recipe:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// router.post("/logintable", async (req, res) => {
//     console.log("in appcontroller");
//     const {Username,Password} = req.body;
//     const insertResult = await appService.loginUser(Username,Password);
//     console.log("in appcontroller again");
//     console.log(insertResult);
//     if (insertResult.success) {
//         res.json({ success: true });
//     } else {
//         // res.status(500).json({ success: false });
//         res.json({success: false});
//     }
// });
router.post("/logintable", async (req, res) => {
    const { Username, Password } = req.body;
    const loginResult = await appService.loginUser(Username, Password);

    if (loginResult) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});






module.exports = router;