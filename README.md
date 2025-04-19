# SnapMed – Identify Medicine Strips with One Click

SnapMed is a lightweight web application that helps users identify medicines by scanning or uploading a photo of a **medicine strip**. The app extracts the brand name using OCR and provides key information such as usage, dosage, and side effects in a simple, user-friendly format.

---

## Features

- Strip detection via image upload
- OCR-based medicine name extraction
- Drug information lookup from a trusted medical API
- Text-To-Speech (TTS) for accessibility
- Support for multiple languages (English, Hindi, Bengali)
- Clean, responsive UI

---

## Tech Stack

**Frontend**: HTML, CSS, JavaScript  
**OCR Engine**: Google Vision API  
**Backend**: Node.js with Express and appwrite  
**Data Source**: Dynamic medical API  
**TTS**: Web Speech API

---

## How It Works

1. User uploads or captures an image of a medicine strip.
2. OCR extracts the printed brand name from the strip.
3. The app matches the brand name with a drug information dataset.
4. A drug info card is displayed showing:
   - Brand name and generic name
   - Usage
   - Composition
5. Info is read aloud using TTS and shown as text.

---
## Access the prod in

![HERE]

---

## Project Structure

```
NILANJAN PUSH KORAR POR KORTE HOBE EITA TREE LIKE
```

---

## Use Cases

- Elderly or rural users who cannot read complex medical text
- Community health workers who need quick medicine info
- Cases of medicine misuse due to confusion or lack of literacy

---

## Judging Criteria Alignment

- Innovation: Practical AI usage in health context
- Technical Implementation: OCR + drug data + TTS
- Impact: Solves a real and local problem
- UI/UX: Simple, accessible, mobile-friendly interface
- Bonus: Uses OCR, designed for underrepresented users

---

## Team

Team SnapMed – Hack4Bengal 4.0  
Built to make medicine information accessible to everyone.

- Member 1 – Debjeet Banerjee
- Member 2 – Imon Chakraborty
- Member 3 – Nilanjan Mondal

---

## License

This project is licensed under the MIT License.
