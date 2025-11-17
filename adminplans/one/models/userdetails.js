const { connectDB } = require('../utils/dbutils');

class UserDetails {
    static async create(userData) {
        const connection = await connectDB();
        try {
            const [result] = await connection.execute(
                `INSERT INTO usertable (name, username, password, position, social_media_link, bio, profile_picture, created_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userData.name,
                    userData.username,
                    userData.password,
                    userData.position,
                    userData.social_media_link || null,
                    userData.bio || null,
                    userData.profile_picture || null,
                    new Date()
                ]
            );
            return result.insertId;
        } finally {
            await connection.end();
        }
    }

    static async findByUsername(username) {
        const connection = await connectDB();
        try {
            const [rows] = await connection.execute(
                `SELECT * FROM usertable WHERE username = ?`,
                [username]
            );
            return rows[0];
        } finally {
            await connection.end();
        }
    }

    static async findAll() {
        const connection = await connectDB();
        try {
            const [rows] = await connection.execute(`SELECT * FROM usertable`);
            return rows;
        } finally {
            await connection.end();
        }
    }
}

module.exports = UserDetails;