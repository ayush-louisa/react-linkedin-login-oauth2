// Example Express.js server implementation for the polling approach
// This would be in your backend application

import express from 'express';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

// In-memory store for demo (use Redis or database in production)
const sessions = new Map<
  string,
  {
    status: 'pending' | 'completed' | 'error';
    code?: string;
    error?: string;
    errorMessage?: string;
    timestamp: number;
  }
>();

// Clean up old sessions (run this periodically)
const cleanupSessions = () => {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000; // 10 minutes

  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.timestamp > maxAge) {
      sessions.delete(sessionId);
    }
  }
};

setInterval(cleanupSessions, 60000); // Clean up every minute

// LinkedIn OAuth callback endpoint
app.get('/auth/linkedin/callback', (req, res) => {
  const { code, state, error, error_description } = req.query;

  // Extract session ID from state (format: originalState.sessionId)
  const stateParts = (state as string)?.split('.');
  if (!stateParts || stateParts.length !== 2) {
    return res.status(400).send('Invalid state parameter');
  }

  const [, sessionId] = stateParts;

  if (!sessions.has(sessionId)) {
    // Create session if it doesn't exist (race condition protection)
    sessions.set(sessionId, {
      status: 'pending',
      timestamp: Date.now(),
    });
  }

  if (error) {
    sessions.set(sessionId, {
      status: 'error',
      error: error as string,
      errorMessage: (error_description as string) || 'Authentication failed',
      timestamp: Date.now(),
    });
  } else if (code) {
    sessions.set(sessionId, {
      status: 'completed',
      code: code as string,
      timestamp: Date.now(),
    });
  } else {
    sessions.set(sessionId, {
      status: 'error',
      error: 'no_code',
      errorMessage: 'No authorization code received',
      timestamp: Date.now(),
    });
  }

  // Return a simple success page
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>LinkedIn Authentication</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; max-width: 400px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #0077b5; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>LinkedIn Authentication</h1>
        <p>${error ? 'Authentication failed' : 'Authentication successful!'}</p>
        <p>You can close this window now.</p>
        <script>
          setTimeout(() => window.close(), 2000);
        </script>
      </div>
    </body>
    </html>
  `);
});

// Polling endpoint for checking authentication status
app.get('/auth/linkedin/status', (req, res) => {
  const { session } = req.query;

  if (!session || typeof session !== 'string') {
    return res.status(400).json({ error: 'Session ID required' });
  }

  const sessionData = sessions.get(session);

  if (!sessionData) {
    // Create a pending session if it doesn't exist
    sessions.set(session, {
      status: 'pending',
      timestamp: Date.now(),
    });

    return res.json({ status: 'pending' });
  }

  // Return the current status
  const response: any = { status: sessionData.status };

  if (sessionData.status === 'completed') {
    response.code = sessionData.code;
    // Clean up the session after successful retrieval
    sessions.delete(session);
  } else if (sessionData.status === 'error') {
    response.error = sessionData.error;
    response.errorMessage = sessionData.errorMessage;
    // Clean up the session after error retrieval
    sessions.delete(session);
  }

  res.json(response);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    activeSessions: sessions.size,
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`LinkedIn OAuth server running on port ${PORT}`);
  console.log(`Callback URL: http://localhost:${PORT}/auth/linkedin/callback`);
  console.log(`Status endpoint: http://localhost:${PORT}/auth/linkedin/status`);
});

export default app;
