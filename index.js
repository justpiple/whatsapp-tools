import express from "express";
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} from "@whiskeysockets/baileys";
import NodeCache from "node-cache";
import { randomUUID } from "crypto";
import fs from "fs";
import pino from "pino";
import Jimp from "jimp";

const app = express();
const PORT = 3000;
const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false });
const authFolder = "./auth";

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(express.static("public"));

let sock;

async function startSock() {
  const logger = pino({ level: "error" });
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: logger,
    cachedGroupMetadata: async (jid) => groupCache.get(jid),
  });

  sock.ev.on("groups.update", async ([event]) => {
    const metadata = await sock.groupMetadata(event.id);
    groupCache.set(event.id, metadata);
  });

  sock.ev.on("group-participants.update", async (event) => {
    const metadata = await sock.groupMetadata(event.id);
    groupCache.set(event.id, metadata);
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log(
        "Connection closed due to",
        lastDisconnect?.error,
        ", reconnecting:",
        shouldReconnect,
      );

      if (shouldReconnect) {
        startSock();
      } else {
        console.log("You are logged out.");
      }
    }

    if (connection === "open") {
      console.log("Connected to WhatsApp");
    }
  });
}

async function tagAll(groupJid, message) {
  try {
    const groupMetadata = await sock.groupMetadata(groupJid);
    const participants = groupMetadata.participants;
    const mentions = participants.map((p) => p.id);

    await sock.sendMessage(groupJid, {
      text: message || "Hi @everyone",
      mentions: mentions,
    });

    return true;
  } catch (err) {
    console.error("Gagal tag all:", err);
    throw err;
  }
}

app.post("/tagall", async (req, res) => {
  const { groupid, message } = req.body;

  if (!groupid) {
    return res.status(400).json({ error: "Group ID tidak boleh kosong" });
  }

  try {
    await tagAll(groupid, message);
    res.json({ status: "sent" });
  } catch (err) {
    res.status(500).json({ error: "Gagal kirim tag all", detail: err.message });
  }
});

app.delete("/session", (req, res) => {
  if (fs.existsSync(authFolder)) {
    fs.rmSync(authFolder, { recursive: true, force: true });
    res.json({ status: "session deleted" });
    console.log("Session deleted. Silakan restart server untuk scan ulang QR.");
  } else {
    res.status(404).json({ error: "Session folder not found" });
  }
});

app.get("/chats", async (req, res) => {
  try {
    let getGroups = await sock.groupFetchAllParticipating();
    let groups = Object.entries(getGroups)
      .slice(0)
      .map((entry) => entry[1]);
    res.json({ groups });
  } catch (err) {
    console.error("Gagal memuat daftar grup:", err);
    res.status(500).json({ error: "Gagal memuat daftar grup." });
  }
});

app.post("/send-fake-reply", async (req, res) => {
  const { targetJid, quotedText, yourMessage, participant } = req.body;
  const stanzaId = randomUUID().replace(/-/g, "").toUpperCase();

  try {
    await sock.sendMessage(targetJid, {
      text: yourMessage,
      contextInfo: {
        quotedMessage: { conversation: quotedText },
        participant: participant,
        stanzaId,
        remoteJid: targetJid,
      },
    });
    res.json({ status: "sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function generateProfilePicture(buffer) {
  const jimp = await Jimp.read(buffer);
  const resz =
    jimp.getWidth() > jimp.getHeight()
      ? jimp.resize(550, Jimp.AUTO)
      : jimp.resize(Jimp.AUTO, 650);

  return {
    img: await resz.getBufferAsync(Jimp.MIME_JPEG),
    preview: await resz.getBufferAsync(Jimp.MIME_JPEG),
  };
}

async function updateProfilePicture(jid, buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new TypeError("Expected a buffer");
  }

  if (jid === "@s.whatsapp.net") {
    jid = undefined;
  }

  const generate = await generateProfilePicture(buffer);

  try {
    const response = await sock.query({
      tag: "iq",
      attrs: {
        target: jid,
        to: "@s.whatsapp.net",
        type: "set",
        xmlns: "w:profile:picture",
      },
      content: [
        {
          tag: "picture",
          attrs: { type: "image" },
          content: generate.img,
        },
      ],
    });

    if (jid === sock.user.id) {
      sock.user.imgUrl = response.eurl;
    } else {
      sock.ev.emit("chat-update", { jid, imgUrl: response.eurl });
    }

    return response;
  } catch (error) {
    console.error("Error updating profile picture:", error);
    throw error;
  }
}

app.post("/update-profile-picture", async (req, res) => {
  try {
    const { jid, imageBuffer } = req.body;

    if (!imageBuffer) {
      return res.status(400).json({ error: "Image buffer is required" });
    }

    const buffer = Buffer.from(imageBuffer, "base64");
    const response = await updateProfilePicture(
      jid || "@s.whatsapp.net",
      buffer,
    );

    res.json({ status: "success", data: response });
  } catch (err) {
    console.error("Failed to update profile picture:", err);
    res.status(500).json({ error: err.message });
  }
});

async function init() {
  await startSock();
  app.listen(PORT, () =>
    console.log(`Server ready at http://localhost:${PORT}`),
  );
}

init();

export { app, startSock };
