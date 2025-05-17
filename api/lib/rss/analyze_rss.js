// Test script to analyze RSS feed structure
import fetch from 'node-fetch';
import xml2js from 'xml2js';

async function analyzeRssFeed() {
  try {
    // Fetch RSS feed
    const response = await fetch('https://polisen.se/aktuellt/rss/hela-landet/handelser-i-hela-landet/');
    const xml = await response.text();
    
    // Parse XML
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xml);
    
    // Extract first 5 items for analysis
    const items = result.rss.channel.item.slice(0, 5);
    
    console.log('RSS Feed Analysis:');
    console.log('==================');
    
    // Analyze URL structure and ID extraction
    console.log('\nURL and ID Analysis:');
    items.forEach((item, index) => {
      const url = item.link;
      const guid = item.guid._ || item.guid;
      
      // Extract potential ID from URL
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 2]; // Get the part before the trailing slash
      
      // Extract date and title parts
      const dateParts = item.title.split(',')[0].trim().split(' ');
      const day = dateParts[0];
      const month = dateParts[1];
      const time = dateParts[2];
      
      // Extract location and type
      const titleParts = item.title.split(',');
      const type = titleParts[1]?.trim() || 'Unknown';
      const location = titleParts[2]?.trim() || 'Unknown';
      
      console.log(`\nItem ${index + 1}:`);
      console.log(`Title: ${item.title}`);
      console.log(`URL: ${url}`);
      console.log(`GUID: ${guid}`);
      console.log(`Potential ID from URL: ${lastPart}`);
      console.log(`Publication Date: ${item.pubDate}`);
      console.log(`Extracted Day: ${day}, Month: ${month}, Time: ${time}`);
      console.log(`Type: ${type}`);
      console.log(`Location: ${location}`);
      console.log(`Description: ${item.description}`);
    });
    
    // Analyze all items for pattern consistency
    console.log('\n\nProperty Consistency Analysis:');
    const allProperties = new Set();
    result.rss.channel.item.forEach(item => {
      Object.keys(item).forEach(key => allProperties.add(key));
    });
    
    console.log(`All properties across all items: ${Array.from(allProperties).join(', ')}`);
    console.log(`Total items in feed: ${result.rss.channel.item.length}`);
    
    // Check if all items have the same structure
    const sameStructure = result.rss.channel.item.every(item => 
      Array.from(allProperties).every(prop => prop in item)
    );
    
    console.log(`All items have the same property structure: ${sameStructure}`);
    
  } catch (error) {
    console.error('Error analyzing RSS feed:', error);
  }
}

analyzeRssFeed(); 