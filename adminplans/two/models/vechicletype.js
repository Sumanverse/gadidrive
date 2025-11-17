const db = require('../utils/dbutils');
const path = require('path');
const fs = require('fs');

// **FIXED: UNIQUE CHECK + vehicle_type_id**
const createVehicleType = async (vehicleTypeName, vehicle_type_photo_path) => {
    // Check if vehicle type already exists
    const [existing] = await db.execute(
        `SELECT vechicle_type_id FROM vechicletype WHERE vechicle_type_name = ?`,
        [vehicleTypeName]
    );
    
    if (existing.length > 0) {
        throw new Error(`Vehicle type "${vehicleTypeName}" already exists!`);
    }
    
    const [result] = await db.execute(
        `INSERT INTO vechicletype (vechicle_type_name, vechicle_type_photo_path, published_date)
         VALUES (?, ?, CURDATE())`,
        [vehicleTypeName, vehicle_type_photo_path]
    );
    return result.insertId;
};

// GET ALL Vehicle Types - **FIXED**
const getAllVehicleTypes = async () => {
    const [rows] = await db.execute(`
        SELECT vechicle_type_id AS id, vechicle_type_name, vechicle_type_photo_path, published_date
        FROM vechicletype 
        ORDER BY published_date DESC
    `);
    return rows;
};

// GET Vehicle Type by ID - **FIXED**
const getVehicleTypeById = async (id) => {
    const [rows] = await db.execute(
        `SELECT * FROM vechicletype WHERE vechicle_type_id = ?`,
        [id]
    );
    return rows[0];
};

// UPDATE Vehicle Type - **FIXED**
const updateVehicleType = async (id, vehicleTypeName, vehicle_type_photo_path = null) => {
    if (vehicle_type_photo_path) {
        await db.execute(
            `UPDATE vechicletype SET vechicle_type_name=?, vechicle_type_photo_path=?, published_date=CURDATE() WHERE vechicle_type_id=?`,
            [vehicleTypeName, vehicle_type_photo_path, id]
        );
    } else {
        await db.execute(
            `UPDATE vechicletype SET vechicle_type_name=?, published_date=CURDATE() WHERE vechicle_type_id=?`,
            [vehicleTypeName, id]
        );
    }
};

// DELETE Vehicle Type - **FIXED**
const deleteVehicleType = async (id) => {
    const [vehicle] = await db.execute(`SELECT vechicle_type_photo_path FROM vechicletype WHERE vechicle_type_id = ?`, [id]);
    if (vehicle[0]?.vechicle_type_photo_path) {
        const filePath = path.join(__dirname, '../public/uploads/vehicle-types', path.basename(vehicle[0].vechicle_type_photo_path));
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await db.execute(`DELETE FROM vechicletype WHERE vechicle_type_id = ?`, [id]);
};

module.exports = {
    createVehicleType,
    getAllVehicleTypes,
    getVehicleTypeById,
    updateVehicleType,
    deleteVehicleType
};