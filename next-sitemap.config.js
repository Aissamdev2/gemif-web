/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://gemif.cat', // Change to your actual domain
  generateRobotsTxt: true, // Generates a robots.txt file
  sitemapSize: 5000, // Optional, limits number of URLs per sitemap file
  changefreq: 'weekly',
  priority: 0.7,
};
