const oracledb = require('oracledb');
const loadEnvFile = require('./utils/envUtil');

const envVariables = loadEnvFile('./.env');

const fs = require('fs');
//const { Buffer } = require('buffer');



// Database configuration setup. Ensure your .env file has the required database credentials.
const dbConfig = {
    user: envVariables.ORACLE_USER,
    password: envVariables.ORACLE_PASS,
    connectString: `${envVariables.ORACLE_HOST}:${envVariables.ORACLE_PORT}/${envVariables.ORACLE_DBNAME}`,
    poolMin: 1,
    poolMax: 3,
    poolIncrement: 1,
    poolTimeout: 60
};

// initialize connection pool
async function initializeConnectionPool() {
    try {
        await oracledb.createPool(dbConfig);
        console.log('Connection pool started');
        initiateAlltables();
    } catch (err) {
        console.error('Initialization error: ' + err.message);
    }
}

async function closePoolAndExit() {
    console.log('\nTerminating');
    try {
        await oracledb.getPool().close(10); // 10 seconds grace period for connections to finish
        console.log('Pool closed');
        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

initializeConnectionPool();

process
    .once('SIGTERM', closePoolAndExit)
    .once('SIGINT', closePoolAndExit);

// ----------------------------------------------------------
// Wrapper to manage OracleDB actions, simplifying connection handling.
async function withOracleDB(action) {
    let connection;
    try {
        connection = await oracledb.getConnection(); // Gets a connection from the default pool
        return await action(connection);
    } catch (err) {
        console.error(err);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}

// ----------------------------------------------------------
// Core functions for database operations
// Modify these functions, especially the SQL queries, based on your project's requirements and design.
async function testOracleConnection() {
    return await withOracleDB(async (connection) => {
        return true;
    }).catch(() => {
        return false;
    });
}

async function fetchDemotableFromDb() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute('SELECT * FROM DEMOTABLE');
        return result.rows;
    }).catch(() => {
        return [];
    });
}

//SQL Statements to create and insert initial values for all tables
async function initiateAlltables() {
    return await withOracleDB(async (connection) => {
        const script = fs.readFileSync('./database.sql', 'utf8');
        const statements = script.split(';').filter(stmt => stmt.trim());
        for (const s of statements) {
            try {
                await connection.execute(s);
            } catch(err) {
                console.log(s);
                console.error(err);
            }
        }
        return true;
    }).catch(() => {
        return false;
    });
}

async function fetchRecipesFromDb() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute('SELECT * FROM RecipeCreatesSortedBy');
        return result.rows;
    }).catch(() => {
        return [];
    });
}
async function checkLoginStatus() {
    try {
        const response = await fetch('/checkLoginStatus'); // Adjust the endpoint to your actual API
        const data = await response.json();
        return data.isLoggedIn;
    } catch (error) {
        console.error('Error checking login status:', error);
        return false;
    }
}

async function fetchRecipesWithAvgRating() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`
            SELECT r.RecipeID, r.Title, r.RecipeDescription, AVG(rt.Rating) as AvgRating
            FROM RECIPECREATESSORTEDBY r
            LEFT JOIN FEEDBACKRESPONDSWITHENGAGESWITH f ON r.RecipeID = f.RecipeID
            LEFT JOIN RATING rt ON f.FeedbackID = rt.FeedbackID
            GROUP BY r.RecipeID, r.Title, r.RecipeDescription
        `);
        return result.rows;
    }).catch((err) => {
        console.error(err);
        return [];
    });
}



async function fetchRatingsFromDb() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute('SELECT * FROM Rating');
        return result.rows;
    }).catch(() => {
        return [];
    });
}


async function initiateDemotable() {
    return await withOracleDB(async (connection) => {
        try {
            await connection.execute(`DROP TABLE DEMOTABLE`);
        } catch (err) {
            console.log('Table might not exist, proceeding to create...');
        }

        const result = await connection.execute(`
            CREATE TABLE DEMOTABLE (
                id NUMBER PRIMARY KEY,
                name VARCHAR2(20)
            )
        `);
        return true;
    }).catch(() => {
        return false;
    });
}

async function insertDemotable(id, name) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `INSERT INTO DEMOTABLE (id, name) VALUES (:id, :name)`,
            [id, name],
            {autoCommit: true}
        );

        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}

async function updateNameDemotable(oldName, newName) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `UPDATE DEMOTABLE SET name=:newName where name=:oldName`,
            [newName, oldName],
            {autoCommit: true}
        );

        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}

async function countDemotable() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute('SELECT Count(*) FROM DEMOTABLE');
        return result.rows[0][0];
    }).catch(() => {
        return -1;
    });
}

async function saveRecipe(recipeId, username) {
    const connection = await oracleDB.getConnection();
    await connection.execute(
        'INSERT INTO Saves (RecipeID, Username) VALUES (:recipeId, :username)',
        [recipeId, username],
        { autoCommit: true }
    );
    await connection.close();
}


module.exports = {
    testOracleConnection,
    initiateAlltables,
    fetchRecipesFromDb,
    fetchRatingsFromDb,
    fetchDemotableFromDb,
    initiateDemotable,
    insertDemotable,
    updateNameDemotable,
    countDemotable,
    fetchRecipesWithAvgRating,
    checkLoginStatus,
    saveRecipe
};
