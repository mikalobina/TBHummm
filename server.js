import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import session from "express-session";
import MongoStore from 'connect-mongo'; // নতুন ইম্পোর্ট
import bcrypt from "bcryptjs";
import path from "path";
import requestIp from "request-ip";
import useragent from "useragent";
import { fileURLToPath } from "url";
import { getLocationFromIP } from "./utils/geoLocation.js";
import { checkAuth } from "./utils/authMiddleware.js";
import User from "./models/User.js";
import Message from "./models/Message.js";

dotenv.config();
const app = express();

// Path setup for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connect
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log(err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

// Session Middleware - প্রোডাকশনের জন্য আপডেট করা হয়েছে
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGO_URL,
    ttl: 14 * 24 * 60 * 60 // 14 days
  })
}));

// Routes (বাকি রাউটগুলো অপরিবর্তিত)
app.get("/", (req, res) => res.render("home"));

app.get("/register", (req, res) => res.render("register"));
app.post("/register", async (req, res) => {
  const { name, username, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    await User.create({ name, username, password: hashed });
    res.redirect("/login");
  } catch (err) {
    res.send("❌ Username already taken. Please try another!");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.send("❌ User not found");
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.send("❌ Wrong password");
  req.session.user = user;
  res.redirect("/dashboard");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

app.get("/dashboard", checkAuth, async (req, res) => {
  const messages = await Message.find({ toUser: req.session.user.username }).sort({ createdAt: -1 });
  res.render("dashboard", { user: req.session.user, messages, req });
});

app.get("/u/:username", async (req, res) => {
  const user = await User.findOne({ username: req.params.username });
  if (!user) return res.send("❌ User not found");
  res.render("sendMessage", { username: req.params.username });
});

app.post("/u/:username", async (req, res) => {
    const { text } = req.body;
    const ip = requestIp.getClientIp(req) || "Unknown IP";
    const agent = useragent.parse(req.headers["user-agent"]);
    let deviceString;
    if (agent.device.family && agent.device.family !== 'Other') {
        deviceString = `${agent.device.family} (${agent.os.family})`;
    } else {
        deviceString = agent.os.family;
    }
    const device = `${agent.family} on ${deviceString}`;
    const location = await getLocationFromIP(ip);

    await Message.create({ toUser: req.params.username, text, ip, location, device });
    
    const htmlResponse = `
    <!DOCTYPE html>
    <html lang="bn">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Message Sent! - TBHummm...</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');
            body { font-family: 'Poppins', sans-serif; background-color: #f8f9fa; }
            .card { max-width: 500px; width: 100%; border: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
            .success-icon { font-size: 4rem; color: #198754; }
        </style>
    </head>
    <body class="d-flex flex-column vh-100">
        <main class="flex-grow-1 d-flex align-items-center justify-content-center">
            <div class="card text-center">
                <div class="card-body p-4 p-md-5">
                    <div class="success-icon mb-3"><i class="bi bi-check-circle-fill"></i></div>
                    <h1 class="card-title">Message Sent!</h1>
                    <p class="lead text-muted">Your anonymous message to <strong>${req.params.username}</strong> has been delivered.</p>
                    <hr class="my-4">
                    <h5 class="mb-3">Want to get your own anonymous messages?</h5>
                    <a href="/register" class="btn btn-primary btn-lg w-100">Create Your Link for FREE</a>
                    <p class="mt-3 mb-0"><a href="/login">Login</a> if you already have an account.</p>
                </div>
            </div>
        </main>
        <footer class="text-center py-4">
            <div class="container">
                <small class="text-muted">Developed with ❤️ by <a href="https://www.facebook.com/M.Shuddho" target="_blank" class="text-decoration-none">Umayer Rahaman</a></small>
            </div>
        </footer>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    </body>
    </html>
  `;
  res.send(htmlResponse);
});


// Port Listening - Render-এর জন্য আপডেট করা হয়েছে
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
