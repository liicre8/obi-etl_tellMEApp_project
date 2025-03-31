import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory for "matched" data
const matchedBaseDir = path.join(__dirname, '../matched');

// MongoDB Connection URI (Replace with your actual MongoDB connection string)
const mongoURI = 'mongodb://localhost:27017';  // Change if necessary
const dbName = 'Matched'; // Change this to your database name
const collectionName = 'products'; // Collection where data will be stored

// Counter to track the number of "name" values found
let counter = 0;

// Function to get the latest date folder dynamically
const getLatestDateFolder = (baseDir) => {
    if (!fs.existsSync(baseDir)) {
        console.error(`Error: Base directory "${baseDir}" does not exist.`);
        return null;
    }

    const folders = fs.readdirSync(baseDir).filter((folder) => {
        const folderPath = path.join(baseDir, folder);
        return fs.statSync(folderPath).isDirectory();
    });

    if (folders.length === 0) {
        console.error(`Error: No date folders found in "${baseDir}".`);
        return null;
    }

    // Sort folders assuming they follow the "MM-DD-YYYY" format
    const latestFolder = folders.sort((a, b) => new Date(b) - new Date(a))[0];
    return path.join(baseDir, latestFolder);
};

// Function to insert data into MongoDB
const insertIntoDatabase = async (data) => {
    const client = new MongoClient(mongoURI);
    
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        await collection.insertOne(data);
        console.log(`Inserted into MongoDB: ${data.name}`);
    } catch (error) {
        console.error(`Error inserting into MongoDB: ${error.message}`);
    } finally {
        await client.close();
    }
};

// Function to read JSON files recursively and extract "name" values
const readJsonFiles = (dir) => {
    fs.readdir(dir, (err, files) => {
        if (err) {
            console.error(`Error reading directory: ${dir}`, err);
            return;
        }

        files.forEach((file) => {
            const filePath = path.join(dir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error(`Error getting stats for file: ${filePath}`, err);
                    return;
                }

                if (stats.isDirectory()) {
                    // If it's a folder, recursively read its contents
                    readJsonFiles(filePath);
                } else if (file.endsWith('.json')) {
                    // If it's a JSON file, read and extract data
                    fs.readFile(filePath, 'utf8', async (err, data) => {
                        if (err) {
                            console.error(`Error reading JSON file: ${filePath}`, err);
                            return;
                        }

                        try {
                            const jsonData = JSON.parse(data);

                            // Ensure it's an array
                            if (Array.isArray(jsonData)) {
                                for (const obj of jsonData) {
                                    if (obj && obj.name) {
                                        counter++; // Increment counter
                                        console.log(counter, `Name: ${obj.name}`);

                                        // Prepare data for MongoDB insertion
                                        const dbData = {
                                            name: obj.name || null,
                                            image_url: obj.image_url || null,
                                            source_id: obj.source_id || null,
                                            barcode: obj.barcode || null,
                                            shop: obj.shop || null,
                                            category_id: obj.category_id || null,
                                        };

                                        // Insert into MongoDB
                                        await insertIntoDatabase(dbData);
                                    }
                                }
                            } else {
                                console.warn(`Skipping file (not an array): ${filePath}`);
                            }

                        } catch (parseErr) {
                            console.error(`Error parsing JSON file: ${filePath}`, parseErr);
                        }
                    });
                }
            });
        });
    });
};

// Find the latest date folder
const latestDateFolder = getLatestDateFolder(matchedBaseDir);

if (latestDateFolder) {
    console.log(`Processing JSON files from: ${latestDateFolder}`);
    readJsonFiles(latestDateFolder);

    // Wait a bit for asynchronous operations to complete before logging the final count
    setTimeout(() => {
        console.log(`\nTotal "name" values found: ${counter}`);
    }, 3000);
} else {
    console.error("No valid date folder found. Exiting.");
}
