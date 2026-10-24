import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getFirestore } from '@/utils/firebaseAdmin';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ANNUAL_TOKEN_LIMIT = 2_000_000;
const MAX_TOKENS_PER_RUN = 1_000;
const MAX_OUTPUT_TOKENS = 120;
const MODEL = process.env.DROP_GEMINI_MODEL || 'gemini-flash-lite-latest';
const FALLBACK_PROMPTS = [
  'Share a small moment from today that made you smile.',
  'Show us something ordinary that feels special to you.',
  'Share a song, scene, or memory you keep coming back to.',
  'What is one thing you are looking forward to? Show us.',
  'Capture a color, pattern, or detail you noticed today.',
];

type SourceLink = { title: string; url: string };

async function deleteCollectionInBatches(
  collectionRef: FirebaseFirestore.CollectionReference
): Promise<void> {
  while (true) {
    const snapshot = await collectionRef.limit(500).get();
    if (snapshot.empty) return;

    const batch = collectionRef.firestore.batch();
    snapshot.docs.forEach((document) => batch.delete(document.ref));
    await batch.commit();
    if (snapshot.size < 500) return;
  }
}

function istDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization') || '';
  if (!secret) return false;

  const expected = 'Bearer ' + secret;
  const providedBuffer = Buffer.from(authorization);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer);
}

