const mysql_db = require("../../database/db.config")();
const pool = mysql_db.init();
require("babel-polyfill");
const moment = require("moment");

// **************BEGIN EDITING*****************

async function processQuery(query, data) {
  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows2] = await conn.query(
        "SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE"
      );
      const [rows5] = await conn.query("SET autocommit=0");
      const [rows3] = await conn.query("SELECT @@TX_ISOLATION");
      console.log(rows3);
      const [rows4] = await conn.query("SELECT @@AUTOCOMMIT");
      console.log(rows4);
      console.log("Transaction Started");
      const sql = conn.format(query, data);
      const [result] = await conn.query(sql);
      await conn.commit();
      conn.release();
      console.log("Transaction End");
      return result;
    } catch (e) {
      await conn.rollback();
      conn.release();
      console.log("Query Error");
      throw e;
    }
  } catch (e) {
    console.log("DB error");

    throw e;
  }
}

// **************QUIT EDITING*****************

exports.readPosts = async (req, res) => {
  try {
    let { page } = req.query;

    let result = await processQuery(
      "SELECT * FROM `post` ORDER BY `post_no` DESC LIMIT ? OFFSET ?",
      [5, (page - 1) * 5]
    );

    result.map(x => {
      if (x.post_content.length > 100) {
        x.post_content = x.post_content.slice(0, 100);
      }
    });

    const postCount = await processQuery(
      "SELECT count (distinct `post_no`) as cnt from `post` "
    );

    const pageCount = Math.ceil(postCount[0].cnt / 5);
    res.set("Last-Page", pageCount);

    res.json(result);
  } catch (e) {
    throw e;
  }
};

exports.readPostsById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await processQuery("SELECT * FROM `post` WHERE post_no=?", [
      id
    ]);
    res.json(result);
  } catch (e) {
    throw e;
  }
};

exports.readPostsByTitle = async (req, res) => {
  try {
    const { title } = req.params;
    const result = await processQuery(
      "SELECT * FROM `post` WHERE post_title=?",
      [title]
    );
    res.json(result);
  } catch (e) {
    throw e;
  }
};

exports.insertPost = async (req, res) => {
  try {
    let { post_title, post_content, board_no, writer } = req.body;
    const created_at = moment()
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    const response = await processQuery(
      "INSERT INTO `post` (post_title, post_content, created_at, board_no, writer) VALUES (?,?,?,?,?)",
      [post_title, post_content, created_at, board_no, writer]
    );

    res.send({
      _id: response.insertId,
      response: response
    });
  } catch (e) {
    throw e;
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    let { post_title, post_content, board_no, user_id } = req.body;

    const tmpValue = await processQuery(
      "SELECT `writer` FROM `post` WHERE post_no=? ",
      [id]
    );

    if (req.currentUsername === tmpValue[0].writer) {
      await processQuery(
        "UPDATE `post` SET post_title=?, post_content=?, board_no=? WHERE post_no=? ",
        [post_title, post_content, board_no, id]
      );
      res.send("Successfully uploaded!");
    } else {
      res.status(401).json({ success: false });
    }
  } catch (e) {
    throw e;
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const updated_at = moment()
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    const tmpValue = await processQuery(
      "SELECT `writer` FROM `post` WHERE post_no=? ",
      [id]
    );

    if (req.currentUsername === tmpValue[0].writer) {
      await processQuery("DELETE FROM `post` WHERE post_no=? ", [id]);
      res.send("Successfully deleted!");
    } else {
      res.status(401).json({ success: false });
    }
  } catch (e) {
    throw e;
  }
};

exports.insertComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { post_no, comments_content, commenter_username } = req.body;
    const comment_at = moment()
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    const response = await processQuery(
      "INSERT INTO `comments` (post_no, comments_content, commenter_username, comment_at) VALUES (?,?,?,?)",
      [id, comments_content, req.currentUsername, comment_at]
    );

    res.send({
      _id: response.insertId,
      response: response
    });
  } catch (e) {
    throw e;
  }
};

exports.readCommentsByPostId = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await processQuery(
      "SELECT * FROM `comments` WHERE post_no=? ORDER BY `comments_no`",
      [id]
    );

    res.json(result);
  } catch (e) {
    throw e;
  }
};

exports.getBoardList = async (req, res) => {
  try {
    const result = await processQuery("SELECT * FROM `board`", []);

    res.json(result);
  } catch (e) {
    throw e;
  }
};

exports.getPostsByBoardId = async (req, res) => {
  try {
    let { page } = req.query;

    const { board_id } = req.params;

    const result = await processQuery(
      "SELECT * FROM `board` natural join `post` WHERE `board_no`=? ORDER BY `post_no` DESC LIMIT ? OFFSET ?",
      [board_id, 5, (page - 1) * 5]
    );

    const postCount = await processQuery(
      "SELECT count (distinct `post_no`) as cnt from (SELECT * FROM `board` natural join `post` WHERE `board_no`=? ) as t",
      [board_id]
    );

    const pageCount = Math.ceil(postCount[0].cnt / 5);
    res.set("Last-Page", pageCount);

    res.json(result);
  } catch (e) {
    throw e;
  }
};

exports.getSearchList = async (req, res) => {
  try {
    let { keyword } = req.query;
    let result = await processQuery(
      'SELECT * FROM `post` WHERE `post_title` LIKE "' + "%" + keyword + '%"'
    );
    res.json(result);
  } catch (e) {
    throw e;
  }
};
