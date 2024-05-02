import puppeteer from "puppeteer";
import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv'

(async () =>{
      
     // Load environment variables from .env file
     dotenv.config()
     
    //Create a browser and new page.
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto("https://myanimelist.net/topanime.php");
    
    //waits for the tbody element to load
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
   //connect to the Render SQL database
   const db = new pg.Client({
   connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized:false
      }
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