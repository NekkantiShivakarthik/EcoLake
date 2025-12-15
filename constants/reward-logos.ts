// Brand logos and product images for rewards
export const RewardLogos: Record<string, string> = {
  // Gift Cards - High quality logos
  amazon: 'https://cdn.freebiesupply.com/logos/large/2x/amazon-icon-logo-png-transparent.png',
  flipkart: 'https://logos-download.com/wp-content/uploads/2020/06/Flipkart_Logo.png',
  myntra: 'https://constant.myntassets.com/pwa/assets/img/icon.png',
  swiggy: 'https://1000logos.net/wp-content/uploads/2021/05/Swiggy-emblem.png',
  zomato: 'https://1000logos.net/wp-content/uploads/2021/06/Zomato-logo.png',
  uber: 'https://logos-world.net/wp-content/uploads/2020/05/Uber-Logo.png',
  paytm: 'https://companieslogo.com/img/orig/PAYTM.NS-1430ec3e.png',
  phonepe: 'https://www.phonepe.com/webstatic/6.8.0/static/media/phonepe-logo-white.5f0d50f9.svg',
  googlepay: 'https://www.gstatic.com/images/branding/product/2x/pay_96dp.png',
  starbucks: 'https://1000logos.net/wp-content/uploads/2020/05/Starbucks-Logo.png',
  dominos: 'https://logos-world.net/wp-content/uploads/2020/11/Dominos-Logo.png',
  mcdonald: 'https://1000logos.net/wp-content/uploads/2017/03/McDonalds-Logo.png',
  subway: 'https://logos-world.net/wp-content/uploads/2020/12/Subway-Logo.png',
  kfc: 'https://logos-world.net/wp-content/uploads/2020/04/KFC-Logo.png',
  pizzahut: 'https://logos-world.net/wp-content/uploads/2020/11/Pizza-Hut-Logo.png',
  
  // Subscriptions - Streaming & Entertainment
  netflix: 'https://images.ctfassets.net/4cd45et68cgf/7LrExJ6PAj6MSIPkDyCO86/542b1dfabbf3959908f69be546879952/Netflix-Brand-Logo.png',
  spotify: 'https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png',
  prime: 'https://m.media-amazon.com/images/G/01/digital/video/web/Logo-min.png',
  hotstar: 'https://secure-media.hotstarext.com/web-assets/prod/images/brand-logos/disney-hotstar-logo-dark.svg',
  youtube: 'https://www.youtube.com/img/desktop/yt_1200.png',
  zee5: 'https://akamaividz.zee5.com/resources/0-9-zeeplex/web/images/ZEE5_logo_new.png',
  sonyliv: 'https://www.sonyliv.com/images/sonyliv_logo.png',
  
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
