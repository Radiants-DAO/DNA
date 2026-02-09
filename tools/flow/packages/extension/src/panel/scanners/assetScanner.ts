import type { AssetScanResult } from '@flow/shared';

/**
 * Scan all page assets from the inspected page via inspectedWindow.eval().
 * Collects: images (<img> + CSS backgrounds), fonts, stylesheets, scripts.
 */
export async function scanAssets(): Promise<AssetScanResult> {
  return new Promise((resolve) => {
    chrome.devtools.inspectedWindow.eval(
      `(function() {
        // ── Images: <img>, <picture source>, <svg image>, CSS backgrounds ──
        var images = [];
        var imgEls = document.querySelectorAll('img');
        for (var i = 0; i < imgEls.length; i++) {
          var img = imgEls[i];
          images.push({
            src: img.src || img.currentSrc || '',
            alt: img.alt || '',
            width: img.width || 0,
            height: img.height || 0,
            naturalWidth: img.naturalWidth || 0,
            naturalHeight: img.naturalHeight || 0,
            tagName: 'img'
          });
        }

        // SVG <image> elements
        var svgImages = document.querySelectorAll('svg image');
        for (var i = 0; i < svgImages.length; i++) {
          var svgImg = svgImages[i];
          var href = svgImg.getAttribute('href') || svgImg.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || '';
          if (href) {
            images.push({
              src: href,
              alt: '',
              width: parseInt(svgImg.getAttribute('width') || '0', 10),
              height: parseInt(svgImg.getAttribute('height') || '0', 10),
              naturalWidth: 0,
              naturalHeight: 0,
              tagName: 'svg-image'
            });
          }
        }

        // CSS background images (sample visible elements)
        var allEls = document.querySelectorAll('*');
        var bgCount = 0;
        for (var i = 0; i < allEls.length && bgCount < 50; i++) {
          var cs = getComputedStyle(allEls[i]);
          var bgImage = cs.backgroundImage;
          if (bgImage && bgImage !== 'none') {
            var urlMatch = bgImage.match(/url\\(["']?([^"')]+)["']?\\)/);
            if (urlMatch && urlMatch[1]) {
              images.push({
                src: urlMatch[1],
                alt: '',
                width: allEls[i].offsetWidth || 0,
                height: allEls[i].offsetHeight || 0,
                naturalWidth: 0,
                naturalHeight: 0,
                tagName: allEls[i].tagName.toLowerCase(),
                isBackground: true
              });
              bgCount++;
            }
          }
        }

        // ── Fonts: @font-face + Google Fonts / Typekit detection ──
        var fontMap = {};

        // Walk @font-face rules
        try {
          for (var s = 0; s < document.styleSheets.length; s++) {
            try {
              var rules = document.styleSheets[s].cssRules;
              for (var r = 0; r < rules.length; r++) {
                if (rules[r] instanceof CSSFontFaceRule) {
                  var ff = rules[r];
                  var family = (ff.style.getPropertyValue('font-family') || '').replace(/['"]/g, '').trim();
                  if (!family) continue;
                  var weight = ff.style.getPropertyValue('font-weight') || '400';
                  var style = ff.style.getPropertyValue('font-style') || 'normal';
                  var src = ff.style.getPropertyValue('src') || '';
                  var urlMatch = src.match(/url\\(["']?([^"')]+)["']?\\)/);
                  var url = urlMatch ? urlMatch[1] : undefined;

                  // Determine source type
                  var sourceType = 'self-hosted';
                  if (url) {
                    if (url.indexOf('fonts.gstatic.com') !== -1 || url.indexOf('fonts.googleapis.com') !== -1) sourceType = 'google-fonts';
                    else if (url.indexOf('use.typekit.net') !== -1) sourceType = 'typekit';
                  }

                  if (fontMap[family]) {
                    if (fontMap[family].weights.indexOf(weight) === -1) fontMap[family].weights.push(weight);
                    if (fontMap[family].styles.indexOf(style) === -1) fontMap[family].styles.push(style);
                  } else {
                    fontMap[family] = { family: family, source: sourceType, weights: [weight], styles: [style], url: url };
                  }
                }
              }
            } catch(e) { /* cross-origin */ }
          }
        } catch(e) {}

        // Also check <link> tags for Google Fonts / Typekit
        var links = document.querySelectorAll('link[rel="stylesheet"]');
        for (var i = 0; i < links.length; i++) {
          var href = links[i].href || '';
          if (href.indexOf('fonts.googleapis.com') !== -1) {
            // Extract family from URL param
            var familyMatch = href.match(/family=([^&:]+)/);
            if (familyMatch) {
              var families = familyMatch[1].split('|');
              for (var f = 0; f < families.length; f++) {
                var name = decodeURIComponent(families[f].replace(/\\+/g, ' '));
                if (!fontMap[name]) {
                  fontMap[name] = { family: name, source: 'google-fonts', weights: ['400'], styles: ['normal'], url: href };
                }
              }
            }
          }
        }

        var fonts = [];
        var fontKeys = Object.keys(fontMap);
        for (var i = 0; i < fontKeys.length; i++) {
          fonts.push(fontMap[fontKeys[i]]);
        }

        // ── Stylesheets ──
        var stylesheets = [];
        var linkSheets = document.querySelectorAll('link[rel="stylesheet"]');
        for (var i = 0; i < linkSheets.length; i++) {
          stylesheets.push({
            url: linkSheets[i].href || '',
            type: 'link',
            size: 0
          });
        }
        var inlineStyles = document.querySelectorAll('style');
        for (var i = 0; i < inlineStyles.length; i++) {
          stylesheets.push({
            url: '',
            type: 'inline',
            size: (inlineStyles[i].textContent || '').length
          });
        }

        // ── Scripts ──
        var scripts = [];
        var scriptEls = document.querySelectorAll('script');
        for (var i = 0; i < scriptEls.length; i++) {
          var sc = scriptEls[i];
          if (sc.src) {
            scripts.push({
              url: sc.src,
              type: 'external',
              async: sc.async || false,
              defer: sc.defer || false
            });
          } else if ((sc.textContent || '').trim().length > 0) {
            scripts.push({
              url: '',
              type: 'inline',
              async: false,
              defer: false
            });
          }
        }

        return {
          images: images,
          fonts: fonts,
          stylesheets: stylesheets,
          scripts: scripts
        };
      })()`,
      (result: unknown, exceptionInfo?: { isError?: boolean; description?: string; value?: string }) => {
        if (exceptionInfo?.isError || !result) {
          console.error('[assetScanner] eval error:', exceptionInfo?.description ?? exceptionInfo?.value ?? 'no result');
          resolve({ images: [], fonts: [], stylesheets: [], scripts: [] });
          return;
        }
        resolve(result as AssetScanResult);
      },
    );
  });
}
