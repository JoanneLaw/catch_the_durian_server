# Catch The Durian – Server

Backend server for **Catch The Durian** mobile game.  
Handles player data, missions, and game progression.



## 🚀 Tech Stack
- Node.js
- Express.js
- MongoDB (Mongoose)
- CORS
- dotenv for environment variables



## ⚙️ Setup

1. Clone the repository
```bash
git clone https://github.com/JoanneLaw/catch-the-durian-server.git
cd catch-the-durian-server
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```env
MONGO_URI=your_mongo_uri_here
PORT=10000
```

4. Start the server
```bash
npm run start
```

Server will run at `http://localhost:10000`.



## 📡 Main Endpoints

| Method | Endpoint         | Description                       |
|--------|----------------|-----------------------------------|
| GET    | /health-check   | Check server & database status    |
| POST   | /loadPlayerData | Load existing or create new player|
| POST   | /savePlayerData | Save or update player data        |
| POST   | /claimMission   | Claim mission rewards             |

> All endpoints use JSON payloads. No sensitive data is included.



## 📄 License
MIT License



## 👤 Author
Joanne Law – Unity Game Programmer

