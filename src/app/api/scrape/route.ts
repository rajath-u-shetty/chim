import { NextResponse } from 'next/server';
import puppeteer, { Page, ElementHandle } from 'puppeteer';
import { Product } from '@/types/product';

export async function POST(request: Request) {
  let browser;
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    browser = await puppeteer.launch({
      headless: true,
    });

    const page = await browser.newPage();
    
    // Set a reasonable timeout
    await page.setDefaultNavigationTimeout(30000);
    
    // Enable JavaScript
    await page.setJavaScriptEnabled(true);
    
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Extract product information based on the URL type (Amazon or Shopify)
    const isAmazon = url.includes('amazon');
    const isShopify = url.includes('shopify');

    let product: Product;

    if (isAmazon) {
      product = await scrapeAmazon(page);
    } else if (isShopify) {
      product = await scrapeShopify(page);
    } else {
      throw new Error('Unsupported website. Please provide an Amazon or Shopify product URL.');
    }

    await browser.close();
    return NextResponse.json(product);
  } catch (error) {
    console.error('Scraping error:', error);
    if (browser) {
      await browser.close();
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to scrape product data' },
      { status: 500 }
    );
  }
}

async function scrapeAmazon(page: Page): Promise<Product> {
  // Helper function to safely extract text content
  const safeTextExtract = async (selector: string, fallback = ''): Promise<string> => {
    try {
      const element = await page.$(selector);
      return element ? (await element.evaluate((el: Element) => el.textContent?.trim() || '')) : fallback;
    } catch {
      return fallback;
    }
  };

  // Helper function to safely extract image URL
  const safeImageExtract = async (selectors: string[]): Promise<string> => {
    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const src = await element.evaluate((el: Element) => {
            if (el instanceof HTMLImageElement) {
              const imgSrc = el.src || el.getAttribute('data-old-hires');
              const dynamicImages = el.getAttribute('data-a-dynamic-image');
              
              if (dynamicImages) {
                try {
                  const images = JSON.parse(dynamicImages);
                  return Object.keys(images)[0] || '';
                } catch {
                  return imgSrc || '';
                }
              }
              
              return imgSrc || '';
            }
            return '';
          });
          
          if (src) {
            return src;
          }
        }
      } catch {
        continue;
      }
    }
    throw new Error('Could not find product image');
  };

  const title = await safeTextExtract('#productTitle');
  if (!title) {
    throw new Error('Could not find product title');
  }

  const image = await safeImageExtract([
    '#landingImage',
    '#imgBlkFront',
    '#main-image',
    'img[data-old-hires]',
    '#prodImage'
  ]);

  const price = await safeTextExtract('.a-price .a-offscreen, #priceblock_ourprice, #price_inside_buybox');
  const description = await safeTextExtract('#productDescription p, #feature-bullets');
  
  const features = await page.$$eval(
    '#feature-bullets li span, #productDescription ul li', 
    (elements: Element[]) => elements.map((el: Element) => el.textContent?.trim() || '').filter(Boolean)
  );

  return {
    title,
    image,
    price,
    description,
    features,
    url: page.url(),
  };
}

async function scrapeShopify(page: Page): Promise<Product> {
  // Helper function to safely extract text content
  const safeTextExtract = async (selector: string, fallback = ''): Promise<string> => {
    try {
      const element = await page.$(selector);
      return element ? (await element.evaluate((el: Element) => el.textContent?.trim() || '')) : fallback;
    } catch {
      return fallback;
    }
  };

  const title = await safeTextExtract('.product-title, .product__title, h1');
  if (!title) {
    throw new Error('Could not find product title');
  }

  const image = await page.$eval(
    '.product-featured-image, .product__image, .product-single__image', 
    (el: Element) => {
      if (el instanceof HTMLImageElement) {
        return el.src;
      }
      return '';
    }
  );

  if (!image) {
    throw new Error('Could not find product image');
  }

  const price = await safeTextExtract('.product-price, .price__regular, .product__price');
  const description = await safeTextExtract('.product-description, .product__description');
  
  const features = await page.$$eval(
    '.product-features li, .product__features li', 
    (elements: Element[]) => elements.map((el: Element) => el.textContent?.trim() || '').filter(Boolean)
  );

  return {
    title,
    image,
    price,
    description,
    features,
    url: page.url(),
  };
} 