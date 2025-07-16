
# NGLc Clone

This is an NGL Clone web app built with Node.js and Express.

## Features
- Anonymous messaging
- MongoDB for storage
- Session management

## Setup

1. Install dependencies:

```
npm install
```

2. Create a `.env` file in the root directory and configure:

```
PORT=3000
MONGO_URL=your_mongo_connection_string
SESSION_SECRET=your_session_secret
```

3. Run locally:

```
npm start
```

## Deploy to Render

1. Push this repo to GitHub.
2. Go to [Render](https://render.com).
3. Create a new **Web Service**.
4. Use the following settings:

- **Environment**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**: Same as `.env`

## License
MIT
