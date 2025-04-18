import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { GoogleGenAI } from '@google/genai';
import * as fs from 'node:fs';
import path from 'path';

dotenv.config();

const app = express();
const port = 3000;

// Load environment variables
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const API_URL = process.env.API_URL;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Gemini client
const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

// Multer setup for file upload
const upload = multer({ dest: 'uploads/' });

// Get medicine name + uses from image
async function getMedicineNameFromImage(imagePath) {
  const base64ImageFile = fs.readFileSync(imagePath, { encoding: 'base64' });

  const contents = [
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64ImageFile,
      },
    },
    { text: 'provide just the name of the medicine in the first line without using extra words and some of its uses in the next line.' },
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: contents,
    });

    const medResp = response.text.trim();
    const lines = medResp.split('\n').filter(line => line.trim() !== '');
    return lines;
  } catch (error) {
    console.error('Error getting medicine name from image:', error);
    return null;
  }
}

async function getMedicineNameFromBase64(base64Image) {
  const contents = [
    {
      inlineData: {
        mimeType: 'image/jpeg', // or detect from input if needed
        data: base64Image,
      },
    },
    { text: 'provide just the name of the medicine in the first line without using extra words and some of its uses in the next line.' },
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: contents,
    });

    const medResp = response.text.trim();
    const lines = medResp.split('\n').filter(line => line.trim() !== '');
    return lines;
  } catch (error) {
    console.error('Error getting medicine name from base64 image:', error);
    return null;
  }
}

// Fetch drug info from API
async function getDrugInfo(drugName) {
  const url = `${API_URL}?drug=${encodeURIComponent(drugName)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.message === 'Not found' ? null : data;
    } else {
      console.error('Error:', response.status, response.statusText);
      return null;
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}

app.use(express.json({ limit: '10mb' })); // To support large base64 images

app.post('/analyze-base64', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No base64 image provided.' });
    }

    const lines = await getMedicineNameFromBase64(image);

    if (!lines || lines.length === 0) {
      return res.status(400).json({ error: 'Unable to extract medicine data.' });
    }

    const medicineName = lines[0];
    const info = await getDrugInfo(medicineName);

    const simplifiedInfo = info
      ? {
          generic_name: info[0]?.generic_name || 'N/A',
          dosage_form: info[0]?.dosage_form || 'N/A',
          product_type: info[0]?.product_type || 'N/A',
          route: info[0]?.route || ['N/A'],
        }
      : null;

    res.json({
      lines,
      drugInfo: simplifiedInfo || 'No detailed drug info found.',
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});
// Start server
app.listen(port, () => {
  console.log(`SnapMed API running on http://localhost:${port}`);
});


