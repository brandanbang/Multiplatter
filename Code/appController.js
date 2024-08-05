const express = require('express');
const appService = require('./appService');

const router = express.Router();
const path = require('path');


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


// Check login status route
router.get('/checkLoginStatus', (req, res) => {
    const isLoggedIn = req.session && req.session.user;
    res.json({ isLoggedIn });
});

router.post('/saveRecipe', async (req, res) => {
    // const username = localStorage.getItem('username');
    // if (!username) {
    //     return res.status(401).json({ error: 'Unauthorized' });
    // }
    const { recipeId, username } = req.body;
    //const username = req.session.user.username;
    const savesResult = await appService.saveRecipe(recipeId, username);
    if (savesResult) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

router.get('/api/recipe/:id(\\d+)', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const recipe = await appService.fetchRecipesFromDbById(id);

        console.log(recipe);

        if (recipe) {
            res.json(recipe);
        } else {
            res.status(404).json({error: 'Data not found'});
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Error fetching data'});
    }
});

router.get('/requiredItems/:id(\\d+)', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const ingredients = await appService.getRequiredItems(id);

        if (ingredients) {
            res.json(ingredients);
        } else {
            res.status(404).json({error: 'Data not found'});
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Error fetching data'});
    }
});

router.get('/instructions/:id(\\d+)', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const instructions = await appService.getInstruction(id);

        if (instructions) {
            res.json(instructions);
        } else {
            res.status(404).json({error: 'Data not found'});
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Error fetching data'});
    }
});

router.post("/logintable", async (req, res) => {
    const { Username, Password } = req.body;
    const loginResult = await appService.loginUser(Username, Password);

    if (loginResult) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

router.get('/api/user/:username', async (req, res) => {
    const username = req.params.username;
    const userDetails = await appService.getUserDetails(username);

    if (userDetails) {
        res.json(userDetails);
    } else {
        res.status(404).send('User not found');
    }
});

router.post("/signup", async (req, res) => {
    try {
        const {City,ProvinceState,Username, Password, PhoneNo, Email, Name} = req.body;
        const signUpResult = await appService.signupUser(City,ProvinceState,Username, Password, PhoneNo, Email, Name);
        if (signUpResult) {
            res.json({success: true});

        } else {
            res.json({success: false});
        }

    } catch (err) {
        res.status(500).json({error: 'Failed to Sign up!'});
    }
});

router.get('/api/user/:username/saved-recipes', async (req, res) => {
    try {
        const username = req.params.username;
        const recipes = await appService.getSavedRecipes(username);
        res.json({ data: recipes });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch saved recipes' });
    }
});



router.get('/api/user/:username/created-recipes', async (req, res) => {
    try {
        const username = req.params.username;
        const recipes = await appService.getCreatedRecipes(username);
        res.json({ data: recipes });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch created recipes' });
    }
});

router.post('/api/user/deleteAccount', async (req, res) => {
    try {
        const {PhoneNo} = req.body;
        const deleteResult = await appService.deleteAcount(PhoneNo);
        if (deleteResult) {
            res.json({success: true});

        } else {
            res.json({success: false});
        }

    } catch (err) {
        res.status(500).json({error: 'failed to delete account'});
    }
});

router.post('/filteredRecipes', async (req, res) => {
    const filters = req.body.filters;
    console.log(filters);
    try {
        const recipes = await appService.getFilteredRecipes(filters);
        res.json({ data: recipes });
    } catch (error) {
        res.status(500).json({ error: 'could not filter '});
    }
});

router.get('/topUser', async (req, res) => {
    try {
        const tableContent = await appService.findTopUser();
        console.log( tableContent);
        res.json({ data: tableContent });
    } catch (err) {
        console.error('Error getting user', err);
        res.status(500).json({ error: 'no top user yet!' });
    }
});

module.exports = router;