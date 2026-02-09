import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "books",
  password: "Hiprabal@1016",  
  port: 5432,
});

db.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err) => console.error("❌ Database connection error:", err));


app.get("/", async (req, res) => {
  try {
    const allowedSortFields = ["rating", "date_read", "title"];
    const sort = allowedSortFields.includes(req.query.sort)
      ? req.query.sort
      : "date_read";

    const result = await db.query(
      `SELECT * FROM books ORDER BY ${sort} DESC`
    );

    res.render("index", { books: result.rows });
  } catch (err) {
    console.error(err);
    res.send("Error loading books.");
  }
});

// Show Add Page
app.get("/add", (req, res) => {
  res.render("add");
});

// Add Book (Create)
app.post("/add", async (req, res) => {
  try {
    const { title, author, rating, notes } = req.body;

    // Fetch cover from Open Library
    const response = await axios.get(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}`
    );

    const coverId = response.data.docs[0]?.cover_i || null;

    await db.query(
      "INSERT INTO books (title, author, rating, notes, cover_id) VALUES ($1,$2,$3,$4,$5)",
      [title, author, rating, notes, coverId]
    );

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Error adding book.");
  }
});

// Delete Book
app.post("/delete/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM books WHERE id = $1", [req.params.id]);
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Error deleting book.");
  }
});

// Edit Page
app.get("/edit/:id", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM books WHERE id = $1",
      [req.params.id]
    );
    res.render("edit", { book: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.send("Error loading edit page.");
  }
});

// Update Book
app.post("/edit/:id", async (req, res) => {
  try {
    const { title, author, rating, notes } = req.body;

    await db.query(
      "UPDATE books SET title=$1, author=$2, rating=$3, notes=$4 WHERE id=$5",
      [title, author, rating, notes, req.params.id]
    );

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Error updating book.");
  }
});

/* -------------------------
   START SERVER
--------------------------*/
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
