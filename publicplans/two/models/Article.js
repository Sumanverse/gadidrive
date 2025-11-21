// models/Article.js - FIXED
const db = require('../utils/dbutils');

class Article {
  static async create(articleData, contents) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // FIX: Add proper image path prefix
      let mainImagePath = articleData.mainImage;
      if (mainImagePath && !mainImagePath.startsWith('/uploads/articles/')) {
        mainImagePath = `/uploads/articles/${mainImagePath}`;
      }

      // UPDATE: Added sources field
      const [result] = await connection.query(
        `INSERT INTO articles (Article_title, Article_main_image, author_id, sources) VALUES (?, ?, ?, ?)`,
        [articleData.title, mainImagePath, articleData.author_id, articleData.sources || '']
      );

      const articleId = result.insertId;

      for (let i = 0; i < contents.length; i++) {
        const c = contents[i];
        let value = null, image_path = null, image_source = null;

        if (['article', 'subtitle', 'link'].includes(c.type)) {
          value = c.value;
        } else if (c.type === 'photo') {
          // FIX: Add proper image path prefix for content images
          image_path = c.image_path;
          if (image_path && !image_path.startsWith('/uploads/articles/')) {
            image_path = `/uploads/articles/${image_path}`;
          }
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
    try {
      const [articles] = await db.query(
        `SELECT 
           a.Article_id, 
           a.Article_title, 
           a.Article_main_image, 
           a.published_date,
           a.author_id,
           a.sources,
           u.name AS author_name
         FROM articles a 
         LEFT JOIN usertable u ON a.author_id = u.user_id
         ORDER BY a.published_date DESC`
      );

      console.log('Articles found:', articles ? articles.length : 0);
      
      // FIX: Ensure existing articles have proper image paths
      if (articles && articles.length > 0) {
        for (let art of articles) {
          // Fix image path if it's missing the uploads directory
          if (art.Article_main_image && !art.Article_main_image.startsWith('/uploads/articles/')) {
            art.Article_main_image = `/uploads/articles/${art.Article_main_image}`;
          }
          console.log('Article image path:', art.Article_main_image);
          
          const [contents] = await db.query(
            `SELECT * FROM article_contents WHERE article_id = ? ORDER BY content_order`,
            [art.Article_id]
          );
          
          // Fix content image paths too
          if (contents && contents.length > 0) {
            contents.forEach(content => {
              if (content.image_path && !content.image_path.startsWith('/uploads/articles/')) {
                content.image_path = `/uploads/articles/${content.image_path}`;
              }
            });
          }
          
          art.contents = contents;
        }
      }
      
      return articles || [];
    } catch (error) {
      console.error('Error in Article.findAll:', error);
      return [];
    }
  }

  static async findById(id) {
    try {
      const [rows] = await db.query(`SELECT * FROM articles WHERE Article_id = ?`, [id]);
      if (!rows.length) return null;
      
      const article = rows[0];
      
      // Fix image path if it's missing the uploads directory
      if (article.Article_main_image && !article.Article_main_image.startsWith('/uploads/articles/')) {
        article.Article_main_image = `/uploads/articles/${article.Article_main_image}`;
      }
      
      const [contents] = await db.query(
        `SELECT * FROM article_contents WHERE article_id = ? ORDER BY content_order`, [id]
      );
      
      // Fix content image paths too
      if (contents && contents.length > 0) {
        contents.forEach(content => {
          if (content.image_path && !content.image_path.startsWith('/uploads/articles/')) {
            content.image_path = `/uploads/articles/${content.image_path}`;
          }
        });
      }
      
      article.contents = contents;
      return article;
    } catch (error) {
      console.error('Error in Article.findById:', error);
      return null;
    }
  }

  static async update(id, data, contents) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      
      // FIX: Add proper image path prefix
      let mainImagePath = data.mainImage;
      if (mainImagePath && !mainImagePath.startsWith('/uploads/articles/')) {
        mainImagePath = `/uploads/articles/${mainImagePath}`;
      }
      
      // UPDATE: Added sources field in update
      await conn.query(
        `UPDATE articles SET Article_title = ?, Article_main_image = ?, sources = ? WHERE Article_id = ?`,
        [data.title, mainImagePath, data.sources || '', id]
      );
      await conn.query(`DELETE FROM article_contents WHERE article_id = ?`, [id]);

      for (let i = 0; i < contents.length; i++) {
        const c = contents[i];
        let value = null, image_path = null, image_source = null;
        
        if (['article', 'subtitle', 'link'].includes(c.type)) {
          value = c.value;
        } else if (c.type === 'photo') { 
          image_path = c.image_path;
          // FIX: Add proper image path prefix for content images
          if (image_path && !image_path.startsWith('/uploads/articles/')) {
            image_path = `/uploads/articles/${image_path}`;
          }
          image_source = c.image_source; 
        }

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