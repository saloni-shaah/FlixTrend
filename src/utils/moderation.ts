import abusiveWords from '@/lib/abusiveWords.json';
import { profanity } from '@2toad/profanity';
import { Filter } from 'bad-words';

const customBadWords = new Filter();

// Create separate Sets for Devanagari and Romanized words for efficient and accurate lookups.
const devanagariWords = new Set(abusiveWords.hindi.filter(word => /[\u0900-\u097F]/.test(word)));
const romanizedWords = new Set([
    ...abusiveWords.english,
    ...abusiveWords.hindi.filter(word => !/[\u0900-\u097F]/.test(word)),
    ...abusiveWords.slang
]);

// A specific normalization function for Roman characters (English/Hinglish).
const normalizeRomanText = (text: string): string => {
    if (!text) return '';
    return text
        .toLowerCase()
        .replace(/[@4]/g, 'a')
        .replace(/[3]/g, 'e')
        .replace(/[!1l|]/g, 'i')
        .replace(/[0]/g, 'o')
        .replace(/[$5]/g, 's')
        .replace(/[^a-z\s]/g, '') // Only keeps roman letters and spaces
        .trim().replace(/\s+/g, ' ');
};

export const isAbusive = (text: string): boolean => {
    if (!text) return false;

    // First, run the external libraries which are good at catching many common cases.
    try {
        if (profanity.exists(text) || customBadWords.isProfane(text)) {
            return true;
        }
    } catch (e) {
        console.error("Error checking profanity with external libraries:", e);
    }

    // **THE FIX IS HERE**
    // Next, check for Devanagari words using a much more robust regex for splitting.
    // This regex now splits by whitespace and a wide range of punctuation, including quotes.
    const textWords = text.split(/[\s,.;:!?()[\]{}"'<>]+/g).filter(Boolean);
    for (const word of textWords) {
        if (devanagariWords.has(word)) {
            return true;
        }
    }

    // Finally, check a normalized version of the text for Romanized words (Hinglish/English).
    // This part already handles punctuation correctly due to its normalization.
    const normalizedRomanWords = normalizeRomanText(text).split(' ');
    for (const word of normalizedRomanWords) {
        if (romanizedWords.has(word)) {
            return true;
        }
    }

    return false;
};
