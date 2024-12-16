require("dotenv").config();

const express = require ('express');
const app = express();
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);

app.use(express.json());
app.use(require('morgan')('dev'));

//READ ALL - GET /api/flavors
app.get("/api/flavors", async(req, res, next)=>{
    try {
        const SQL = /*sql*/`SELECT * from flavors ORDER BY created_at DESC`;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (error) {
        next(error);
    }
})
//READ Single - GET /api/flavors/:id
app.get("/api/flavors/:id", async(req, res, next)=>{
    try {
        const SQL = /*sql*/`SELECT * from flavors WHERE id=$1`;
        const response = await client.query(SQL,[req.params.id]);
        res.send(response.rows);
    } catch (error) {
        next(error);
    }
})

//CREATE - POST  /api/flavors
app.post("/api/flavors", async(req,res,next)=>{
    try {
        const SQL = /*sql*/`
        INSERT INTO flavors(name)
        VALUES($1)
        RETURNING *
        `;
        const response = await client.query(SQL, [req.body.name]);
        res.status(201).send(response.rows[0]);
    } catch (error) {
        next(error);
    }
})


//DELETE - DELETE  /api/flavors/:id
app.delete("/api/flavors/:id", async(req,res,next)=>{
    try {
        const SQL = /*sql*/`DELETE FROM flavors WHERE id=$1`;
        await client.query(SQL, [req.params.id]);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
})

//UPDATE - PUT  /api/flavors/:id
app.put("/api/flavors/:id", async(req,res,next)=>{
    try {
        const SQL = /*sql*/`
        UPDATE flavors
        SET name=$1, updated_at=now()
        WHERE id=$2
        RETURNING *
        `;
        const response = await client.query(SQL, [req.body.name, req.params.id]);
        res.send(response.rows[0]);
    } catch (error) {
        next(error);
    }
})

const init = async() =>{
    await client.connect();
    console.log('connection success');
    
    let SQL =/*sql*/`
    DROP TABLE IF EXISTS flavors;
    CREATE TABLE flavors(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        is_favorite BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
    );
    `;
    await client.query(SQL);
    console.log('table created');
    
    SQL = /*sql*/`
    INSERT INTO flavors(name, is_favorite) VALUES('strawberry', FALSE);
    INSERT INTO flavors(name, is_favorite) VALUES('chocolate', TRUE);
    INSERT INTO flavors(name) VALUES('vanilla');
    INSERT INTO flavors(name) VALUES('coffee-caramel');
    `;
    await client.query(SQL);
    console.log('Data seeded');

    const port = process.env.PORT;
    app.listen(port, ()=>console.log(`Listening on port ${port}`));
}

init();