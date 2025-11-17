const db = require('../utils/dbutils');
const bcrypt = require('bcryptjs');

class UserDetails {
    static _parseSocialMedia(linkString, userId) {
        const trimmedLinkString = linkString ? String(linkString).trim() : '';
        if (!trimmedLinkString) return [];
        try {
            console.log(`Parsing social_media_link for user ${userId}:`, trimmedLinkString); // Debug log
            // Check if it's already an object or array, return directly if so
            if (typeof linkString === 'object' && (Array.isArray(linkString) || linkString !== null)) {
                return Array.isArray(linkString) ? linkString : [];
            }
            const parsed = JSON.parse(trimmedLinkString);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error(`JSON Parse Error for User ID ${userId}:`, error.message, 'Raw data:', trimmedLinkString);
            return [];
        }
    }

    static async createUser(userData, profileImagePath = null) {
        const { name, username, password, position, social_media_link, bio } = userData;
        const hashedPassword = await bcrypt.hash(password, 12);
        const safeBio = bio && bio.length > 150 ? bio.substring(0, 150) : bio;
        const [result] = await db.execute(
            `INSERT INTO usertable (name, username, password, position, social_media_link, bio, profile_picture, created_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())`,
            [name, username, hashedPassword, position, JSON.stringify(social_media_link || []), safeBio || null, profileImagePath]
        );
        return result.insertId;
    }

    static async authenticateUser(username, password) {
        const [rows] = await db.execute(
            `SELECT * FROM usertable WHERE username = ?`,
            [username]
        );
        if (rows.length === 0) return null;
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return null;
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    static async getUserById(id) {
        const [rows] = await db.execute(
            `SELECT user_id, name, username, position, social_media_link, bio, profile_picture, created_date 
             FROM usertable WHERE user_id = ?`,
            [id]
        );
        if (rows.length === 0) return null;
        const user = rows[0];
        console.log(`Fetched social_media_link for user ${id}:`, user.social_media_link); // Debug log
        user.socialMedia = UserDetails._parseSocialMedia(user.social_media_link, user.user_id);
        user.profilePicture = user.profile_picture;
        delete user.social_media_link;
        delete user.profile_picture;
        return user;
    }

    static async getAllUsers() {
        const [rows] = await db.execute(`
            SELECT user_id, name, username, position, social_media_link, bio, profile_picture, created_date 
            FROM usertable 
            ORDER BY created_date DESC
        `);
        return rows.map(user => {
            user.socialMedia = UserDetails._parseSocialMedia(user.social_media_link, user.user_id);
            user.profilePicture = user.profile_picture;
            const { social_media_link, profile_picture, ...userWithoutSocialLink } = user;
            return userWithoutSocialLink;
        });
    }

    static async updateUser(id, userData, profileImagePath = null) {
        const { name, username, password, position, socialMedia, bio } = userData;
        let hashedPassword = null;
        if (password && password !== '') hashedPassword = await bcrypt.hash(password, 12);
        const socialMediaJson = socialMedia && socialMedia.length > 0 ? JSON.stringify(socialMedia) : null;
        const safeBio = bio && bio.length > 150 ? bio.substring(0, 150) : bio;
        let queryParts = [];
        let params = [];

        if (name !== undefined && name !== null) {
            queryParts.push('name = ?');
            params.push(name.trim());
        }
        if (username !== undefined && username !== null) {
            queryParts.push('username = ?');
            params.push(username.trim());
        }
        if (hashedPassword) {
            queryParts.push('password = ?');
            params.push(hashedPassword);
        }
        if (position !== undefined && position !== null) {
            queryParts.push('position = ?');
            params.push(position);
        }
        if (bio !== undefined) {
            queryParts.push('bio = ?');
            params.push(safeBio || null);
        }
        if (profileImagePath) {
            queryParts.push('profile_picture = ?');
            params.push(profileImagePath);
        }
        if (socialMediaJson !== null) {
            queryParts.push('social_media_link = ?');
            params.push(socialMediaJson);
            console.log(`Attempting to update social_media_link for user ${id}: ${socialMediaJson}`);
        }

        if (queryParts.length === 0) {
            console.log(`No updates provided for user ${id}`);
            return;
        }

        const query = `UPDATE usertable SET ${queryParts.join(', ')} WHERE user_id = ?`;
        params.push(id);

        try {
            const [result] = await db.execute(query, params);
            if (result.affectedRows === 0) {
                console.log(`No user found with ID ${id}`);
                throw new Error('No user found');
            }
            console.log(`Successfully updated user ${id} with query: ${query}, params: ${JSON.stringify(params)}`);
        } catch (error) {
            console.error(`Database update error for user ${id}:`, error.message);
            throw new Error(`Update failed: ${error.message}`);
        }
    }

    static async updatePassword(id, currentPassword, newPassword) {
        try {
            const [rows] = await db.execute(`SELECT password FROM usertable WHERE user_id = ?`, [id]);
            if (rows.length === 0) return false;
            const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
            if (!isMatch) return false;
            const hashedNewPassword = await bcrypt.hash(newPassword, 12);
            await db.execute(`UPDATE usertable SET password = ? WHERE user_id = ?`, [hashedNewPassword, id]);
            return true;
        } catch (error) {
            console.error('Password update error:', error);
            throw error;
        }
    }

    static async deleteUser(id) {
        const [user] = await db.execute(`SELECT profile_picture FROM usertable WHERE user_id = ?`, [id]);
        if (user[0]?.profile_picture) {
            const path = require('path');
            const fs = require('fs');
            const filePath = path.join(__dirname, '../public/uploads/profiles', path.basename(user[0].profile_picture));
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await db.execute(`DELETE FROM usertable WHERE user_id = ?`, [id]);
    }

    static async authenticateUserByToken(token) {
        try {
            const [rows] = await db.execute(
                `SELECT * FROM usertable WHERE remember_token = ?`,
                [token]
            );
            if (rows.length === 0) return null;
            const { password: _, ...userWithoutPassword } = rows[0];
            return userWithoutPassword;
        } catch (error) {
            console.error('Token auth error:', error);
            return null;
        }
    }
}

module.exports = UserDetails;