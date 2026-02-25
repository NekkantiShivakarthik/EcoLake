// Brand logos and product images for rewards
// Using Clearbit Logo API (reliable, CDN-backed) + official sources
export const RewardLogos: Record<string, string> = {
  // Gift Cards - High quality logos via Clearbit
  amazon: 'https://logo.clearbit.com/amazon.in',
  flipkart: 'https://logo.clearbit.com/flipkart.com',
  myntra: 'https://logo.clearbit.com/myntra.com',
  swiggy: 'https://logo.clearbit.com/swiggy.com',
  zomato: 'https://logo.clearbit.com/zomato.com',
  uber: 'https://logo.clearbit.com/uber.com',
  paytm: 'https://logo.clearbit.com/paytm.com',
  phonepe: 'https://logo.clearbit.com/phonepe.com',
  googlepay: 'https://logo.clearbit.com/pay.google.com',
  starbucks: 'https://logo.clearbit.com/starbucks.com',
  dominos: 'https://logo.clearbit.com/dominos.co.in',
  mcdonald: 'https://logo.clearbit.com/mcdonalds.com',
  subway: 'https://logo.clearbit.com/subway.com',
  kfc: 'https://logo.clearbit.com/kfc.co.in',
  pizzahut: 'https://logo.clearbit.com/pizzahut.co.in',
  bigbasket: 'https://logo.clearbit.com/bigbasket.com',
  
  // Subscriptions - Streaming & Entertainment
  netflix: 'https://logo.clearbit.com/netflix.com',
  spotify: 'https://logo.clearbit.com/spotify.com',
  prime: 'https://logo.clearbit.com/primevideo.com',
  hotstar: 'https://logo.clearbit.com/hotstar.com',
  youtube: 'https://logo.clearbit.com/youtube.com',
  zee5: 'https://logo.clearbit.com/zee5.com',
  sonyliv: 'https://logo.clearbit.com/sonyliv.com',
  jiocinema: 'https://logo.clearbit.com/jiocinema.com',
  
  // Eco Products
  'plant': '🌳',
  'tree': '🌳',
  'solar': '☀️',
  'water': '💧',
  'eco': '♻️',
  'seed': '🌱',
  'organic': '🌱',
  
  // Default
  default: '🎁',
};

// Helper function to get logo for a reward
export function getRewardLogo(rewardName: string, category: string): string {
  const name = rewardName.toLowerCase();
  
  // Check for specific brands
  for (const [key, logo] of Object.entries(RewardLogos)) {
    if (name.includes(key)) {
      return logo;
    }
  }
  
  // Category-based defaults
  switch (category) {
    case 'gift_card':
      return '🎁';
    case 'subscription':
      return '📺';
    case 'eco_action':
      return '🌱';
    case 'cash':
      return '💰';
    default:
      return RewardLogos.default;
  }
}

// Category gradient colors for cards
export const CategoryGradients: Record<string, string[]> = {
  gift_card: ['#FF6B6B', '#FF8E53'],
  subscription: ['#4ECDC4', '#44A08D'],
  eco_action: ['#56AB2F', '#A8E063'],
  cash: ['#FFD700', '#FFA500'],
  default: ['#667EEA', '#764BA2'],
};

// Brand-specific card colors (for gift card template)
export const BrandColors: Record<string, { primary: string; secondary: string; text: string }> = {
  amazon: { primary: '#FF9900', secondary: '#232F3E', text: '#FFFFFF' },
  flipkart: { primary: '#2874F0', secondary: '#FFFFFF', text: '#FFFFFF' },
  myntra: { primary: '#FF3F6C', secondary: '#FFE600', text: '#FFFFFF' },
  swiggy: { primary: '#FC8019', secondary: '#FFFFFF', text: '#FFFFFF' },
  zomato: { primary: '#E23744', secondary: '#FFFFFF', text: '#FFFFFF' },
  uber: { primary: '#000000', secondary: '#FFFFFF', text: '#FFFFFF' },
  paytm: { primary: '#00BAF2', secondary: '#002970', text: '#FFFFFF' },
  phonepe: { primary: '#5F259F', secondary: '#FFFFFF', text: '#FFFFFF' },
  googlepay: { primary: '#4285F4', secondary: '#FFFFFF', text: '#FFFFFF' },
  starbucks: { primary: '#00704A', secondary: '#FFFFFF', text: '#FFFFFF' },
  netflix: { primary: '#E50914', secondary: '#000000', text: '#FFFFFF' },
  spotify: { primary: '#1DB954', secondary: '#191414', text: '#FFFFFF' },
  default: { primary: '#667EEA', secondary: '#764BA2', text: '#FFFFFF' },
};
