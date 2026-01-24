/**
 * Yellowlisted NFT Collections
 * 
 * These collections will be included in Radiants auctions indefinitely.
 * Collections that are permanently included in the auction system.
 */

export interface YellowlistCollection {
  id: string;
  name: string;
  image: string;
  tensorLink: string;
  magicEdenLink: string;
}

export const yellowlistCollections: YellowlistCollection[] = [
  {
    id: 'bape',
    name: 'BAPE',
    image: 'https://cdn.prod.website-files.com/65c06697c22c35197f523d9d/66e6448db716e1d5b3a8d6a9_bape.avif',
    tensorLink: 'https://tensor.trade/trade/bape',
    magicEdenLink: 'https://magiceden.io/marketplace/bored_ape_social_club',
  },
  {
    id: 'bears-reloaded',
    name: 'BEars Reloaded',
    image: 'https://cdn.prod.website-files.com/65c06697c22c35197f523d9d/66e644c50dcb8cb0f1f9a20b_https___bears-reloaded.web.app_6.avif',
    tensorLink: 'https://www.tensor.trade/trade/bears_reloaded',
    magicEdenLink: 'https://magiceden.io/marketplace/bears_reloaded',
  },
  {
    id: 'ded-monkes',
    name: 'Ded monkes',
    image: 'https://cdn.prod.website-files.com/65c06697c22c35197f523d9d/66e644f3f89862c7e1721a96_dedmonke.avif',
    tensorLink: 'https://www.tensor.trade/trade/ded_monkes',
    magicEdenLink: 'https://magiceden.io/marketplace/ded_monkes',
  },
  {
    id: 'ape-energy-labs',
    name: 'Ape Energy Labs',
    image: 'https://cdn.prod.website-files.com/65c06697c22c35197f523d9d/66e642ddb2aa17f270b41e7f_apeenergylabs.gif',
    tensorLink: 'https://www.tensor.trade/trade/apeenergylabs',
    magicEdenLink: 'https://magiceden.io/marketplace/apeenergylabs',
  },
  {
    id: 'netrunner',
    name: 'Netrunner',
    image: 'https://cdn.prod.website-files.com/65c06697c22c35197f523d9d/66e645118b339554988b909a_UxvV5lEp_400x400.avif',
    tensorLink: 'https://www.tensor.trade/trade/netrunner',
    magicEdenLink: 'https://magiceden.io/marketplace/netrunner',
  },
  {
    id: 'phase-passports',
    name: 'Phase Passports',
    image: 'https://cdn.prod.website-files.com/65c06697c22c35197f523d9d/66e6474059f59618c31585bf_https___shdw-drive.genesysgo.net_B3p2RxdJFYBdYmwk9wFTq2NHwxtWeivBA65MMjq3P6a1_tier3.avif',
    tensorLink: 'https://www.tensor.trade/trade/phase_passport',
    magicEdenLink: 'https://magiceden.io/marketplace/phase_passport',
  },
  {
    id: 'sketchy-scales',
    name: 'Sketchy Scales',
    image: 'https://cdn.prod.website-files.com/65c06697c22c35197f523d9d/66e77e56d442874ea87ea408_1110.avif',
    tensorLink: 'https://www.tensor.trade/trade/sketchyscales',
    magicEdenLink: 'https://magiceden.io/marketplace/sketchy_scales',
  },
];
