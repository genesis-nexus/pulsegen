import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';

const router = Router();

// Get available languages
router.get('/languages', (req, res) => {
  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
    { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr' },
    { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', dir: 'ltr' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
  ];
  res.json(languages);
});

// Update user language preference
router.put('/user/language', authenticate, async (req: AuthRequest, res) => {
  const { language } = req.body;

  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const userId = req.user.id;

  await prisma.user.update({
    where: { id: userId },
    data: { preferredLanguage: language }
  });

  res.json({ success: true });
});

// Survey translation endpoints
router.post('/surveys/:surveyId/translations', authenticate, async (req, res) => {
  const { surveyId } = req.params;
  const { language, title, description, welcomeText, thankYouText } = req.body;

  try {
    const translation = await prisma.surveyTranslation.upsert({
      where: {
        surveyId_language: {
          surveyId,
          language
        }
      },
      update: {
        title,
        description,
        welcomeText,
        thankYouText
      },
      create: {
        surveyId,
        language,
        title,
        description,
        welcomeText,
        thankYouText
      }
    });
    res.json(translation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save translation' });
  }
});

router.get('/surveys/:surveyId/translations', async (req, res) => {
  const { surveyId } = req.params;
  const translations = await prisma.surveyTranslation.findMany({
    where: { surveyId }
  });
  res.json(translations);
});

export default router;
