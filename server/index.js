import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createOutlookDraft, isGraphConfigured } from './graphService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'IDT Dashboard Microsoft Graph Integration API',
    graphConfigured: isGraphConfigured()
  });
});

app.post('/api/create-outlook-draft', async (req, res) => {
  try {
    const { image, fileName, subject, bodyContent, userEmail } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Missing required "image" base64 payload.'
      });
    }

    const authHeader = req.headers.authorization;
    const userToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    const result = await createOutlookDraft({
      image,
      fileName: fileName || 'IDT_Weekly_Report.png',
      subject: subject || 'IDT Weekly Freight Report',
      bodyContent,
      userEmail,
      userToken
    });

    res.json(result);
  } catch (error) {
    console.error('Error creating Outlook draft:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create Outlook draft'
    });
  }
});

app.listen(PORT, () => {
  console.log(`IDT Backend Server running on http://localhost:${PORT}`);
  console.log(`Microsoft Graph: ${isGraphConfigured() ? 'CONFIGURED' : 'DEMO/DELEGATED MODE'}`);
});
