/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.ollanpharmacy.ng',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  changefreq: 'daily',
  priority: 1,
  autoLastmod: true,
  exclude: [
    '/admin',
    '/admin/*',
    '/api/*',
    '/private/*',
    '/checkout',
    '/checkout/*',
    '/account',
    '/account/*',
    '/user',
    '/user/*',
    '/payment',
    '/payment/*'
  ],
  additionalPaths: async (config) => {
    const additionalPaths = []
    
    // Add your pharmacy-specific pages
    const pharmacyPages = [
      '/pharmacy-consultation',
      '/prescription-upload',
      '/delivery-areas',
      '/health-tips',
      '/category/medications',
      '/category/vitamins-supplements',
      '/category/baby-care',
      '/category/personal-care',
      '/category/medical-devices',
      '/category/groceries'
    ]
    
    pharmacyPages.forEach(page => {
      additionalPaths.push({
        loc: page,
        changefreq: 'weekly',
        priority: 0.7,
        lastmod: new Date().toISOString(),
      })
    })
    
    return additionalPaths
  },
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/private/',
          '/_next/',
          '/checkout/',
          '/account/',
          '/user/',
          '/payment/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/private/'],
      }
    ],
    additionalSitemaps: [
      'https://www.ollanpharmacy.ng/sitemap.xml',
    ],
  },
}
