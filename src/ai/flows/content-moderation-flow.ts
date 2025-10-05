
/**
 * @fileOverview AI-powered moderation and categorization flow for FlixTrend.
 * This single flow analyzes content for safety and assigns it a category.
 */

import { ai, SafetyPolicy } from '@/ai/ai';
import { z } from 'zod';

const postCategories = [
    // Arts & Design
    "3D Modeling", "Abstract Art", "Animation", "Anime & Manga", "Architecture", "Art History", "Art Installation", "ASCII Art", "Body Art", "Calligraphy", "Ceramics", "Character Design", "Collage", "Comics", "Concept Art", "Crafts", "Creative Coding", "Digital Art", "Digital Painting", "Drawing", "Embroidery", "Environmental Art", "Fashion Design", "Fine Art", "Generative Art", "Glassblowing", "Graffiti & Street Art", "Graphic Design", "Illustration", "Impressionism", "Industrial Design", "Interior Design", "Jewelry Design", "Kinetic Art", "Knitting & Crochet", "Landscape Design", "Land Art", "Lighting Design", "Logo Design", "Minimalist Art", "Mixed Media", "Modern Art", "Origami", "Painting", "Pixel Art", "Photography", "Photojournalism", "Portrait Photography", "Pottery", "Printmaking", "Product Design", "Sculpture", "Sketching", "Surrealism", "Tattoo Art", "Textile Art", "Typography", "UI/UX Design", "Urban Exploration", "Visual Effects (VFX)", "Watercolor", "Woodworking", "Zentangle",

    // Books & Literature
    "Audiobooks", "Biographies & Memoirs", "Book Reviews", "Book Clubs", "Children's Literature", "Classic Literature", "Comics & Graphic Novels", "Creative Writing", "Dystopian Fiction", "Ebooks", "Essays", "Fan Fiction", "Fantasy", "Fiction", "Historical Fiction", "Horror", "Literary Analysis", "Manga", "Modern Classics", "Mystery & Thriller", "Non-Fiction", "Poetry", "Prose", "Romance", "Science Fiction (Sci-Fi)", "Screenwriting", "Self-Publishing", "Short Stories", "Spoken Word", "Storytelling", "Worldbuilding", "Young Adult (YA)",

    // Business & Finance
    "Accounting", "Advertising", "Angel Investing", "Asset Management", "Branding", "Budgeting", "Business Ideas", "Business Law", "Business Strategy", "Career Development", "Commodities", "Corporate Finance", "Cryptocurrency", "Customer Service", "Data Analysis", "Day Trading", "Debt Management", "Digital Marketing", "E-commerce", "Economics", "Entrepreneurship", "Financial Independence (FIRE)", "Financial Planning", "Forex Trading", "Franchising", "Freelancing", "Fundraising", "Human Resources (HR)", "Inflation", "Insurance", "Investing", "Leadership", "Local Business", "Logistics", "Management", "Marketing", "Mergers & Acquisitions", "Negotiation", "Networking", "Options Trading", "Personal Finance", "Product Management", "Project Management", "Public Relations (PR)", "Real Estate", "Recruiting", "Retail", "Retirement Planning", "Risk Management", "Sales", "Side Hustles", "Small Business", "Startups", "Stock Market", "Supply Chain", "Taxes", "Venture Capital",

    // Education & Learning
    "Academic Research", "Adult Education", "AI in Education", "Alumni Networking", "Astrophysics", "Biochemistry", "Blogging", "Book Summaries", "Calculus", "Campus Life", "Chemistry", "College Admissions", "Computer Science", "Continuing Education", "Course Reviews", "DIY & How-To", "Documentaries", "EdTech", "E-learning", "Engineering", "Exam Preparation", "Free Online Courses", "Geology", "Grammar", "Higher Education", "History", "Homeschooling", "Language Learning", "Law", "Learn to Code", "Lectures", "Life Skills", "Linguistics", "Literature", "Machine Learning", "Marine Biology", "Mathematics", "Medical School", "Microbiology", "Neuroscience", "Online Courses", "Peer-to-Peer Learning", "Philosophy", "Physics", "Political Science", "Programming Tutorials", "Psychology", "Quantum Physics", "Robotics", "Scholarships", "Science Communication", "Self-Improvement", "Sociology", "Space Exploration", "Statistics", "STEM", "Student Life", "Study Tips", "Teaching", "Tutoring", "University Life", "Virtual Reality in Education", "Workshops",

    // Food & Drink
    "Artisanal Foods", "Baking", "BBQ & Grilling", "Beer", "Breakfast & Brunch", "Cake Decorating", "Canning & Preserving", "Cheese", "Chocolate", "Cocktails & Mixology", "Coffee", "Comfort Food", "Cooking Basics", "Cooking for Beginners", "Cuisine (e.g., Italian, Mexican)", "Dairy-Free", "Desserts", "Diet & Nutrition", "Dinner Recipes", "Drinks", "Eating on a Budget", "Exotic Fruits", "Farming", "Fast Food", "Fermentation", "Fine Dining", "Food Challenges", "Food Festivals", "Food History", "Food Photography", "Food Plating", "Food Reviews", "Food Science", "Gardening", "Gluten-Free", "Gourmet Cooking", "Healthy Eating", "Herbs & Spices", "Home Brewing", "Homemade", "International Cuisine", "Keto", "Lunch Ideas", "Meal Prep", "Mocktails", "Molecular Gastronomy", "Paleo", "Party Food", "Pastries", "Quick Meals", "Raw Food", "Recipes", "Restaurant Reviews", "Sourdough", "Street Food", "Sustainable Farming", "Tea", "Vegan", "Vegetarian", "Whiskey", "Wine",

    // Gaming
    "Action Games", "Adventure Games", "Arcade Games", "Augmented Reality (AR) Gaming", "Board Games", "Building Games", "Card Games", "Casual Games", "Cheats & Glitches", "Cloud Gaming", "Co-op Games", "Collectible Card Games (CCGs)", "Console Gaming (PlayStation, Xbox, Nintendo)", "Cozy Games", "Cross-Platform Play", "E-sports", "Fantasy Sports", "Fighting Games", "First-Person Shooters (FPS)", "Free-to-Play Games", "Game Design", "Game Development", "Game Streaming", "Gaming Hardware", "Gaming Leaks", "Gaming News", "Horror Games", "Indie Games", "Let's Plays", "Livestreaming", "Massively Multiplayer Online (MMO)", "Mobile Gaming", "Mods", "Multiplayer Online Battle Arena (MOBA)", "Music & Rhythm Games", "Open World Games", "PC Gaming", "Platformer Games", "Puzzle Games", "Racing Games", "Retro Gaming", "Role-Playing Games (RPG)", "Simulation Games", "Speedrunning", "Sports Games", "Stealth Games", "Strategy Games", "Survival Games", "Tabletop RPGs", "VR Gaming", "Walkthroughs & Guides",

    // Health & Wellness
    "Acupuncture", "Alternative Medicine", "Anti-Aging", "Aromatherapy", "Biohacking", "Body Positivity", "Cardio", "Clean Eating", "CrossFit", "Dental Health", "Detox", "Digital Detox", "Ergonomics", "Eye Care", "First Aid", "Fitness Challenges", "Fitness Classes", "Flexibility & Stretching", "Gym Workouts", "Health Supplements", "Healthy Habits", "Herbalism", "HIIT", "Home Workouts", "Hydration", "Hygiene", "Immune System", "Intermittent Fasting", "Longevity", "Marathon Training", "Massage", "Meditation", "Men's Health", "Mental Health", "Mindfulness", "Natural Remedies", "Nutrition", "Personal Training", "Pilates", "Post-Workout Recovery", "Powerlifting", "Public Health", "Running", "Self-Care", "Skin Care", "Sleep", "Spiritual Health", "Strength Training", "Stress Management", "Vitamins", "Weightlifting", "Wellness Retreats", "Women's Health", "Yoga",

    // Hobbies & Interests
    "3D Printing", "Action Figures", "Antiques", "Astrology", "Astronomy", "Backpacking", "Bird Watching", "Board Games", "Bonsai", "Bowling", "Calligraphy", "Camping", "Candle Making", "Canoeing & Kayaking", "Car Restoration", "Cardistry", "Chess", "Cigar Smoking", "Coin Collecting", "Collecting", "Coloring", "Cosplay", "Creative Writing", "Cross-stitch", "Cycling", "Dancing", "Darts", "Diving", "DJing", "Drones", "Embroidery", "Engraving", "Figurines", "Filmmaking", "Fishing", "Flower Arranging", "Fossil Hunting", "Genealogy", "Geocaching", "Go-karting", "Hiking", "Home Improvement", "Horseback Riding", "Hunting", "Ice Skating", "Journaling", "Juggling", "Karaoke", "Kite Flying", "Knitting", "Lego", "Lock Picking", "Magic Tricks", "Mahjong", "Metal Detecting", "Miniature Painting", "Model Building", "Mountaineering", "Mushroom Hunting", "Numismatics", "Paintball", "Parkour", "Pen Spinning", "Philately (Stamp Collecting)", "Pottery", "Puzzles", "Quilting", "Radio Control", "Reading", "Rock Climbing", "Scrapbooking", "Scuba Diving", "Sewing", "Singing", "Skateboarding", "Skiing & Snowboarding", "Soap Making", "Speedcubing", "Stand-up Comedy", "Surfing", "Tabletop Games", "Tarot Reading", "Upcycling", "Urban Gardening", "Video Editing", "Volunteering", "Watch Collecting", "Whittling", "Wine Tasting", "Yo-yoing",

    // Lifestyle
    "Activism", "Alternative Living", "Blogging", "Bullet Journaling", "Charity & Fundraising", "City Life", "College Life", "Community", "Conscious Consumerism", "Country Life", "Cultural Exchange", "Dating & Relationships", "Digital Nomad", "Downsizing", "Early Retirement", "Eco-friendly Living", "Expat Life", "Family", "Frugal Living", "Hairstyles", "Home Decor", "Journalism", "LGBTQ+", "Life Hacks", "Marriage", "Makeup & Beauty", "Minimalism", "Morning Routines", "Motivation", "Nightlife", "Nomad Life", "Organization", "Parenting", "Personal Branding", "Personal Growth", "Personal Style", "Podcasting", "Productivity", "Public Speaking", "Remote Work", "Rural Living", "Social Commentary", "Social Justice", "Student Life", "Suburban Life", "Sustainable Living", "Time Management", "Tiny Homes", "Travel", "Van Life", "Vlogging", "Volunteering", "Wedding Planning", "Work-Life Balance", "Zero Waste",

    // Music
    "Acoustic", "Afrobeats", "Alternative Rock", "Ambient", "Bass", "Beatmaking", "Blues", "Bollywood Music", "Choir", "Classical", "Club Music", "Country", "Cover Songs", "Dance Music", "Drum & Bass", "Drums", "Dubstep", "EDM", "Electronic", "Emo", "Film Scores", "Folk", "Funk", "Garage Rock", "Gospel", "Grime", "Grunge", "Guitar", "Hard Rock", "Heavy Metal", "Hip-Hop", "House", "Indie", "Industrial", "Instrumental", "Jazz", "K-Pop", "Live Music", "Lo-fi", "Lyrics", "Marching Band", "Mashups", "Music Festivals", "Music Gear", "Music History", "Music Industry", "Music Production", "Music Theory", "Music Videos", "Musicals", "New Wave", "Opera", "Orchestra", "Piano", "Pop", "Post-Punk", "Prog Rock", "Psychedelic Rock", "Punk", "R&B", "Rap", "Reggae", "Remixes", "Rock", "Rock and Roll", "Sampling", "Singing", "Ska", "Songwriting", "Soul", "Sound Design", "Soundtracks", "Synth-pop", "Techno", "Trance", "Trap", "Turntablism", "Ukulele", "Violin", "Vocal Training", "World Music",

    // News & Politics
    "Activism", "Analytics", "Business News", "Censorship", "Conspiracy Theories", "Current Events", "Debate", "Digital Rights", "Election Coverage", "Environmental Policy", "Fact-Checking", "Foreign Policy", "Geopolitics", "Global News", "Grassroots Movements", "Human Rights", "Independent Media", "Investigative Journalism", "Journalism", "Law & Legal Issues", "Local News", "Media Criticism", "National Security", "Opinion", "Political Cartoons", "Political Commentary", "Political History", "Political Scandals", "Politics", "Propaganda", "Public Policy", "Social Issues", "Tech News", "US Politics", "World News",

    // Places & Travel
    "Adventure Travel", "Air Travel", "Amusement Parks", "Backpacking", "Beaches", "Budget Travel", "Business Travel", "Camping", "Castles", "City Guides", "Cruises", "Cultural Travel", "Deserts", "Digital Nomad", "Ecotourism", "Extreme Sports", "Family Travel", "Gap Year", "Hidden Gems", "Historical Sites", "Hostels", "Hotels & Resorts", "Islands", "Lakes", "Landmarks", "Mountains", "National Parks", "Nature", "Road Trips", "Ruins", "Sailing", "Solo Travel", "Space Tourism", "Staycation", "Sustainable Travel", "Theme Parks", "Trains", "Travel Blogging", "Travel Deals", "Travel Gear", "Travel Hacking", "Travel Insurance", "Travel Photography", "Travel Vlogging", "Trekking", "Tropical Destinations", "Urban Exploration", "Vacation", "Waterfalls", "Winter Sports", "World Heritage Sites",

    // Science & Technology
    "Aerospace", "AI & Machine Learning", "Algorithms", "Anthropology", "Archaeology", "Artificial Intelligence", "Augmented Reality", "Automation", "Automotive Tech", "Aviation", "Big Data", "Bio-informatics", "Biotechnology", "Blockchain", "Botany", "CAD", "Chemistry", "Clean Energy", "Cloud Computing", "Coding", "Computer Graphics", "Computer Hardware", "Computer Vision", "Consumer Tech", "Cybersecurity", "Data Mining", "Data Science", "Data Visualization", "Deep Learning", "DevOps", "Drones", "Electric Vehicles", "Energy", "Entomology", "Evolution", "Exploration", "Gadgets", "Game Development", "Genetics", "GIS", "Green Tech", "Hacking (Ethical)", "Home Automation", "Human-Computer Interaction", "Internet of Things (IoT)", "Journalism Tech", "Linux", "Maker Movement", "Material Science", "Mobile Development", "Nanotechnology", "Natural Language Processing (NLP)", "Network Security", "Neuroscience", "Open Source", "Operating Systems", "Paleontology", "Privacy", "Programming", "Quantum Computing", "Renewable Energy", "Robotics", "Rocket Science", "SaaS", "Smart Home", "Software Engineering", "Space", "Supercomputers", "Virtual Reality", "Wearable Tech", "Web Development", "Web3", "Zoology",

    // Sports
    "Archery", "Athletics", "Badminton", "Baseball", "Basketball", "Beach Volleyball", "Bodybuilding", "Bowling", "Boxing", "Cheerleading", "Climbing", "Cricket", "Cross-country", "Curling", "Cycling", "Diving", "Dodgeball", "Equestrian", "F1 Racing", "Fencing", "Field Hockey", "Figure Skating", "Fishing", "Fitness", "Football (American)", "Football (Soccer)", "Formula 1", "Golf", "Gymnastics", "Handball", "Hiking", "Hockey", "Horse Racing", "Ice Hockey", "Inline Skating", "Kayaking", "Lacrosse", "Marathon", "Martial Arts (MMA, Karate, etc.)", "Motorsports", "Mountain Biking", "NASCAR", "Olympics", "Paragliding", "Parkour", "Pickleball", "Polo", "Powerlifting", "Rallying", "Rock Climbing", "Rowing", "Rugby", "Running", "Sailing", "Skateboarding", "Skiing", "Snooker", "Snowboarding", "Softball", "Squash", "Sumo Wrestling", "Surfing", "Swimming", "Table Tennis", "Tennis", "Track and Field", "Triathlon", "UFC", "Ultimate Frisbee", "Volleyball", "Water Polo", "Weightlifting", "Windsurfing", "Wrestling", "WWE",

    // Other
    "DIY", "Fails", "Funny", "Memes", "Parody", "Pop Culture", "Satire", "Uncategorized", "Other"
] as const;

