-- Casa Viva's website now lives at casaviva.company (casavivadecuba.com shows
-- a parked-domain page). Same WooCommerce store: product IDs and SKUs match.
UPDATE nexo_business.catalog_sources
   SET website_url = 'https://casaviva.company', updated_at = now()
 WHERE business_id = 'casa-viva';
