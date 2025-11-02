const axios = require("axios");
const Parser = require("rss-parser");

const parser = new Parser();

/**
 * Test function to debug feed issues
 */
exports.handler = async (event, context) => {
  const results = {
    reliefweb: null,
    unjobs: null,
    impactpool: null,
    idealist: null,
    eurobrussels: null,
  };

  // Test ReliefWeb
  try {
    console.log("Testing ReliefWeb API...");
    const reliefwebResponse = await axios.get(
      "https://api.reliefweb.int/v1/jobs?appname=jobna&limit=5",
      {
        timeout: 15000,
        headers: {
          "User-Agent": "Jobna/1.0",
        },
      }
    );
    results.reliefweb = {
      success: true,
      status: reliefwebResponse.status,
      hasData: !!reliefwebResponse.data,
      dataKeys: Object.keys(reliefwebResponse.data || {}),
      itemsCount: reliefwebResponse.data?.data?.length || 0,
      sampleItem: reliefwebResponse.data?.data?.[0] || null,
    };
  } catch (error) {
    results.reliefweb = {
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    };
  }

  // Test RSS Feeds
  const rssFeeds = [
    { name: "unjobs", url: "https://www.unjobnet.org/feed" },
    { name: "impactpool", url: "https://www.impactpool.org/feed" },
    { name: "idealist", url: "https://www.idealist.org/en/jobs.rss" },
    {
      name: "eurobrussels",
      url: "https://www.eurobrussels.com/rss/all_jobs.xml",
    },
  ];

  for (const feed of rssFeeds) {
    try {
      console.log(`Testing ${feed.name} RSS feed...`);
      const rssFeed = await parser.parseURL(feed.url);
      results[feed.name] = {
        success: true,
        title: rssFeed.title,
        itemsCount: rssFeed.items?.length || 0,
        sampleItem: rssFeed.items?.[0]
          ? {
              title: rssFeed.items[0].title,
              link: rssFeed.items[0].link,
              pubDate: rssFeed.items[0].pubDate,
            }
          : null,
      };
    } catch (error) {
      results[feed.name] = {
        success: false,
        error: error.message,
        stack: error.stack,
      };
    }
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      success: true,
      results: results,
      timestamp: new Date().toISOString(),
    }),
  };
};