function getSourceLinks(interaction: Record<string, unknown>): SourceLink[] {
  const links = new Map<string, SourceLink>();
  const steps = Array.isArray(interaction.steps) ? interaction.steps : [];

  for (const step of steps) {
    if (!step || typeof step !== 'object' || (step as { type?: string }).type !== 'model_output') continue;
    const content = (step as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;

    for (const block of content) {
      if (!block || typeof block !== 'object') continue;
      const annotations = (block as { annotations?: unknown }).annotations;
      if (!Array.isArray(annotations)) continue;

      for (const annotation of annotations) {
        if (!annotation || typeof annotation !== 'object') continue;
        const citation = annotation as { type?: string; title?: string; url?: string };
        if (citation.type !== 'url_citation' || !citation.url) continue;
        try {
          const url = new URL(citation.url);
          if (url.protocol !== 'https:') continue;
          links.set(url.href, { title: citation.title || url.hostname, url: url.href });
        } catch {
          continue;
        }
      }
    }
  }

  return Array.from(links.values()).slice(0, 5);
}

async function generatePrompt(date: Date): Promise<{ text: string; sourceLinks: SourceLink[]; tokens: number } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || process.env.DROP_AI_18_PLUS_CONFIRMED !== 'true') return null;

  const dateLabel = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
  }).format(date);
  const input = [
    `Find a verified, timely event or positive viral culture trend relevant on ${dateLabel}.`,
    'Prefer major sports, festivals, public holidays, music, film, or broadly popular internet culture.',
    'Use current web sources. Ignore rumors, tragedy, politics, dangerous stunts, or trends that require copying copyrighted material.',
    'Create one inclusive, safe, easy-to-post photo/video challenge for a social app. Do not claim an event is happening unless sources verify it.',
    'Return only the challenge prompt, 12-30 words. No explanation or markdown.',
  ].join(' ');

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      model: MODEL,
      input,
      tools: [{ type: 'google_search' }],
      max_output_tokens: MAX_OUTPUT_TOKENS,
      store: false,
    }),
    signal: AbortSignal.timeout(25_000),
  });

  if (!response.ok) {
    throw new Error(`Gemini API returned HTTP ${response.status}.`);
  }

  const interaction = await response.json() as Record<string, unknown>;
  const outputText = typeof interaction.output_text === 'string' ? interaction.output_text.trim() : '';
  const text = outputText.replace(/^["'\s]+|["'\s]+$/g, '').trim();
  const usage = interaction.usage as { total_tokens?: number } | undefined;
  const tokens = usage?.total_tokens;
  if (typeof tokens !== 'number' || !Number.isSafeInteger(tokens) || tokens < 0) {
    throw new Error('Gemini returned an incomplete response or token usage was unavailable.');
  }

  return { text, sourceLinks: getSourceLinks(interaction), tokens };
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

async function acquireDailyRun(db: FirebaseFirestore.Firestore, runRef: FirebaseFirestore.DocumentReference) {
  return db.runTransaction(async (transaction) => {
    const runSnapshot = await transaction.get(runRef);
    if (runSnapshot.data()?.status === 'complete') return 'complete';

    const startedAt = runSnapshot.data()?.startedAt as FirebaseFirestore.Timestamp | undefined;
    if (runSnapshot.data()?.status === 'running' &&
        startedAt &&
        Date.now() - startedAt.toMillis() < 10 * 60 * 1000) {
      return 'running';
    }

    transaction.set(runRef, {
      status: 'running',
      startedAt: FieldValue.serverTimestamp(),
    });
    return 'acquired';
  });
}

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Cron authentication is not configured.' }, { status: 500 });
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const now = new Date();
  const dateKey = istDateKey(now);

  try {
    const db = getFirestore();
    const runRef = db.collection('dropPromptRuns').doc(dateKey);
    const runState = await acquireDailyRun(db, runRef);
    if (runState === 'complete') {
      return NextResponse.json({ status: 'already-complete', date: dateKey });
    }
    if (runState === 'running') {
      return NextResponse.json({ status: 'already-running', date: dateKey }, { status: 202 });
    }

    const nowTimestamp = Timestamp.fromDate(now);
    const tomorrowTimestamp = Timestamp.fromDate(new Date(now.getTime() + 24 * 60 * 60 * 1000));
    const yesterdayTimestamp = Timestamp.fromDate(new Date(now.getTime() - 24 * 60 * 60 * 1000));
    const [scheduledPromptSnapshot, recentPrompts] = await Promise.all([
      db.collection('dropPrompts')
        .where('scheduledFor', '>', nowTimestamp)
        .where('scheduledFor', '<=', tomorrowTimestamp)
        .orderBy('scheduledFor', 'asc')
        .limit(1)
        .get(),
      db.collection('dropPrompts')
        .where('expiresAt', '>', yesterdayTimestamp)
        .orderBy('expiresAt', 'desc')
        .limit(20)
        .get(),
    ]);
    const availablePrompts = recentPrompts.docs.filter((prompt) => {
      const scheduledFor = prompt.get('scheduledFor') as FirebaseFirestore.Timestamp | undefined;
      return !scheduledFor || scheduledFor.toMillis() <= now.getTime();
    });
    const activePrompt = availablePrompts.find((prompt) => prompt.get('isScheduled') === true)
      ?? availablePrompts[0];

    let pollDoc: FirebaseFirestore.QueryDocumentSnapshot | undefined;
    if (activePrompt) {
      const polls = await db.collection('drop_polls')
        .where('promptId', '==', activePrompt.id)
        .limit(1)
        .get();
      pollDoc = polls.docs[0];
    }

    let nextText: string | undefined;
    let source = 'community-fallback';
    let sourceLinks: SourceLink[] = [];
    let tokensUsed = 0;

    if (pollDoc) {
      const poll = pollDoc.data();
      const options = Array.isArray(poll.options) ? poll.options : [];
      if (!options.length) throw new Error('The Drop poll has no valid options.');

      const votes = await pollDoc.ref.collection('votes').get();
      const counts = new Map<number, number>();
      votes.forEach((vote) => {
        const optionIndex = vote.get('optionIdx');
        if (Number.isInteger(optionIndex) && optionIndex >= 0 && optionIndex < options.length) {
          counts.set(optionIndex, (counts.get(optionIndex) || 0) + 1);
        }
      });
      let winnerIndex = 0;
      for (const [index, count] of counts) {
        if (count > (counts.get(winnerIndex) || 0)) winnerIndex = index;
      }

      const winnerText = options[winnerIndex]?.text;
      if (typeof winnerText !== 'string' || !winnerText.trim()) {
        throw new Error('The winning Drop poll option is invalid.');
      }
      nextText = winnerText.trim();
      source = 'community-poll';
    } else if (!scheduledPromptSnapshot.empty) {
      const dayOfYear = Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - Date.UTC(now.getUTCFullYear(), 0, 0)) / 86_400_000);
      nextText = FALLBACK_PROMPTS[dayOfYear % FALLBACK_PROMPTS.length];
      source = 'scheduled-bridge';
    } else {
      const year = Number(dateKey.slice(0, 4));
      const usageRef = db.collection('dropAiUsage').doc(String(year));
      const usageSnapshot = await usageRef.get();
      const currentAnnualUsage = usageSnapshot.data()?.tokens ?? 0;

      if (typeof currentAnnualUsage === 'number' &&
          currentAnnualUsage >= 0 &&
          currentAnnualUsage + MAX_TOKENS_PER_RUN <= ANNUAL_TOKEN_LIMIT) {
        let generated: Awaited<ReturnType<typeof generatePrompt>> = null;
        try {
          generated = await generatePrompt(now);
        } catch (error) {
          console.error('Gemini Drop prompt generation failed; using a curated fallback:', error);
        }

        if (generated) {
          tokensUsed = generated.tokens;
          await usageRef.set({
            tokens: FieldValue.increment(generated.tokens),
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });

          if (generated.tokens <= MAX_TOKENS_PER_RUN &&
              generated.text.length >= 20 &&
              generated.text.length <= 180 &&
              currentAnnualUsage + generated.tokens <= ANNUAL_TOKEN_LIMIT) {
            const recentTexts = new Set(recentPrompts.docs.map((prompt) => normalizeText(prompt.get('text') || '')));
            if (!recentTexts.has(normalizeText(generated.text))) {
              nextText = generated.text;
              source = 'gemini-search';
              sourceLinks = generated.sourceLinks;
            }
          }
        }
      }

      if (!nextText) {
        const dayOfYear = Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - Date.UTC(now.getUTCFullYear(), 0, 0)) / 86_400_000);
        nextText = FALLBACK_PROMPTS[dayOfYear % FALLBACK_PROMPTS.length];
      }
    }

    const nextScheduledFor = scheduledPromptSnapshot.docs[0]?.get('scheduledFor') as FirebaseFirestore.Timestamp | undefined;
    const expiresAt = nextScheduledFor ?? Timestamp.fromDate(new Date(now.getTime() + 24 * 60 * 60 * 1000));
    const newPromptRef = db.collection('dropPrompts').doc();
    const resultBatch = db.batch();
    resultBatch.set(newPromptRef, {
      text: nextText,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt,
      source,
      ...(sourceLinks.length ? { sourceLinks } : {}),
      ...(tokensUsed ? { aiTokens: tokensUsed, aiModel: MODEL } : {}),
    });
    resultBatch.set(runRef, {
      status: 'complete',
      result: source,
      prompt: nextText,
      promptId: newPromptRef.id,
      tokens: tokensUsed,
      completedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await resultBatch.commit();

    if (activePrompt) {
      try {
        if (pollDoc) {
          await deleteCollectionInBatches(pollDoc.ref.collection('votes'));
        }
        const cleanupBatch = db.batch();
        cleanupBatch.delete(activePrompt.ref);
        if (pollDoc) cleanupBatch.delete(pollDoc.ref);
        await cleanupBatch.commit();
      } catch (error) {
        console.error('Drop prompt published, but old prompt cleanup failed:', error);
      }
    }

    return NextResponse.json({ status: source, date: dateKey, tokens: tokensUsed });
  } catch (error) {
    console.error('Drop prompt cron failed:', error);
    const db = getFirestore();
    const runRef = db.collection('dropPromptRuns').doc(dateKey);
    const runSnapshot = await runRef.get().catch((readError) => {
      console.error('Could not inspect failed Drop prompt run:', readError);
      return null;
    });
    if (runSnapshot?.data()?.status !== 'complete') {
      await runRef.set({
        status: 'failed',
        failedAt: FieldValue.serverTimestamp(),
      }, { merge: true }).catch((writeError) => {
        console.error('Could not mark Drop prompt cron as failed:', writeError);
      });
    }
    return NextResponse.json({ error: 'Could not create the next Drop prompt.' }, { status: 500 });
  }
}
