// Centralized backend configuration for system prompts and content policy
// You can tune keywords and messages here without touching route logic

const SYSTEM_PROMPT = `You are an image generation and editing assistant.
Before processing any request, first determine if the user's prompt contains NSFW (not safe for work) content, including but not limited to explicit sexual content, nudity, pornography, sexualization of minors, sexual violence, or graphic sexual fetish content.
If the request is NSFW, do NOT process it. Respond that the request is NSFW and cannot be fulfilled.
If the request is safe, proceed normally.`;

// Very lightweight keyword screening as a first line of defense.
// This is not exhaustive; it is intended to block obvious cases before any model call.
// Keep all entries lowercase.
const NSFW_KEYWORDS = [
  // sexual content
  'porn', 'pornographic', 'pornography', 'xxx', 'nsfw', 'nude', 'nudity', 'naked', 'erotic', 'sex', 'sexual', 'oral sex',
  'handjob', 'blowjob', 'anal', 'cum', 'ejaculate', 'semen', 'orgasm', 'aroused', 'arousal', 'fetish', 'bdsm', 'bondage',
  // sexual violence or exploitation
  'rape', 'raped', 'molest', 'molestation', 'assault', 'sexual assault', 'incest', 'bestiality', 'zoophilia',
  // minors
  'loli', 'lolicon', 'shota', 'minor', 'underage', 'child sexual', 'teen sex', 'cp',
  //females
  'woman', 'girl', 'female', 'girls', 'women', 'females', 'girls', 'women',
  //others
  'king', 'kingdom', 'kings', 'queens', 'queen', 'prince', 'princes', 'princess', 'princesses'
];

const NSFW_MESSAGE = 'This request is NSFW and cannot be processed.';

module.exports = {
  SYSTEM_PROMPT,
  NSFW_KEYWORDS,
  NSFW_MESSAGE,
};
