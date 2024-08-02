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
        const response = await fetch('/checkLoginStatus');
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
    return await withOracleDB(async (connection) => {
        const result = await connection.execute('INSERT INTO Saves (RecipeID, Username) VALUES (:recipeId, :username)',
            [recipeId, username],
            { autoCommit: true });

    }).catch(() =>{
        return false;
    })

}

// async function loginUser(username,password){
//         return await withOracleDB(async (connection) => {
//             const result = await connection.execute(`
//             SELECT u.Username,u.Password
//             FROM UserDetails u
//             WHERE u.Username = :username AND u.Password = :password;
//         `,[username,password]);
//             if (result.rows.length >0) {
//              console.log('Login Successful!');
//                 return result.rowsAffected && result.rowsAffected > 0;
//             } else {
//             console.log('Username does not exist');
//                 return result.rowsAffected && result.rowsAffected > 0;
//             }
//             // return result.rows;
//     }).catch(() => {
//         return false;
//     });
// }

async function loginUser(username, password) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`
            SELECT u.Username, u.Password
            FROM UserDetails u
            WHERE u.Username = :username AND u.Password = :password
        `, [username, password]);

        return result.rows.length > 0;
    }).catch(() => {
        return false;
    });
}

async function getUserDetails(username) {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);

        const result = await connection.execute(
            `SELECT ud.Username, ud.Name, ud.Email, ud.PhoneNo, ul.City, ul.ProvinceState
             FROM UserDetails ud
             JOIN UserLocation ul ON ud.PhoneNo = ul.PhoneNo
             WHERE ud.Username = :username`,
            [username]
        );

        if (result.rows.length > 0) {
            const row = result.rows[0];
            return {
                Username: row[0],
                Name: row[1],
                Email: row[2],
                PhoneNo: row[3],
                City: row[4],
                ProvinceState: row[5]
            };
        } else {
            return null;
        }
    } catch (err) {
        console.error('Error in getUserDetails:', err);
        return null;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection in getUserDetails:', err);
            }
        }
    }
}

async function signupUser(city,provinceState,username, password,phoneNo,email,name) {
    return await withOracleDB(async (connection) => {
        const userstate = await connection.execute  (`
         SELECT u.Username FROM UserDetails u
         where u.Username = :username`,
            [username]);

        if (userstate.rows.length > 0) {
            console.log('user already exists , appservice');
            return false;
        }

        const emailstate = await connection.execute  (`
         SELECT u.Username FROM UserDetails u
         where u.Email = :email`,
            [email]);
        if (emailstate.rows.length > 0) {
            console.log('email already in use , appservice');
            return false;
        }

        const phonestate = await connection.execute  (`
         SELECT u.Username FROM UserDetails u
         where u.PhoneNo = :phoneNo`,
            [phoneNo]);
        if (phonestate.rows.length > 0) {
            return false;
        }

        const result1 = await connection.execute(
            `INSERT INTO UserLocation (PhoneNo, ProvinceState, City) 
            VALUES (:phoneNo, :provinceState, :city) `,
            [phoneNo,provinceState,city],{autocommit: true});


        const result2 = await connection.execute(
            `INSERT INTO USERDETAILS (Username,Password, PhoneNo, Email, Name) 
            VALUES (:username,:password,:phoneNo, :email,:name) `,
                [username,password,phoneNo,email,name],
                {autoCommit: true}

            );
            return result1.rowsAffected > 0 && result2.rowsAffected > 0;

    }).catch(() => {
        return false;
    });
}

async function getSavedRecipes(username) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT r.RecipeID, r.Title, r.RecipeDescription, AVG(rt.Rating) AS AvgRating
             FROM RecipeCreatesSortedBy r
                      JOIN Saves sr ON r.RecipeID = sr.RecipeID
                      LEFT JOIN FEEDBACKRESPONDSWITHENGAGESWITH f ON r.RecipeID = f.RecipeID
                      LEFT JOIN RATING rt ON f.FeedbackID = rt.FeedbackID
             WHERE sr.Username = :username
             GROUP BY r.RecipeID, r.Title, r.RecipeDescription
            `,
            [username]
            //{ outFormat: oracledb.OUT_FORMAT_OBJECT } // TODO: Check tomorrow if this is needed
        );
        return result.rows;
    } catch (err) {
        console.error('Error fetching saved recipes:', err);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
}


async function getCreatedRecipes(username) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT r.RecipeID, r.Title, r.RecipeDescription, AVG(rt.Rating) AS AvgRating
            FROM RecipeCreatesSortedBy r
            LEFT JOIN FEEDBACKRESPONDSWITHENGAGESWITH f ON r.RecipeID = f.RecipeID
            LEFT JOIN RATING rt ON f.FeedbackID = rt.FeedbackID
            WHERE r.Username = :username
            GROUP BY r.RecipeID, r.Title, r.RecipeDescription
            `,
            [username],
        );
        return result.rows;
    } catch (err) {
        console.error('Error fetching your recipes:', err);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
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
    saveRecipe,
    loginUser,
    signupUser,
    getUserDetails,
    getSavedRecipes,
    getCreatedRecipes
};