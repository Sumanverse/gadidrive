// models/userdetails.js
const db = require('../utils/dbutils');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

class UserDetails {
    // === FINAL: HANDLE BOTH STRING & OBJECT ===
    static _parseSocialMedia(linkString) {
        // If already array (auto-parsed by mysql2), return directly
        if (Array.isArray(linkString)) {
            console.log('social_media: Already parsed array →', linkString);
            return linkString;
        }

        const raw = linkString == null ? '' : String(linkString).trim();

        // Check if valid JSON string
        if (raw && raw.startsWith('[') && raw.endsWith(']') && raw.includes('"link"') && raw.includes('"type"')) {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    console.log('social_media: Valid JSON string →', parsed);
                    return parsed;
                }
            } catch (e) {
                console.error('JSON Parse failed:', e.message);
            }
        }

        // Empty cases
        if (!raw || raw === '' || raw === 'NULL' || raw === '[]' || raw === '[object Object]') {
            console.log('social_media: Empty → []');
            return [];
        }

        // Final try
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                console.log('social_media: Parsed →', parsed);
                return parsed;
            }
        } catch (error) {
            console.error('JSON Parse Error:', error.message, '| Raw:', raw);
            return [];
        }

        return [];
    }

    // === CREATE USER ===
    static async createUser(userData, profileImagePath = null) {
        const { name, username, password, position } = userData;
        if (!name || !username || !password || !position) {
            throw new Error('All fields are required');
        }

        const [existing] = await db.execute('SELECT user_id FROM usertable WHERE username = ?', [username.trim()]);
        if (existing.length > 0) throw new Error('Username already taken');

        const hashedPassword = await bcrypt.hash(password, 12);
        const [result] = await db.execute(
            `INSERT INTO usertable (name, username, password, position, profile_picture, bio, social_media, created_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())`,
            [name.trim(), username.trim(), hashedPassword, position, profileImagePath, '', '[]']
        );
        return result.insertId;
    }

    // === AUTHENTICATE USER ===
    static async authenticateUser(username, password) {
        const [rows] = await db.execute(`SELECT * FROM usertable WHERE username = ?`, [username]);
        if (rows.length === 0) return null;

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return null;

        const { password: _, ...userWithoutPassword } = user;
        userWithoutPassword.socialMedia = this._parseSocialMedia(user.social_media);
        userWithoutPassword.profilePicture = user.profile_picture || '/images/default-avatar.png';
        return userWithoutPassword;
    }

    // === GET USER BY ID ===
    static async getUserById(id) {
        const [rows] = await db.execute(
            `SELECT user_id, name, username, position, profile_picture, bio, social_media, created_date 
             FROM usertable WHERE user_id = ?`,
            [id]
        );
        if (rows.length === 0) return null;

        const user = rows[0];
        console.log('RAW social_media from DB:', user.social_media);
        user.socialMedia = this._parseSocialMedia(user.social_media);
        user.profilePicture = user.profile_picture || '/images/default-avatar.png';
        return user;
    }

    // === GET ALL USERS ===
    static async getAllUsers() {
        const [rows] = await db.execute(`
            SELECT user_id, name, username, position, profile_picture, created_date, social_media 
            FROM usertable ORDER BY created_date DESC
        `);
        return rows.map(user => ({
            ...user,
            profilePicture: user.profile_picture || '/images/default-avatar.png',
            socialMedia: this._parseSocialMedia(user.social_media)
        }));
    }

    // === UPDATE USER ===
    static async updateUser(id, userData, profileImagePath = null) {
        let queryParts = [];
        let params = [];

        if (userData.name !== undefined) { 
            queryParts.push('name = ?'); 
            params.push(userData.name.trim()); 
        }
        if (userData.username !== undefined) { 
            queryParts.push('username = ?'); 
            params.push(userData.username.trim()); 
        }
        if (userData.bio !== undefined) { 
            queryParts.push('bio = ?'); 
            params.push((userData.bio || '').trim().substring(0, 150)); 
        }
        if (userData.social_media !== undefined) { 
            const value = typeof userData.social_media === 'string' 
                ? userData.social_media 
                : JSON.stringify(Array.isArray(userData.social_media) ? userData.social_media : []);
            console.log('Updating social_media →', value);
            queryParts.push('social_media = ?'); 
            params.push(value); 
        }
        if (profileImagePath) { 
            queryParts.push('profile_picture = ?'); 
            params.push(profileImagePath); 
        }

        if (queryParts.length === 0) return;

        const query = `UPDATE usertable SET ${queryParts.join(', ')} WHERE user_id = ?`;
        params.push(id);

        const [result] = await db.execute(query, params);
        if (result.affectedRows === 0) throw new Error('User not found');
    }

    // === UPDATE PASSWORD ===
    static async updatePassword(id, currentPassword, newPassword) {
        const [rows] = await db.execute(`SELECT password FROM usertable WHERE user_id = ?`, [id]);
        if (rows.length === 0) return false;

        const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
        if (!isMatch) return false;

        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        await db.execute(`UPDATE usertable SET password = ? WHERE user_id = ?`, [hashedNewPassword, id]);
        return true;
    }

    // === DELETE USER ===
    static async deleteUser(id) {
        const [user] = await db.execute(`SELECT profile_picture FROM usertable WHERE user_id = ?`, [id]);
        if (user[0]?.profile_picture && user[0].profile_picture.startsWith('/uploads/profiles/')) {
            const filePath = path.join(__dirname, '../../public', user[0].profile_picture);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await db.execute(`DELETE FROM usertable WHERE user_id = ?`, [id]);
    }
}

module.exports = UserDetails;