export interface Quote {
  text: string;
  author?: string;
}

// Curated set: Sai Baba, women & individual empowerment, Chicken-Soup-for-the-Soul style.
export const QUOTES: Quote[] = [
  { text: "Why fear when I am here.", author: "Sai Baba" },
  { text: "Allah Malik. Look to me, I will look to you.", author: "Sai Baba" },
  { text: "Whoever offers Me devotion with love — fruit or flower, leaf or water — I accept it.", author: "Sai Baba" },
  { text: "Faith and patience: cling to these two, and even the impossible will become possible.", author: "Sai Baba" },
  { text: "Speak the truth, but speak it sweetly.", author: "Sai Baba" },
  { text: "The hardest journey is the one within. Take the first step today.", author: "Sai Baba" },

  { text: "She believed she could, so she did.", author: "R.S. Grey" },
  { text: "I am not what happened to me. I am what I choose to become.", author: "Carl Jung" },
  { text: "You may encounter many defeats, but you must not be defeated.", author: "Maya Angelou" },
  { text: "A woman is the full circle. Within her is the power to create, nurture and transform.", author: "Diane Mariechild" },
  { text: "There is no force more powerful than a woman determined to rise.", author: "W.E.B. Du Bois" },
  { text: "Do not wait for leaders; do it alone, person to person.", author: "Mother Teresa" },
  { text: "Courage doesn't always roar. Sometimes it's the quiet voice at the end of the day saying, 'I will try again tomorrow.'", author: "Mary Anne Radmacher" },
  { text: "The most beautiful thing about a comeback is the lesson learned in the setback.", author: "Anonymous" },
  { text: "Your career break is not a gap. It is a chapter where you grew in ways no job could teach you." },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "What lies behind you and what lies in front of you, pales in comparison to what lies inside you.", author: "Ralph Waldo Emerson" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "When one door of happiness closes, another opens; but often we look so long at the closed door that we do not see the one which has been opened for us.", author: "Helen Keller" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Hard times never last; hard people do.", author: "Robert H. Schuller" },
];

// Stable across a UI session: rotate by day so the user sees a different quote each visit
// but not a flicker on every render.
export function quoteOfTheDay(seedDate = new Date()): Quote {
  const day = Math.floor(seedDate.getTime() / (24 * 60 * 60 * 1000));
  return QUOTES[day % QUOTES.length];
}
