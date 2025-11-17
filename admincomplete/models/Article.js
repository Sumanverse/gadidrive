// models/Article.js
const db = require('../utils/dbutils');

class Article {
  static async create(articleData, contents) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO articles (Article_title, Article_main_image, author_id) VALUES (?, ?, ?)`,
        [articleData.title, articleData.mainImage, articleData.author_id]
      );

      const articleId = result.insertId;

      for (let i = 0; i < contents.length; i++) {
        const c = contents[i];
        let value = null, image_path = null, image_source = null;

        if (['article', 'subtitle', 'link'].includes(c.type)) {
          value = c.value;
        } else if (c.type === 'photo') {
          image_path = c.image_path;
          image_source = c.image_source;
        }

        await connection.query(
          `INSERT INTO article_contents (article_id, type, content_order, value, image_path, image_source)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [articleId, c.type, i + 1, value, image_path, image_source]
        );
      }

      await connection.commit();
      return articleId;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async findAll() {
    const [articles] = await db.query(
      `SELECT 
         a.Article_id, 
         a.Article_title, 
         a.Article_main_image, 
         a.published_date,
         a.author_id,
         u.name AS author_name
       FROM articles a 
       LEFT JOIN usertable u ON a.author_id = u.user_id
       ORDER BY a.published_date DESC`
    );

    for (let art of articles) {
      const [contents] = await db.query(
        `SELECT * FROM article_contents WHERE article_id = ? ORDER BY content_order`,
        [art.Article_id]
      );
      art.contents = contents;
    }
    return articles;
  }

  static async findById(id) {
    const [rows] = await db.query(`SELECT * FROM articles WHERE Article_id = ?`, [id]);
    if (!rows.length) return null;
    const article = rows[0];
    const [contents] = await db.query(
      `SELECT * FROM article_contents WHERE article_id = ? ORDER BY content_order`, [id]
    );
    article.contents = contents;
    return article;
  }

  static async update(id, data, contents) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(
        `UPDATE articles SET Article_title = ?, Article_main_image = ? WHERE Article_id = ?`,
        [data.title, data.mainImage, id]
      );
      await conn.query(`DELETE FROM article_contents WHERE article_id = ?`, [id]);

      for (let i = 0; i < contents.length; i++) {
        const c = contents[i];
        let value = null, image_path = null, image_source = null;
        if (['article', 'subtitle', 'link'].includes(c.type)) value = c.value;
        else if (c.type === 'photo') { image_path = c.image_path; image_source = c.image_source; }

        await conn.query(
          `INSERT INTO article_contents (article_id, type, content_order, value, image_path, image_source)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, c.type, i + 1, value, image_path, image_source]
        );
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async delete(id) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(`DELETE FROM article_contents WHERE article_id = ?`, [id]);
      await conn.query(`DELETE FROM articles WHERE Article_id = ?`, [id]);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = Article;