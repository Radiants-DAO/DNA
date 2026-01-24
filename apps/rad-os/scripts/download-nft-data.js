const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');

// Read the nfts.json file
const nftsData = JSON.parse(fs.readFileSync('lib/mockData/nfts.json', 'utf8'));
const mintAddresses = Object.keys(nftsData);
const gatewayUrls = Object.values(nftsData);

// Create directories
const metadataDir = 'lib/mockData/nft-metadata';
const imagesDir = 'public/assets/radiants';

if (!fs.existsSync(metadataDir)) {
  fs.mkdirSync(metadataDir, { recursive: true });
}
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Helper to download a file
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirects
        return downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(err);
    });
  });
}

// Helper to fetch JSON
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return fetchJSON(response.headers.location).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to fetch: ${response.statusCode}`));
        return;
      }
      
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

// Process all NFTs
async function downloadAllNFTs() {
  const allMetadata = {};
  let successCount = 0;
  let errorCount = 0;
  
  console.log(`Starting download of ${mintAddresses.length} NFTs...\n`);
  
  for (let i = 0; i < mintAddresses.length; i++) {
    const mintAddress = mintAddresses[i];
    const gatewayUrl = gatewayUrls[i];
    
    try {
      console.log(`[${i + 1}/${mintAddresses.length}] Fetching metadata for ${mintAddress}...`);
      
      // Fetch metadata
      const metadata = await fetchJSON(gatewayUrl);
      
      // Save metadata
      const metadataPath = path.join(metadataDir, `${mintAddress}.json`);
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      
      // Download image
      if (metadata.image) {
        const imageUrl = metadata.image;
        const imageExt = path.extname(new URL(imageUrl).pathname) || '.png';
        const imageFilename = `${mintAddress}${imageExt}`;
        const imagePath = path.join(imagesDir, imageFilename);
        
        console.log(`  Downloading image from ${imageUrl}...`);
        await downloadFile(imageUrl, imagePath);
        
        // Update metadata to use local image path
        metadata.image = `/assets/radiants/${imageFilename}`;
      }
      
      // Store in combined metadata object
      allMetadata[mintAddress] = metadata;
      
      successCount++;
      console.log(`  ✓ Success\n`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      errorCount++;
      console.error(`  ✗ Error: ${error.message}\n`);
    }
  }
  
  // Save combined metadata file
  const combinedPath = path.join(metadataDir, 'all-metadata.json');
  fs.writeFileSync(combinedPath, JSON.stringify(allMetadata, null, 2));
  
  console.log(`\n=== Download Complete ===`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`\nMetadata saved to: ${metadataDir}`);
  console.log(`Images saved to: ${imagesDir}`);
  console.log(`Combined metadata: ${combinedPath}`);
}

// Run the download
downloadAllNFTs().catch(console.error);