const ContentModerationInputSchema = z.object({
  text: z.string().optional().describe('All text content combined (caption, title, etc.).'),
  media: z.array(z.object({ url: z.string() })).optional().describe("An array of media items (images, videos) as data URIs. This is currently ignored."),
});

const ContentModerationOutputSchema = z.object({
    analysis: z.string().describe("Your step-by-step reasoning for the safety decision. First, state if any rule is violated and why. If not, state that the content is compliant."),
    decision: z.enum(['approve', 'deny']).describe("Based ONLY on your analysis, decide whether to approve or deny. If your analysis found no clear violation, you MUST approve."),
    reason: z.string().describe("A brief, user-friendly explanation for the decision. If approved, say 'Content approved!'. If denied, explain the violation simply."),
    category: z.enum(postCategories).describe("The single best category for the post from the provided list. Base this on the main topic of the text content. Avoid using 'Other' or 'Uncategorized' unless no other category is remotely suitable."),
});

const moderationPrompt = `You are an expert content classifier and a fair and balanced content moderator for a Gen-Z social media app called FlixTrend.
Your goal is to keep the platform safe while allowing for creative expression. You will ONLY analyze the text content provided.

**Your Task (Chain-of-Thought Process):**

**Step 1: Moderation Analysis**
Carefully review the text content against the rules below. In your 'analysis' field, write down your reasoning.
- If a rule is clearly and severely violated, state which rule and why.
- If no rules are violated, explicitly state "Content is compliant."

**Step 2: Moderation Decision**
Based ONLY on your analysis from Step 1, make your 'decision'.
- If your analysis identified a clear and severe violation, you MUST decide 'deny'.
- If your analysis concluded "Content is compliant", you MUST decide 'approve'.

**Step 3: Categorization**
Analyze the text content and assign it to the single most relevant category from the list below. In the 'category' field, provide only the category name. Be specific. Avoid the 'Other' or 'Uncategorized' categories unless the content has no discernible topic whatsoever.
Categories: ${postCategories.join(', ')}

**Rules (Deny content ONLY for clear and severe violations of the TEXT):**
1. Harmful or Abusive: True hate speech, credible violent threats, harassment, bullying, promotion of self-harm.
2. Spam/Illegal: Promoting illegal acts, scams, or posting pure gibberish.

Be lenient. Do NOT flag edgy humor, slang, or mild profanity. If it's ambiguous, approve it.

**Content to Review:**
TEXT: "{{text}}"
`;

