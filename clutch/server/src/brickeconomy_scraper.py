"""BrickEconomy price scraper using Scrapling.

Scrapes https://www.brickeconomy.com for LEGO part/set pricing data.
Returns cached price data for use in the Hold inventory app.

Usage:
    python3 -c "
    from brickeconomy_scraper import scrape_price
    import json
    print(json.dumps(scrape_price('3001', 1)))
    "
"""

import re
import json
import sys
from urllib.parse import quote

try:
    from scrapling import Fetcher
except ImportError:
    Fetcher = None

# Fallback: use requests if Scrapling not available
try:
    import requests
except ImportError:
    requests = None


def fetch_page(url):
    """Fetch a page using Scrapling (preferred) or requests fallback."""
    if Fetcher:
        f = Fetcher()
        # Use stealth mode to avoid bot detection
        page = f.get(url, stealth=True)
        if page and page.status == 200:
            return page.text
        return None

    if requests:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                          '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        }
        try:
            r = requests.get(url, headers=headers, timeout=15)
            if r.status_code == 200:
                return r.text
        except Exception:
            pass
    return None


def parse_brickeconomy_price(html, part_no, color_id):
    """Parse BrickEconomy page HTML for pricing data."""
    if not html:
        return None

    result = {
        'part_no': part_no,
        'color_id': color_id,
        'price_cents': None,
        'low_price_cents': None,
        'high_price_cents': None,
        'qty_available': None,
        'price_label': None,
        'source': 'brickeconomy',
    }

    # Try to find price data in JSON-LD
    json_ld_match = re.search(
        r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',
        html, re.DOTALL
    )
    if json_ld_match:
        try:
            ld = json.loads(json_ld_match.group(1))
            if isinstance(ld, dict):
                offers = ld.get('offers', {})
                if isinstance(offers, dict):
                    price_str = offers.get('price')
                    if price_str:
                        result['price_cents'] = int(float(price_str) * 100)
                        result['price_label'] = offers.get('priceCurrency', 'USD')
        except (json.JSONDecodeError, ValueError, TypeError):
            pass

    # Generic price pattern scans
    if not result['price_cents']:
        # Look for dollar amounts near keywords
        price_patterns = [
            r'(?:avg|average|market)\s*(?:price|value)?[:\s]*\$?([0-9]+\.[0-9]{2})',
            r'\$([0-9]+\.[0-9]{2})\s*(?:avg|average|market)',
            r'(?:current|listed)\s*price[:\s]*\$?([0-9]+\.[0-9]{2})',
            r'price[:\s]*\$?([0-9]+\.[0-9]{2})',
        ]
        for pattern in price_patterns:
            m = re.search(pattern, html, re.IGNORECASE)
            if m:
                result['price_cents'] = int(float(m.group(1)) * 100)
                break

    # Try to find low/high ranges
    range_patterns = [
        r'(?:range|from)[:\s]*\$?([0-9]+\.[0-9]{2})\s*(?:to|-|–)\s*\$?([0-9]+\.[0-9]{2})',
        r'low[:\s]*\$?([0-9]+\.[0-9]{2}).*?high[:\s]*\$?([0-9]+\.[0-9]{2})',
        r'min[:\s]*\$?([0-9]+\.[0-9]{2}).*?max[:\s]*\$?([0-9]+\.[0-9]{2})',
    ]
    for pattern in range_patterns:
        m = re.search(pattern, html, re.IGNORECASE | re.DOTALL)
        if m:
            result['low_price_cents'] = int(float(m.group(1)) * 100)
            result['high_price_cents'] = int(float(m.group(2)) * 100)
            break

    # Try to find quantity available
    qty_patterns = [
        r'(\d[\d,]*)\s*(?:qty|quantity|available|in\s*stock|sold)',
        r'(?:qty|quantity|available)[:\s]*(\d[\d,]*)',
        r'\b(\d+)\s*units?\s*(?:sold|available)',
    ]
    for pattern in qty_patterns:
        m = re.search(pattern, html, re.IGNORECASE)
        if m:
            qty_str = m.group(1).replace(',', '')
            try:
                result['qty_available'] = int(qty_str)
            except ValueError:
                pass
            break

    return result


def scrape_price(part_no, color_id=None):
    """Main entry point - scrape BrickEconomy for a part's price."""
    # Build the URL
    clean_part = part_no.replace('/', '%2F')
    url = f'https://www.brickeconomy.com/part/{clean_part}'

    if color_id:
        url += f'?color={color_id}'

    html = fetch_page(url)
    if not html:
        # Try alternative URL format
        url = f'https://www.brickeconomy.com/part/{clean_part}'
        html = fetch_page(url)

    if not html:
        return {
            'part_no': part_no,
            'color_id': color_id,
            'error': 'Could not fetch page',
            'source': 'brickeconomy',
        }

    result = parse_brickeconomy_price(html, part_no, color_id)
    result['url'] = url

    if not result.get('price_cents'):
        result['note'] = 'No price found on page'

    return result


if __name__ == '__main__':
    part_no = sys.argv[1] if len(sys.argv) > 1 else '3001'
    color_id = int(sys.argv[2]) if len(sys.argv) > 2 else None
    result = scrape_price(part_no, color_id)
    print(json.dumps(result, indent=2))
