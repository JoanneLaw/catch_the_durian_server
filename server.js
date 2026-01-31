'use strict';

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { status } = require("express/lib/response");
const { PlayerActionStatus } = require('./constants');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("❌ MongoDB connection failed:", err));

const GameSettingsMissionSchema = new mongoose.Schema({
    id: Number,
    type: Number,
    target: Number,
})

const GameSettingsSchema = new mongoose.Schema({
    missions: [GameSettingsMissionSchema],
    version: Number,
    missionGemReward: Number,
    name: String,
    missionCooldownMinutes: Number,
})

const MissionSchema = new mongoose.Schema({
    id: { type: Number },
    progress: { type: Number },
    isCompleted: { type: Boolean },
    isClaimed: { type: Boolean },
    nextMissionTime: { type: Date }
});

const PlayerSchema = new mongoose.Schema({
    playerId: String,
    highScore: Number,
    gem: Number,
    totalMissionCompleted: Number,
    missions: [MissionSchema]
}, { timestamps: true });

const Player = mongoose.model("playerdatas", PlayerSchema);
const GameSettings = mongoose.model("settings", GameSettingsSchema);

app.get("/health-check", async (req, res) => {
    try {
        await mongoose.connection.db.admin().ping();

        res.status(200).json({
            status: "ok",
            db: "connected",
            timestamps: Date.now()
        });
    } catch (e) {
        res.status(503).json({
            status: "starting",
            db: "not_ready"
        })
    }
});

// Claim mission reward
// { playerId, gameVersion, missionId, missionIndex }
app.post("/claimMission", async (req, res) => {
    try {
        const data = req.body;
        const player = await Player.findOne({ playerId: data.playerId });
        if (player && player.missions.length > data.missionIndex) {
            const gameSettings = await GameSettings.findOne({ name: "GameSettings", version: { $lte: data.gameVersion } });
            if (gameSettings === null) {
                console.log(`game settings not found, user game version: ${data.gameVersion}`);
                res.json({ status: PlayerActionStatus.SERVER_ERROR });
            } else {
                if (player.missions[data.missionIndex].id === data.missionId) {
                    const missionData = gameSettings.missions.find((mission) => mission.id === data.missionId);
                    if (missionData && player.missions[data.missionIndex].progress >= missionData.target) {
                        player.missions[data.missionIndex].isCompleted = true;
                        player.missions[data.missionIndex].isClaimed = true;
                        const currentTime = new Date();
                        player.missions[data.missionIndex].nextMissionTime = currentTime.addMinutes(gameSettings.missionCooldownMinutes);
                        player.gem += gameSettings.missionGemReward;
                        player.totalMissionCompleted += 1;
                        await player.save();
                        console.log(`mission reward claimed! ${player}`);
                    }
                }
            }
            res.json({ status: PlayerActionStatus.SUCCESS, data: player });
        }
    } catch (e) {
        res.json({ status: PlayerActionStatus.FAILED });
        console.log(`Claim mission failed: `, e);
    }
});

// Save or update player data
app.post("/savePlayerData", async (req, res) => {
    try {
        const data = req.body;
        const player = await Player.findOneAndUpdate(
            { playerId: data.playerId },
            data,
            { new: true }
        );
        console.log(`updated data: ${player}`);
        res.json({ status: PlayerActionStatus.SUCCESS, data: player});
    } catch (e) {
        res.json({ status: PlayerActionStatus.FAILED });
        console.log(`Save player data failed: `, e);
    }
});

// Load player data
app.post("/loadPlayerData", async (req, res) => {
    try {
        const data = req.body;
        if (data.playerId && data.playerId !== undefined) {
            const player = await Player.findOne({ playerId: data.playerId });
            res.json({ status: PlayerActionStatus.SUCCESS, data: player });
        } else {
            const newPlayer = new Player();
            newPlayer.playerId = newPlayer._id;
            newPlayer.highScore = 0;
            newPlayer.gem = 0;
            newPlayer.totalMissionCompleted = 0;
            const currentTime = new Date();
            newPlayer.missions = [
                { id: -1, progress: 0, isCompleted: false, isClaimed: false, nextMissionTime: currentTime },
                { id: -1, progress: 0, isCompleted: false, isClaimed: false, nextMissionTime: currentTime },
                { id: -1, progress: 0, isCompleted: false, isClaimed: false, nextMissionTime: currentTime },
            ]
            await newPlayer.save();
            const player = await Player.findOne({ playerId: newPlayer.playerId });
            res.json({ status: PlayerActionStatus.SUCCESS, data: player });      
        }
    } catch (e) {
        res.json({ status: PlayerActionStatus.FAILED });
        console.log(`Load player data failed: `, e);
    }
});

Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
}

Date.prototype.addMinutes = function(m) {
    this.setTime(this.getTime() + (m * 60 * 1000));
    return this;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