const noSafetyBlocks: SafetyPolicy[] = [
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
];

export const contentModerationFlow = ai.defineFlow(
  {
    name: 'contentModerationFlow',
    inputSchema: ContentModerationInputSchema,
    outputSchema: ContentModerationOutputSchema,
  },
  async (input) => {
    // Media is now ignored. We only process text.
    const finalText = input.text || '';
    
    // If there is no text content to moderate, approve and categorize as 'Other'.
    if (!finalText.trim()) {
        return {
            analysis: "No text content provided. Approved by default.",
            decision: 'approve',
            reason: 'Content approved!',
            category: 'Other',
        }
    }

    const finalPrompt = moderationPrompt
      .replace('"{{text}}"', JSON.stringify(finalText));

    const response = await ai.generate({
      model: 'googleai/gemini-2.0-flash-lite-001',
      prompt: finalPrompt,
      output: { schema: ContentModerationOutputSchema },
      safetySettings: noSafetyBlocks,
      config: {
        temperature: 0.1,
      },
    });

    const output = response.output;
    if (!output) {
      console.error("Moderation flow failed to produce valid output.", response.usage);
      return {
        analysis: "AI model failed to produce a valid response.",
        decision: 'deny',
        reason: 'Could not verify content safety at this time. Please try again.',
        category: 'Other', // Default category on failure
      };
    }

    return output;
  }
);
