import puppeteer from "puppeteer";
import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv'

(async () =>{
      
     // Load environment variables from .env file
     dotenv.config()
     
    //Create a browser and new page.
    const browser = await puppeteer.launch({headless:false});
    const page = await browser.newPage();

    await page.goto("https://myanimelist.net/topanime.php");
    
    //waits for the tbody elemt to load
    await page.waitForSelector("tbody", { timeout: 60000 });
    
    //evaluates the webpage
    const anime = await page.evaluate( ()=> {
        const animeElements= document.querySelectorAll(".ranking-list");

        const animeData = Array.from(animeElements).map(eachAnime => {
            const title = eachAnime.querySelector("h3").textContent;
            const ranking = eachAnime.querySelector(".rank.ac span").textContent;
            const image = eachAnime.querySelector("img").getAttribute('data-src');
            return {ranking, title, image};
        });

        return animeData;
    })
   console.log(anime)
   await browser.close();

   //insert into database
   //connect db
   const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
   })
    
   await db.connect();


   try {
    // Insert each anime element into the database
    for (const singleAnime of anime) {
        await db.query("INSERT INTO topfifty(ranking, title, image ) VALUES($1, $2, $3);", [singleAnime.ranking, singleAnime.title, singleAnime.image]);
    }} 
    catch (err) {
     console.error("Error while inserting data", err)
    }finally{
     db.end();
   }

})()