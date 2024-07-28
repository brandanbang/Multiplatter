const oracledb = require('oracledb');
const loadEnvFile = require('./utils/envUtil');

const envVariables = loadEnvFile('./.env');

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
//SQL Statements to create and insert initiall values for all tables, still need to add saves  table
async function initiateAlltables() {
    return await withOracleDB(async (connection) => {
        try {
            await connection.execute(`DROP TABLE RecipeCreatesSortedBy `); //Should drop all tables or could also delete tables entirely from db
        } catch(err) {
            console.log('Table might not exist, proceeding to create...');
        }

        const result = await connection.execute(`
            CREATE TABLE RecipeCreatesSortedBy
            (
                Title VARCHAR(50),
                Picture IMAGE,
                RecipeDescription VARCHAR(200),
                RecipeID INTEGER PRIMARY KEY,
                Username VARCHAR(60),
                DescriptorName VARCHAR(50),
                FOREIGN KEY (Username) REFERENCES UserDetails(Username) ON DELETE CASCADE,
                FOREIGN KEY (DescriptorName) REFERENCES Descriptors(DescriptorName) ON DELETE SET NULL
            );
            CREATE TABLE UserLocation
            (
                PhoneNo INTEGER PRIMARY KEY,
                ProvinceState VARCHAR(30),
                City VARCHAR(60)
            );

            CREATE TABLE UserDetails
            (
                Username VARCHAR(60) NOT NULL UNIQUE,
                PhoneNo INTEGER,
                Email VARCHAR(320) NOT NULL UNIQUE,
                Name VARCHAR(40),
                PRIMARY KEY(PhoneNo),
                FOREIGN KEY (PhoneNo) REFERENCES UserLocation(PhoneNo) ON DELETE CASCADE
            );

            CREATE TABLE Descriptors
            (
                DescriptorName VARCHAR(50) PRIMARY KEY,
                DescriptorDescription VARCHAR(200)
            );


            CREATE TABLE InstructionTime
            (
                Instruction VARCHAR(300) PRIMARY KEY,
                Duration DECIMAL
            );

            CREATE TABLE InstructionStep
            (
                RecipeID INTEGER,
                StepNumber INTEGER,
                Instruction VARCHAR(300),
                PRIMARY KEY (RecipeID, StepNumber),
                FOREIGN KEY (RecipeID) REFERENCES RecipeCreatesSortedBy(RecipeID) ON DELETE CASCADE,
                FOREIGN KEY (Instruction) REFERENCES InstructionTime(Instruction) ON DELETE CASCADE
            );

            CREATE TABLE GroceryStoresArea
            (
                PostalCode CHAR(6) PRIMARY KEY,
                City VARCHAR(60),
                ProvinceState VARCHAR(60)
            );

            CREATE TABLE GroceryStoreTimings
            (
                StoreName VARCHAR(50) PRIMARY KEY,
                DaysOpen VARCHAR(30),
                Timings CHAR(11)
            );

            CREATE TABLE GroceryStoreLocation
            (
                PostalCode CHAR(6),
                Address VARCHAR(100),
                StoreName VARCHAR(50),
                PRIMARY KEY (PostalCode, Address),
                FOREIGN KEY (PostalCode) REFERENCES GroceryStoresArea(PostalCode) ON DELETE CASCADE,
                FOREIGN KEY (StoreName) REFERENCES GroceryStoreTimings(StoreName) ON DELETE CASCADE
            );

            CREATE TABLE FeedbackRespondsWithEngagesWith
            (
                FeedbackID INTEGER PRIMARY KEY,
                DateTime DATE,
                RecipeID INTEGER,
                Username VARCHAR(60),
                FOREIGN KEY (RecipeID) REFERENCES RecipeCreatesSortedBy(RecipeID) ON DELETE CASCADE,
                FOREIGN KEY (Username) REFERENCES UserDetails(Username)
            );

            CREATE TABLE CommentsRepliesTo
            (
                FeedbackID INTEGER PRIMARY KEY,
                Content VARCHAR(300) NOT NULL,
                ParentID INTEGER,
                FOREIGN KEY (FeedbackID) REFERENCES FeedbackRespondsWithEngagesWith(FeedbackID) ON DELETE CASCADE,
                FOREIGN KEY (ParentID) REFERENCES CommentsRepliesTo(FeedbackID)
            );

            CREATE TABLE Rating
            (
                FeedbackID INTEGER PRIMARY KEY,
                Rating INTEGER NOT NULL,
                FOREIGN KEY (FeedbackID) REFERENCES FeedbackRespondsWithEngagesWith(FeedbackID) ON DELETE CASCADE
            );

            CREATE TABLE RequiredItems
            (
                ItemName VARCHAR(50) PRIMARY KEY,
                ItemDescription VARCHAR(300)
            );

            CREATE TABLE Terminology
            (
                Term VARCHAR(50) PRIMARY KEY,
                Definition VARCHAR(300) NOT NULL
            );

            CREATE TABLE Substitutes
            (
                IngredientName VARCHAR(50),
                SubstituteName VARCHAR(50),
                PRIMARY KEY (IngredientName, SubstituteName),
                FOREIGN KEY (IngredientName) REFERENCES RequiredItems(ItemName),
                FOREIGN KEY (SubstituteName) REFERENCES RequiredItems(ItemName)
            );

            CREATE TABLE SoldByCurrency
            (
                PostalCode CHAR(6) PRIMARY KEY,
                Currency CHAR(30),
                FOREIGN KEY (PostalCode) REFERENCES GroceryStoresArea(PostalCode) ON DELETE CASCADE
            );

            CREATE TABLE SoldByLocation
            (
                PostalCode CHAR(6),
                Address VARCHAR(100),
                ItemName VARCHAR(50),
                Price DECIMAL,
                PRIMARY KEY (PostalCode, Address, ItemName),
                FOREIGN KEY (PostalCode, Address) REFERENCES GroceryStoreLocation(PostalCode, Address) ON DELETE CASCADE,
                FOREIGN KEY (ItemName) REFERENCES RequiredItems(ItemName) ON DELETE CASCADE
            );

            CREATE TABLE Uses
            (
                RecipeID INTEGER,
                ItemName VARCHAR(50),
                Quantity DECIMAL NOT NULL,
                Unit VARCHAR(15),
                PRIMARY KEY (RecipeID, ItemName),
                FOREIGN KEY (RecipeID) REFERENCES RecipeCreatesSortedBy(RecipeID) ON DELETE CASCADE,
                FOREIGN KEY (ItemName) REFERENCES RequiredItems(ItemName) ON DELETE CASCADE
            );

            CREATE TABLE Elaborates
            (
                Term VARCHAR(50),
                RecipeID INTEGER,
                StepNumber INTEGER,
                PRIMARY KEY (Term, RecipeID, StepNumber),
                FOREIGN KEY (Term) REFERENCES Terminology(Term) ON DELETE CASCADE,
                FOREIGN KEY (RecipeID, StepNumber) REFERENCES InstructionStep(RecipeID, StepNumber) ON DELETE CASCADE
            );

            CREATE TABLE ClassifiesBy
            (
                RecipeID INTEGER,
                DescriptorName VARCHAR(50),
                PRIMARY KEY (RecipeID, DescriptorName),
                FOREIGN KEY (RecipeID) REFERENCES RecipeCreatesSortedBy(RecipeID) ON DELETE CASCADE,
                FOREIGN KEY (DescriptorName) REFERENCES Descriptors(DescriptorName) ON DELETE CASCADE
            );




            -- Inserting values into UserLocation
            INSERT INTO UserLocation (PhoneNo, ProvinceState, City) VALUES (1234567890, 'British Columbia', 'Vancouver');
            INSERT INTO UserLocation (PhoneNo, ProvinceState, City) VALUES (1345678901, 'Zinj', 'Manama');
            INSERT INTO UserLocation (PhoneNo, ProvinceState, City) VALUES (1456789012, 'Quebec', 'Montreal');
            INSERT INTO UserLocation (PhoneNo, ProvinceState, City) VALUES (1567890123, 'Calgary', 'Alberta');
            INSERT INTO UserLocation (PhoneNo, ProvinceState, City) VALUES (1678901234, 'Manitoba', 'Winnipeg');
            INSERT INTO UserLocation (PhoneNo, ProvinceState, City) VALUES (1678901284, 'Mumbai', 'Maharashtra');


            INSERT INTO UserDetails (Username, PhoneNo, Email, Name) VALUES ('chef_janes', 1234567890, 'jane.stevens@gmail.com', 'Jane Stevens');
            INSERT INTO UserDetails (Username, PhoneNo, Email, Name) VALUES ('greatestBossEver', 1345678901, 'micheal.scott@yahoo.com', 'Michael Scott');
            INSERT INTO UserDetails (Username, PhoneNo, Email, Name) VALUES ('culinary_queen248', 1456789012, 'alice.cooper_12@gmail.com', 'Alice Cooper');
            INSERT INTO UserDetails (Username, PhoneNo, Email, Name) VALUES ('bake_master', 1567890123, 'james.brown@gmail.com', 'James Brown');
            INSERT INTO UserDetails (Username, PhoneNo, Email, Name) VALUES ('spicylover', 1678901234, 'gordon.ramsey@yahoo.com', 'Gordon Ramsey');
            INSERT INTO UserDetails (Username, PhoneNo, Email, Name) VALUES ('best_cook_2', 1678901284, 'srk_02@gmail.com', 'Shah Rukh Khan');


            INSERT INTO Descriptors (DescriptorName, DescriptorDescription) VALUES ('pescatarian', 'a person who eats fish but no other meat');
            INSERT INTO Descriptors (DescriptorName, DescriptorDescription) VALUES ('lunch', 'a meal typically eaten at the middle of the day');
            INSERT INTO Descriptors (DescriptorName, DescriptorDescription) VALUES ('French Recipe', 'A recipe that belongs to the French cuisine');
            INSERT INTO Descriptors (DescriptorName, DescriptorDescription) VALUES ('spicy', 'a dish flavoured with spices or chilli peppers');
            INSERT INTO Descriptors (DescriptorName, DescriptorDescription) VALUES ('quick', 'a meal that takes less than 10 minutes to prepare');
            INSERT INTO Descriptors (DescriptorName, DescriptorDescription) VALUES ('dessert', 'The sweet course eaten at the end of a meal');

-- Inserting values into RecipeCreatesSortedBy
            INSERT INTO RecipeCreatesSortedBy (Title, NULL, RecipeDescription, RecipeID, Username, DescriptorName) VALUES ('Classic Chocolate Cake', 'A rich and moist chocolate cake perfect for any occasion.', 101, 'chef_janes', 'dessert');
            INSERT INTO RecipeCreatesSortedBy (Title, NULL, RecipeDescription, RecipeID, Username, DescriptorName) VALUES ('Spaghetti Bolognese', 'A traditional Italian pasta dish with a flavorful meat sauce.', 103, 'best_cook_2', 'lunch');
            INSERT INTO RecipeCreatesSortedBy (Title, NULL, RecipeDescription, RecipeID, Username, DescriptorName) VALUES ('Vegan Tacos', 'Delicious and healthy vegan tacos packed with fresh vegetables.', 102, 'culinary_queen248', 'spicy');
            INSERT INTO RecipeCreatesSortedBy (Title, NULL, RecipeDescription, RecipeID, Username, DescriptorName) VALUES ('Lemon Drizzle Cake', 'A zesty and moist lemon cake with a tangy drizzle topping.', 105, 'bake_master', 'dessert');
            INSERT INTO RecipeCreatesSortedBy (Title, NULL, RecipeDescription, RecipeID, Username, DescriptorName) VALUES ('Spicy Chicken Curry', 'A hearty and spicy chicken curry with a rich, flavorful sauce.', 104, 'spicylover', 'spicy');
            INSERT INTO RecipeCreatesSortedBy (Title, NULL,  RecipeDescription, RecipeID, Username, DescriptorName) VALUES ('Avocado Toast', 'Simple and delicious avocado toast, perfect for a quick breakfast.', 106, 'chef_janes', 'quick');

-- Inserting values into InstructionTime
            INSERT INTO InstructionTime (Instruction, Duration) VALUES ('Preheat the oven to 350 degrees F.', 15);
            INSERT INTO InstructionTime (Instruction, Duration) VALUES ('Mix flour and sugar in a bowl.', 10);
            INSERT INTO InstructionTime (Instruction, Duration) VALUES ('Chop the onions into julienne strips and dice the garlic.', 15);
            INSERT INTO InstructionTime (Instruction, Duration) VALUES ('Heat oil in a pan and sauté onions and garlic. Then deglaze the pan with white wine.', 20);
            INSERT INTO InstructionTime (Instruction, Duration) VALUES ('Boil the pasta to al dente.', 10);
            INSERT INTO InstructionTime (Instruction, Duration) VALUES ('Blanch the spinach.', 5);
            INSERT INTO InstructionTime (Instruction, Duration) VALUES ('Toast the bread.', 3);
            INSERT INTO InstructionTime (Instruction, Duration) VALUES ('Mix pasta with prepared sauce.', 1);

-- Inserting values into InstructionStep
            INSERT INTO InstructionStep (RecipeID, Instruction, StepNumber) VALUES (101, 'Preheat the oven to 350 degrees F.', 1);
            INSERT INTO InstructionStep (RecipeID, Instruction, StepNumber) VALUES (101, 'Mix flour and sugar in a bowl.', 2);
            INSERT INTO InstructionStep (RecipeID, Instruction, StepNumber) VALUES (102, 'Chop the onions into julienne strips and dice the garlic.', 1);
            INSERT INTO InstructionStep (RecipeID, Instruction, StepNumber) VALUES (102, 'Heat oil in a pan and sauté onions and garlic. Then deglaze the pan with white wine.', 2);
            INSERT INTO InstructionStep (RecipeID, Instruction, StepNumber) VALUES (103, 'Boil the pasta to al dente.', 1);
            INSERT INTO InstructionStep (RecipeID, Instruction, StepNumber) VALUES (103, 'Mix pasta with prepared sauce.', 2);
            INSERT INTO InstructionStep (RecipeID, Instruction, StepNumber) VALUES (104, 'Blanch the spinach.', 1);
            INSERT INTO InstructionStep (RecipeID, Instruction, StepNumber) VALUES (106, 'Toast the bread.', 1);

-- Inserting values into GroceryStoresArea
            INSERT INTO GroceryStoresArea (PostalCode, City, ProvinceState) VALUES ('V5K0A1', 'Vancouver', 'British Columbia');
            INSERT INTO GroceryStoresArea (PostalCode, City, ProvinceState) VALUES ('M5V2T6', 'Toronto', 'Ontario');
            INSERT INTO GroceryStoresArea (PostalCode, City, ProvinceState) VALUES ('H2Z1J9', 'Montreal', 'Quebec');
            INSERT INTO GroceryStoresArea (PostalCode, City, ProvinceState) VALUES ('T2P3G7', 'Calgary', 'Alberta');
            INSERT INTO GroceryStoresArea (PostalCode, City, ProvinceState) VALUES ('R3B0R5', 'Winnipeg', 'Manitoba');

-- Inserting values into GroceryStoreTimings
            INSERT INTO GroceryStoreTimings (StoreName, DaysOpen, Timings) VALUES ('Save On Foods', 'Mon-Sun', '08:00-23:00');
            INSERT INTO GroceryStoreTimings (StoreName, DaysOpen, Timings) VALUES ('Loblaws', 'Mon-Sun', '09:00-22:00');
            INSERT INTO GroceryStoreTimings (StoreName, DaysOpen, Timings) VALUES ('PC Express', 'Mon-Sat', '07:00-21:00');
            INSERT INTO GroceryStoreTimings (StoreName, DaysOpen, Timings) VALUES ('Safeway', 'Mon-Sun', '10:00-23:00');
            INSERT INTO GroceryStoreTimings (StoreName, DaysOpen, Timings) VALUES ('No Frills', 'Mon-Fri', '08:00-23:00');

-- Inserting values into GroceryStoreLocation
            INSERT INTO GroceryStoreLocation (PostalCode, Address, StoreName) VALUES ('V5K0A1', '1234 Main St', 'Save On Foods');
            INSERT INTO GroceryStoreLocation (PostalCode, Address, StoreName) VALUES ('M5V2T6', '5678 Queen St', 'Loblaws');
            INSERT INTO GroceryStoreLocation (PostalCode, Address, StoreName) VALUES ('H2Z1J9', '9101 Rue St.', 'Save On Foods');
            INSERT INTO GroceryStoreLocation (PostalCode, Address, StoreName) VALUES ('T2P3G7', '1213 4th Ave', 'Safeway');
            INSERT INTO GroceryStoreLocation (PostalCode, Address, StoreName) VALUES ('R3B0R5', '1415 Ellice Ave', 'No Frills');

-- Inserting values into RequiredItems
            INSERT INTO RequiredItems (ItemName, ItemDescription) VALUES ('Flour', 'All-purpose flour used for baking and cooking.');
            INSERT INTO RequiredItems (ItemName, ItemDescription) VALUES ('Sugar', 'Granulated white sugar for sweetening.');
            INSERT INTO RequiredItems (ItemName, ItemDescription) VALUES ('Eggs', 'Fresh eggs for baking and cooking.');
            INSERT INTO RequiredItems (ItemName, ItemDescription) VALUES ('Whisk', 'A utensil for whipping eggs or cream');
            INSERT INTO RequiredItems (ItemName, ItemDescription) VALUES ('Baking Tray', 'A metal tray on which food may be cooked in an oven');
            INSERT INTO RequiredItems (ItemName, ItemDescription) VALUES ('White Wine', 'Wine made from grapes without using their skin');
            INSERT INTO RequiredItems (ItemName, ItemDescription) VALUES ('Lemon', 'A yellow citrus fruit having a thick skin');
            INSERT INTO RequiredItems (ItemName, ItemDescription) VALUES ('Chicken', '(Here) Meat obtained from the domestic animal chicken');
            INSERT INTO RequiredItems (ItemName, ItemDescription) VALUES ('Tofu', 'A type of curd made from soybeans');
            INSERT INTO RequiredItems (ItemName, ItemDescription) VALUES ('Chicken Broth', 'Broth obtained from boiling chicken pieces');
            INSERT INTO RequiredItems (ItemName, ItemDescription) VALUES ('Vegetable Broth', 'Broth obtained from boiling vegetables');
            INSERT INTO RequiredItems (ItemName, ItemDescription) VALUES ('Lime', 'A green citrus fruit');
            INSERT INTO RequiredItems (ItemName, ItemDescription) VALUES ('Sour Cream', 'Cream obtained by fermenting it with bacteria');
            INSERT INTO RequiredItems (ItemName, ItemDescription) VALUES ('Greek Yogurt', 'Yogurt that has been strained');

-- Inserting values into FeedbackRespondsWithEngagesWith


            INSERT INTO FeedbackRespondsWithEngagesWith (FeedbackID, DateTime, RecipeID, Username) VALUES (1, TO_DATE('2024-07-19 14:30:00', 'YYYY-MM-DD HH24:MI:SS'), 101, 'chef_janes');
            INSERT INTO FeedbackRespondsWithEngagesWith (FeedbackID, DateTime, RecipeID, Username) VALUES (2, TO_DATE('2024-07-19 15:00:00', 'YYYY-MM-DD HH24:MI:SS'), 102, 'best_cook_2');
            INSERT INTO FeedbackRespondsWithEngagesWith (FeedbackID, DateTime, RecipeID, Username) VALUES (3, TO_DATE('2024-07-20 09:15:00', 'YYYY-MM-DD HH24:MI:SS'), 101, 'culinary_queen248');
            INSERT INTO FeedbackRespondsWithEngagesWith (FeedbackID, DateTime, RecipeID, Username) VALUES (4, TO_DATE('2024-07-21 10:45:00', 'YYYY-MM-DD HH24:MI:SS'), 103, 'bake_master');
            INSERT INTO FeedbackRespondsWithEngagesWith (FeedbackID, DateTime, RecipeID, Username) VALUES (5, TO_DATE('2024-07-20 11:30:00', 'YYYY-MM-DD HH24:MI:SS'), 101, 'spicylover');
            INSERT INTO FeedbackRespondsWithEngagesWith (FeedbackID, DateTime, RecipeID, Username) VALUES (6, TO_DATE('2024-07-20 11:32:00', 'YYYY-MM-DD HH24:MI:SS'), 102, 'spicylover');
            INSERT INTO FeedbackRespondsWithEngagesWith (FeedbackID, DateTime, RecipeID, Username) VALUES (7, TO_DATE('2024-07-20 11:40:00', 'YYYY-MM-DD HH24:MI:SS'), 101, 'bake_master');


-- Inserting values into CommentsRepliesTo
            INSERT INTO CommentsRepliesTo (FeedbackID, Content, ParentID) VALUES (1, 'This recipe is fantastic! The instructions were clear and easy to follow.', NULL);
            INSERT INTO CommentsRepliesTo (FeedbackID, Content, ParentID) VALUES (2, 'I loved the flavours in this dish. Will definitely make it again!', NULL);
            INSERT INTO CommentsRepliesTo (FeedbackID, Content, ParentID) VALUES (3, 'Great recipe! I added some extra spices and it turned out perfect :)', NULL);
            INSERT INTO CommentsRepliesTo (FeedbackID, Content, ParentID) VALUES (4, 'Thanks for sharing this recipe! It was a hit at my dinner party', NULL);
            INSERT INTO CommentsRepliesTo (FeedbackID, Content, ParentID) VALUES (5, 'I agree with you, the instructions were very clear unfortunately didn’t like it as much as I thought I would.', 1);
            INSERT INTO CommentsRepliesTo (FeedbackID, Content, ParentID) VALUES (6, 'I had the same experience! The flavours were amazing!!!', 2);
            INSERT INTO CommentsRepliesTo (FeedbackID, Content, ParentID) VALUES (7, 'What spices did you add?? I’d love to try that next time.', 3);

-- Inserting values into Rating
            INSERT INTO Rating (FeedbackID, Rating) VALUES (1, 5);
            INSERT INTO Rating (FeedbackID, Rating) VALUES (2, 4);
            INSERT INTO Rating (FeedbackID, Rating) VALUES (3, 5);
            INSERT INTO Rating (FeedbackID, Rating) VALUES (4, 4);
            INSERT INTO Rating (FeedbackID, Rating) VALUES (5, 3);
            INSERT INTO Rating (FeedbackID, Rating) VALUES (6, 4);

-- Inserting values into Terminology
            INSERT INTO Terminology (Term, Definition) VALUES ('Al dente', 'This refers to cooking something, usually pasta or rice, such that it is firm.');
            INSERT INTO Terminology (Term, Definition) VALUES ('Blanch', 'This is a method of cooking food where it is immersed in boiling water for a short period then put in an ice bath.');
            INSERT INTO Terminology (Term, Definition) VALUES ('Julienne', 'A culinary cutting method such that the food is cut into long strips resembling a matchstick.');
            INSERT INTO Terminology (Term, Definition) VALUES ('Dice', 'A culinary cutting method such that the food is cut into small squares.');
            INSERT INTO Terminology (Term, Definition) VALUES ('Deglaze', 'When bits of food stuck to the pan are released using liquids (for example, wine).');

-- Inserting values into Elaborates
            INSERT INTO Elaborates (Term, RecipeID, StepNumber) VALUES ('Al dente', 103, 1);
            INSERT INTO Elaborates (Term, RecipeID, StepNumber) VALUES ('Blanch', 104, 1);
            INSERT INTO Elaborates (Term, RecipeID, StepNumber) VALUES ('Deglaze', 102, 2);
            INSERT INTO Elaborates (Term, RecipeID, StepNumber) VALUES ('Julienne', 102, 1);
            INSERT INTO Elaborates (Term, RecipeID, StepNumber) VALUES ('Dice', 102, 1);

-- Inserting values into ClassifiesBy
            INSERT INTO ClassifiesBy (RecipeID, DescriptorName) VALUES (101, 'dessert');
            INSERT INTO ClassifiesBy (RecipeID, DescriptorName) VALUES (103, 'lunch');
            INSERT INTO ClassifiesBy (RecipeID, DescriptorName) VALUES (102, 'spicy');
            INSERT INTO ClassifiesBy (RecipeID, DescriptorName) VALUES (104, 'spicy');
            INSERT INTO ClassifiesBy (RecipeID, DescriptorName) VALUES (106, 'quick');

-- Inserting values into Uses
            INSERT INTO Uses (RecipeID, ItemName, Quantity, Unit) VALUES (101, 'Whisk', 1, NULL);
            INSERT INTO Uses (RecipeID, ItemName, Quantity, Unit) VALUES (103, 'Eggs', 0.5, 'kg');
            INSERT INTO Uses (RecipeID, ItemName, Quantity, Unit) VALUES (104, 'Flour', 400, 'grams');
            INSERT INTO Uses (RecipeID, ItemName, Quantity, Unit) VALUES (106, 'Eggs', 1, 'unit');
            INSERT INTO Uses (RecipeID, ItemName, Quantity, Unit) VALUES (101, 'Sugar', 0.2, 'kg');

-- Inserting values into SoldByCurrency
            INSERT INTO SoldByCurrency (PostalCode, Currency) VALUES ('V5K0A1', 'CAD');
            INSERT INTO SoldByCurrency (PostalCode, Currency) VALUES ('M5V2T6', 'CAD');
            INSERT INTO SoldByCurrency (PostalCode, Currency) VALUES ('H2Z1J9', 'CAD');
            INSERT INTO SoldByCurrency (PostalCode, Currency) VALUES ('R3B0R5', 'CAD');
            INSERT INTO SoldByCurrency (PostalCode, Currency) VALUES ('T2P3G7', 'USD');

-- Inserting values into SoldByLocation
            INSERT INTO SoldByLocation (PostalCode, Address, ItemName, Price) VALUES ('V5K0A1', '1234 Main St', 'Whisk', 4);
            INSERT INTO SoldByLocation (PostalCode, Address, ItemName, Price) VALUES ('M5V2T6', '5678 Queen St', 'Sugar', 0.7);
            INSERT INTO SoldByLocation (PostalCode, Address, ItemName, Price) VALUES ('T2P3G7', '1213 4th Ave', 'Flour', 0.9);
            INSERT INTO SoldByLocation (PostalCode, Address, ItemName, Price) VALUES ('T2P3G7', '1213 4th Ave', 'Eggs', 0.8);
            INSERT INTO SoldByLocation (PostalCode, Address, ItemName, Price) VALUES ('R3B0R5', '1415 Ellice Ave', 'Baking Tray', 3);
            INSERT INTO SoldByLocation (PostalCode, Address, ItemName, Price) VALUES ('T2P3G7', '1213 4th Ave', 'Baking Tray', 4);

-- Inserting values into Substitutes
            INSERT INTO Substitutes (IngredientName, SubstituteName) VALUES ('White Wine', 'Lemon');
            INSERT INTO Substitutes (IngredientName, SubstituteName) VALUES ('Chicken', 'Tofu');
            INSERT INTO Substitutes (IngredientName, SubstituteName) VALUES ('Chicken Broth', 'Vegetable Broth');
            INSERT INTO Substitutes (IngredientName, SubstituteName) VALUES ('Lemon', 'Lime');
            INSERT INTO Substitutes (IngredientName, SubstituteName) VALUES ('Sour Cream', 'Greek Yogurt');
        `);
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

async function fetchRecipesWithAvgRating() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`
            SELECT r.RecipeID, r.Title, r.Picture, r.RecipeDescription, AVG(rt.Rating) as AvgRating
            FROM RecipeCreatesSortedBy r
            LEFT JOIN Rating rt ON r.RecipeID = rt.RecipeID
            GROUP BY r.RecipeID, r.Title, r.Picture, r.RecipeDescription
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
        } catch(err) {
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
            { autoCommit: true }
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
            { autoCommit: true }
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
    fetchRecipesWithAvgRating
};