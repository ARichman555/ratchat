const fs = require('fs');
const express = require('express');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const bodyParser = require("body-parser");
const path = require('path')
const app = express();
const mongo = require("./mongo");
const pokemon = require("./pokemon");
const { request } = require('http');
const portNumber = process.argv[2] ?? 3000;
app.use(bodyParser.urlencoded({extended:false}));

/* directory where templates will reside */
app.set("views", path.resolve(__dirname, "templates"));
app.use("/styles", express.static(__dirname + "/styles"));
app.use("/images", express.static(__dirname + "/images"));
const oneDay = 1000 * 60 * 60 * 24;
app.use(sessions({
    secret: "pokemonareawsomefhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false 
}));

app.use(cookieParser());

/* view/templating engine */
app.set("view engine", "ejs");

app.listen(portNumber);
console.log(`Web server started and running at https://ratchat.onrender.com:${portNumber}`);
// process.stdout.write("Stop to shutdown the server: ");
// process.stdin.setEncoding("utf8"); /* encoding */
// process.stdin.on('readable', () => {  /* on equivalent to addEventListener */
// 	let dataInput = process.stdin.read();
// 	if (dataInput !== null) {
// 		let command = dataInput.trim();
// 		if (command === "stop") {
// 			console.log("Shutting down the server");
//             process.exit(0);  /* exiting */
//         } else {
//             /* After invalid command, we cannot type anything else */
// 			process.stdout.write(`Invalid command: ${command}\n`);
//         }
//     }
//     process.stdin.resume();
// });

app.get("/", (request, response) => {
    const variables = {
        "loginLink" : `https://ratchat.onrender.com:${portNumber}/login`,
        "registerLink" : `https://ratchat.onrender.com:${portNumber}/register`,
        "errorText" : ``,
        "buttonClass" : `input`
    };
    response.render("index", variables);
 });

 app.get("/register", (request, response) => {
    const variables = {
        "registerLink" : `https://ratchat.onrender.com:${portNumber}/register`,
        "loginLink" : `https://ratchat.onrender.com:${portNumber}/`,
        "spriteLink" : `https://ratchat.onrender.com:${portNumber}/spriteLink`,
        "userClass" : "input",
        "userEText" : "",
    };
    response.render("register", variables);
 });

 app.get("/spriteLink/:pokemon", async (request, response) => {
    const spritePromise = pokemon.getPokemonSprite(request.params.pokemon);
    const sprite = await spritePromise;

    response.send({ "sprite" : sprite });
 });

app.get("/userPage", async (request, response) => {
    if (!request.session.username) {
        response.redirect("/");
    } else {
        variables = {
            "username" : request.session.username,
            "pokemon" : request.session.pokemon,
            "sprite" : request.session.sprite,
            "logoutLink" : `https://ratchat.onrender.com:${portNumber}/logout`
        }

        response.render("userPage", variables);
    }
});

 app.post("/login", async (request, response) => {
    const res = await mongo.getUser(request.body["name"], request.body["password"])
    if (res) {
        const spritePromise = pokemon.getPokemonSprite(res["pokemon"]);
        const sprite = await spritePromise;

        request.session.username = request.body["name"];
        request.session.pokemon = res["pokemon"];
        request.session.sprite = sprite;

        response.redirect("userPage");
    } else {
        const variables = {
            "loginLink" : `https://ratchat.onrender.com:${portNumber}/login`,
            "registerLink" : `https://ratchat.onrender.com:${portNumber}/register`,
            "errorText" : `<p class="errorText">Something went wrong logging in!</p>`,
            "buttonClass" : `error`
        };

        response.render("index", variables);
    }
 });

 app.post("/register", async (request, response) => {
    const newUser = {
        "username" : request.body["name"],
        "password" : request.body["password"],
        "pokemon" : request.body["pokemon"],
    };
    const res = await mongo.addUser(newUser);

    if (res != undefined) {
        const spritePromise = pokemon.getPokemonSprite(request.body["pokemon"]);
        const sprite = await spritePromise;
        
        request.session.username = request.body["name"];
        request.session.pokemon = request.body["pokemon"];
        request.session.sprite = sprite;

        response.redirect("userPage");
    } else {
        const variables = {
            "registerLink" : `https://ratchat.onrender.com:${portNumber}/register`,
            "loginLink" : `https://ratchat.onrender.com:${portNumber}/`,
            "spriteLink" : `https://ratchat.onrender.com:${portNumber}/spriteLink`,
            "userClass" : "error",
            "userEText" : `<p id="userEText" class="eText">A user with that username already exists!</p>`,
        };
        response.render("register", variables);
    }
 });

 app.post("/logout", async (request, response) => {
    request.session.username = undefined;
    request.session.pokemon = undefined;
    request.session.sprite = undefined;

    response.redirect("/");
 });