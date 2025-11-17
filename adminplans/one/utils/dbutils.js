const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root', // Replace with your MySQL username
    password: 'website',
    database: 'gadidrivenp_db'
};

const connectDB = async () => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('MySQL connected');
        return connection;
    } catch (error) {
        console.error('MySQL connection error:', error);
        process.exit(1);
    }
};

module.exports = { connectDB };