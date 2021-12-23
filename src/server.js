import http from "http";
import WebSocket from "ws";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const PORT = 8000;
const handleListening = () => console.log(`✅ Server listening on port http://localhost:${PORT}`);

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

server.listen(PORT, handleListening);
