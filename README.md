# Whatsapp Tools

This project is a Node.js app using [Baileys](https://github.com/WhiskeySockets/Baileys) to connect WhatsApp Web through a simple web interface.

## Features

- Web interface to:
  - Send fake replies (to individual or group chats)
  - Tag all members in a group
  - Delete session
  - List chats and groups
- Baileys integration for WhatsApp Web automation
- Session management

## Tech Stack

- Node.js
- Express.js
- Baileys (WhatsApp Web API)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/justpiple/whatsapp-tools.git
cd whatsapp-tools
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the project

```bash
node index.js
```

> On first run, scan the WhatsApp QR code from the terminal or web interface.

## ⚠️ Notes

- Do not share your session files. They contain authentication data.
- Only use this for ethical and educational purposes.

## License

This project is open-source and licensed under MIT.
