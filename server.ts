import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { cloudDb } from './src/server/cloudDb.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Support up to 35mb for audio recordings & rich backup payloads
  app.use(express.json({ limit: '35mb' }));
  app.use(express.urlencoded({ extended: true, limit: '35mb' }));

  const apiKey = process.env.GEMINI_API_KEY || '';
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // Health check & Cloud status
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(apiKey),
      timestamp: new Date().toISOString(),
      cloudDb: cloudDb.getSystemStats(),
    });
  });

  // --- Cloud Accounts & Multidevice Sync API ---

  // Check username uniqueness globally
  app.post('/api/auth/check-username', (req: Request, res: Response) => {
    try {
      const { username, excludeUserId } = req.body;
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ available: false, message: 'Nombre de usuario requerido.' });
      }
      const clean = username.trim().toLowerCase();
      if (clean.length < 3) {
        return res.status(200).json({ available: false, message: 'Mínimo 3 caracteres.' });
      }
      if (!/^[a-zA-Z0-9_\-\.]+$/.test(clean)) {
        return res.status(200).json({ available: false, message: 'Solo letras, números, puntos y guiones.' });
      }

      const available = cloudDb.isUsernameAvailable(clean, excludeUserId);
      return res.json({
        available,
        message: available ? 'Nombre de usuario disponible' : 'Este nombre ya está registrado en la nube por otro escritor',
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Cloud Account Registration with guaranteed uniqueness
  app.post('/api/auth/register', (req: Request, res: Response) => {
    try {
      const { username, password, displayName } = req.body;
      const { user } = cloudDb.registerUser(username, password, displayName);
      const { bundle } = cloudDb.getUserBundle(user.id);
      return res.json({
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          email: user.email,
          avatarColor: user.avatarColor,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        },
        bundle,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // Cloud Account Login (usable from ANY device)
  app.post('/api/auth/login', (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const { user } = cloudDb.loginUser(username, password);
      const { books, bundle } = cloudDb.getUserBundle(user.id);
      const backups = cloudDb.getUserBackups(user.id);

      return res.json({
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          email: user.email,
          avatarColor: user.avatarColor,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        },
        books,
        bundle,
        backupCount: backups.length,
      });
    } catch (err: any) {
      return res.status(401).json({ error: err.message });
    }
  });

  // Update profile in cloud
  app.post('/api/auth/update-profile', (req: Request, res: Response) => {
    try {
      const { userId, updates } = req.body;
      if (!userId) return res.status(400).json({ error: 'userId requerido.' });
      const updated = cloudDb.updateUserProfile(userId, updates || {});
      return res.json({
        user: {
          id: updated.id,
          username: updated.username,
          displayName: updated.displayName,
          email: updated.email,
          avatarColor: updated.avatarColor,
          avatarUrl: updated.avatarUrl,
          bio: updated.bio,
          createdAt: updated.createdAt,
          lastLoginAt: updated.lastLoginAt,
        },
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // Change password in cloud
  app.post('/api/auth/change-password', (req: Request, res: Response) => {
    try {
      const { userId, currentPassword, newPassword } = req.body;
      cloudDb.changePassword(userId, currentPassword, newPassword);
      return res.json({ success: true, message: 'Contraseña actualizada en la nube.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // Pull author books and entities from cloud (device synchronization)
  app.get('/api/sync/pull', (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: 'userId es requerido para la sincronización.' });
      }

      const { user, books, bundle } = cloudDb.getUserBundle(userId);
      return res.json({
        success: true,
        user,
        books,
        bundle,
        lastSyncedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Push author books and entities to cloud (persistent backup and sync)
  app.post('/api/sync/push', (req: Request, res: Response) => {
    try {
      const { userId, ...payload } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'userId es requerido para guardar en la nube.' });
      }

      const result = cloudDb.syncUserBundle(userId, payload);
      return res.json(result);
    } catch (err: any) {
      console.error('Error in /api/sync/push:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // List author cloud backup snapshots
  app.get('/api/sync/backups', (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ error: 'userId requerido.' });
      const backups = cloudDb.getUserBackups(userId);
      return res.json({ backups });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Restore author cloud backup snapshot
  app.post('/api/sync/restore-backup', (req: Request, res: Response) => {
    try {
      const { userId, backupId } = req.body;
      if (!userId || !backupId) {
        return res.status(400).json({ error: 'userId y backupId requeridos.' });
      }
      const data = cloudDb.getBackupData(userId, backupId);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // 1. Asistente Lingüístico: Ortografía, gramática, puntuación y estilo
  app.post('/api/gemini/analyze-grammar', async (req: Request, res: Response) => {
    try {
      if (!ai) {
        return res.status(503).json({
          error: 'Servicio de IA no disponible: falta configurar GEMINI_API_KEY en el servidor.',
        });
      }

      const { text, chapterTitle, scope } = req.body;
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'El texto es requerido para el análisis.' });
      }

      let scopeInstruction = `Analiza minuciosamente el siguiente texto y detecta:
- Errores ortográficos (tildes, grafías, erratas).
- Errores gramaticales y sintácticos.
- Problemas de concordancia (género, número, persona).
- Errores de puntuación (comas criminales, puntos y comas mal empleados, signos de interrogación/exclamación, rayas de diálogo).
- Uso incorrecto de mayúsculas y minúsculas.
- Repeticiones innecesarias de palabras en párrafos cercanos.
- Frases excesivamente largas, oscuras o confusas.
- Cambios involuntarios de tiempo verbal.
- Expresiones redundantes no justificadas.`;

      if (scope === 'solo_ortografia') {
        scopeInstruction = `ALCANCE ESTRICTO: Revisa y reporta EXCLUSIVAMENTE errores ortográficos (tildes, grafías, erratas mecánicas y letras incorrectas).
REGLA INQUEBRANTABLE: NO toques la puntuación, NO cambies la sintaxis ni el orden de palabras, y NO alteres el estilo del autor.`;
      } else if (scope === 'solo_puntuacion') {
        scopeInstruction = `ALCANCE ESTRICTO: Revisa y reporta EXCLUSIVAMENTE errores de puntuación (comas criminales, puntos y comas, puntos seguidos faltantes, signos de interrogación o exclamación de apertura ausentes, y uso adecuado de rayas de diálogo).
REGLA INQUEBRANTABLE: NO cambies ninguna palabra del texto ni alteres la gramática.`;
      } else if (scope === 'solo_gramatica') {
        scopeInstruction = `ALCANCE ESTRICTO: Revisa y reporta EXCLUSIVAMENTE problemas gramaticales y de concordancia (género, número, persona y saltos involuntarios de tiempo verbal).
REGLA INQUEBRANTABLE: NO reescribas el estilo ni cambies giros poéticos deliberados.`;
      } else if (scope === 'solo_claridad') {
        scopeInstruction = `ALCANCE ESTRICTO: Identifica únicamente frases excesivamente largas, ambiguas o enrevesadas que dificulten la comprensión lectora, sugiriendo una versión más clara pero conservando la voz del escritor.`;
      }

      const prompt = `Actúa como un corrector de estilo y editor literario profesional en lengua española.
Capítulo: "${chapterTitle || 'Sin título'}".
${scopeInstruction}

Devuelve una lista con las sugerencias encontradas. Si el texto está impecable para el alcance pedido, devuelve una lista vacía.
Texto a analizar:
"""
${text.slice(0, 20000)}
"""`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: {
                      type: Type.STRING,
                      description: 'ortografia, gramatica, concordancia, puntuacion, mayusculas, claridad, tiempo_verbal, redundancia, repeticion',
                    },
                    severity: {
                      type: Type.STRING,
                      description: 'error, advertencia, sugerencia',
                    },
                    originalSnippet: {
                      type: Type.STRING,
                      description: 'Fragmento exacto con el problema',
                    },
                    suggestedCorrection: {
                      type: Type.STRING,
                      description: 'Texto propuesto como reemplazo',
                    },
                    explanation: {
                      type: Type.STRING,
                      description: 'Explicación clara y didáctica para el escritor',
                    },
                  },
                  required: ['id', 'type', 'severity', 'originalSnippet', 'suggestedCorrection', 'explanation'],
                },
              },
              overallScore: {
                type: Type.NUMBER,
                description: 'Puntuación general del 1 al 100 de salud lingüística',
              },
              summary: {
                type: Type.STRING,
                description: 'Breve balance editorial del fragmento evaluado',
              },
            },
            required: ['suggestions', 'overallScore', 'summary'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (err: any) {
      console.error('Error en /api/gemini/analyze-grammar:', err);
      return res.status(500).json({
        error: 'Fallo al procesar el análisis lingüístico con el asistente de IA.',
        details: err?.message,
      });
    }
  });

  // 2. Detector de Muletillas y Repeticiones de Estilo
  app.post('/api/gemini/detect-crutches', async (req: Request, res: Response) => {
    try {
      if (!ai) {
        return res.status(503).json({
          error: 'Servicio de IA no disponible: falta GEMINI_API_KEY.',
        });
      }

      const { text, customExpressions } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Texto requerido.' });
      }

      const prompt = `Eres un analista literario experto en cadencia, prosa y estilo en español.
Tu tarea es examinar el manuscrito en busca de:
1. Muletillas frecuentes del autor (ej. "en realidad", "por así decirlo", "de algún modo", "prácticamente", "la verdad es que").
2. Expresiones comodín y conectores repetidos en exceso (ej. "sin embargo", "entonces", "luego", "de repente").
3. Repeticiones cercanas de una misma palabra o raíz en el mismo párrafo o frases adyacentes.
4. Expresiones personalizadas a revisar indicadas por el usuario: ${JSON.stringify(customExpressions || [])}.

IMPORTANTE: Distingue repeticiones funcionales o diálogos naturales del personaje de las muletillas inconscientes del narrador.
Para cada hallazgo, indica la expresión, cuántas veces aparece aproximadamente, fragmentos donde se encuentra, su distribución aproximada (inicio, nudo, desenlace), y un catálogo de alternativas elegantes.

Texto:
"""
${text.slice(0, 20000)}
"""`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              findings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    expression: { type: Type.STRING },
                    count: { type: Type.INTEGER },
                    category: {
                      type: Type.STRING,
                      description: 'muletilla, conector_excesivo, comodin, repeticion_cercana, personalizada',
                    },
                    snippets: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    distribution: {
                      type: Type.STRING,
                      description: 'Distribución a lo largo del texto (ej. "Concentrado en el primer tercio" o "Uniforme")',
                    },
                    alternatives: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    stylisticAdvice: { type: Type.STRING },
                  },
                  required: ['id', 'expression', 'count', 'category', 'snippets', 'distribution', 'alternatives', 'stylisticAdvice'],
                },
              },
              diagnosis: {
                type: Type.STRING,
                description: 'Dictamen de ritmo y variedad léxica',
              },
            },
            required: ['findings', 'diagnosis'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (err: any) {
      console.error('Error en /api/gemini/detect-crutches:', err);
      return res.status(500).json({
        error: 'Fallo al detectar muletillas con la IA.',
        details: err?.message,
      });
    }
  });

  // 3. Análisis de Estilo y Continuidad Narrativa
  app.post('/api/gemini/analyze-continuity', async (req: Request, res: Response) => {
    try {
      if (!ai) {
        return res.status(503).json({
          error: 'Servicio de IA no disponible: falta GEMINI_API_KEY.',
        });
      }

      const { text, chapterTitle, characters, details, timelineEvents } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Texto del capítulo requerido.' });
      }

      const contextSummary = {
        personajesRegistrados: (characters || []).map((c: any) => ({
          nombre: c.name,
          alias: c.aliases,
          edad: c.age,
          apariencia: c.appearance,
          personalidad: c.personality,
          relaciones: c.relationships,
          secretos: c.secrets,
        })),
        detallesYReglasDelMundo: (details || []).map((d: any) => ({
          nombre: d.name,
          categoria: d.category,
          descripcion: d.description,
          canonInmutable: d.immutableInfo,
          provisional: d.provisionalInfo,
        })),
        acontecimientosTimeline: (timelineEvents || []).map((e: any) => ({
          nombre: e.title,
          fecha: e.dateDisplay,
          personajes: e.characterIds,
          estado: e.status,
          descripcion: e.description,
        })),
      };

      const prompt = `Actúa como un editor jefe y verificador de continuidad narrativa (Script Doctor / Continuity Editor).
Revisa el texto del capítulo "${chapterTitle || 'Capítulo actual'}" contrastándolo estrictamente contra la biblia del universo registrada:
${JSON.stringify(contextSummary, null, 2)}

Busca:
1. Variaciones incongruentes en la edad o fechas de nacimiento de los personajes.
2. Cambios contradictorios en la apariencia física o rasgos fijos de personalidad.
3. Errores en árboles genealógicos o relaciones familiares.
4. Nombres propios inconsistentes o mal escritos respecto a la ficha oficial.
5. Incompatibilidades con la línea de tiempo (un personaje en dos lugares al mismo tiempo, eventos que ocurrieron antes presentados como futuros).
6. Violaciones o contradicciones directas con las reglas del mundo / leyes mágicas / canon establecido en los detalles.

NORMAS CRÍTICAS:
- Distingue contradicciones claras de posibles misterios deliberados o puntos de vista parciales del narrador.
- Clasifica como "posible_inconsistencia" o "advertencia_temporal".
- Proporciona el fragmento exacto, la entidad de la biblia afectada y la explicación.
- NO inventes datos que no figuren en la biblia ni en el texto.

Texto del capítulo a evaluar:
"""
${text.slice(0, 20000)}
"""`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              issues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: {
                      type: Type.STRING,
                      description: 'edad_personaje, apariencia_personalidad, parentesco_relacion, nombre_inconsistente, conflicto_timeline, regla_del_universo',
                    },
                    severity: {
                      type: Type.STRING,
                      description: 'posible_inconsistencia, advertencia_temporal, aviso_de_canon',
                    },
                    fragment: { type: Type.STRING, description: 'Fragmento en el texto del capítulo' },
                    relatedEntity: { type: Type.STRING, description: 'Nombre del personaje, detalle o evento en conflicto' },
                    explanation: { type: Type.STRING, description: 'Explicación del choque o contradicción' },
                    suggestion: { type: Type.STRING, description: 'Propuesta de armonización narrativa' },
                  },
                  required: ['id', 'type', 'severity', 'fragment', 'relatedEntity', 'explanation', 'suggestion'],
                },
              },
              overallConsistencyVerdict: {
                type: Type.STRING,
                description: 'Veredicto general de coherencia con el lore',
              },
            },
            required: ['issues', 'overallConsistencyVerdict'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (err: any) {
      console.error('Error en /api/gemini/analyze-continuity:', err);
      return res.status(500).json({
        error: 'Fallo al verificar la continuidad narrativa con la IA.',
        details: err?.message,
      });
    }
  });

  // 4. Transcripción de grabaciones de audio asociadas a capítulos
  app.post('/api/gemini/transcribe', async (req: Request, res: Response) => {
    try {
      if (!ai) {
        return res.status(503).json({
          error: 'Servicio de IA no disponible: falta GEMINI_API_KEY en el servidor.',
        });
      }

      const { base64Audio, mimeType, instructions } = req.body;
      if (!base64Audio) {
        return res.status(400).json({ error: 'Se requiere el audio en formato base64.' });
      }

      const cleanMime = mimeType || 'audio/mp3';
      const audioPart = {
        inlineData: {
          mimeType: cleanMime,
          data: base64Audio,
        },
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            audioPart,
            {
              text: instructions || 'Transcribe con precisión todo lo dicho en este audio en español. Mantén los signos de puntuación, párrafos y marcas de entonación natural. No omitas nombres propios ni ideas.',
            },
          ],
        },
      });

      const transcription = response.text || '';
      return res.json({
        transcription,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Error en /api/gemini/transcribe:', err);
      return res.status(500).json({
        error: 'Fallo al transcribir el archivo de audio con el modelo Gemini.',
        details: err?.message,
      });
    }
  });

  // Serve Vite in dev, or dist in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Pluma & Tiempo] Servidor iniciado en http://0.0.0.0:${PORT}`);
  });
}

startServer();
