const db = require('../utils/dbutils');
const path = require('path');
const fs = require('fs');

// CREATE User
const createUser = async (userData, profileImagePath = null) => {
    const { name, username, password, position, social_media_link, bio } = userData;
    
    const [result] = await db.execute(
        `INSERT INTO usertable (name, username, password, position, social_media_link, bio, profile_picture, created_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())`,
        [name, username, password, position, social_media_link || null, bio || null, profileImagePath]
    );
    return result.insertId;
};

// GET ALL Users - **FIXED: user_id use**
const getAllUsers = async () => {
    const [rows] = await db.execute(`
        SELECT user_id AS id, name, username, position, social_media_link, bio, profile_picture, created_date 
        FROM usertable 
        ORDER BY created_date DESC
    `);
    return rows;
};

// GET User by ID - **FIXED**
const getUserById = async (id) => {
    const [rows] = await db.execute(
        `SELECT * FROM usertable WHERE user_id = ?`,
        [id]
    );
    return rows[0];
};

// UPDATE User - **FIXED**
const updateUser = async (id, userData, profileImagePath = null) => {
    const { name, username, password, position, social_media_link, bio } = userData;
    
    if (profileImagePath) {
        await db.execute(
            `UPDATE usertable SET name=?, username=?, password=?, position=?, social_media_link=?, bio=?, profile_picture=?, created_date=CURDATE() WHERE user_id=?`,
            [name, username, password, position, social_media_link || null, bio || null, profileImagePath, id]
        );
    } else {
        await db.execute(
            `UPDATE usertable SET name=?, username=?, password=?, position=?, social_media_link=?, bio=?, created_date=CURDATE() WHERE user_id=?`,
            [name, username, password, position, social_media_link || null, bio || null, id]
        );
    }
};

// DELETE User - **FIXED**
const deleteUser = async (id) => {
    const [user] = await db.execute(`SELECT profile_picture FROM usertable WHERE user_id = ?`, [id]);
    if (user[0]?.profile_picture) {
        const filePath = path.join(__dirname, '../public/uploads/profiles', path.basename(user[0].profile_picture));
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await db.execute(`DELETE FROM usertable WHERE user_id = ?`, [id]);
};

module.exports = {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
};