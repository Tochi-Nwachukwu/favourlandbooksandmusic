# Favour Land Christian Books and Music

Next.js 16 + Payload CMS 3 + Postgres replacement for the WordPress/WooCommerce site at favourbooksandmusic.com, with PayPal checkout.

## Run locally

```bash
cp .env.example .env      # fill in DATABASE_URL, PAYLOAD_SECRET, PayPal sandbox keys
pnpm install
pnpm seed                 # imports products, images and pages from ../data
pnpm dev                  # site: http://localhost:3000   admin: http://localhost:3000/admin
```

The first visit to `/admin` asks you to create the admin account.

`pnpm seed` wipes and re-imports **products, categories, pages and images** only. Orders, mentorship applications, users and download files are never touched.

## Where things live in the admin

| Section | What it's for |
| --- | --- |
| Shop → Orders | Every PayPal payment. Change status to *Dispatched* and add the tracking number when posting. |
| Shop → Products | Price, "was" price, cover images, description, *Show in shop*, *In stock*, *Feature on home page*. |
| Shop → Download Files | Upload ebook PDFs / music zips, then pick the file on the product (format = Digital). |
| Content → Pages | About, Contact, Mentorship, Terms, etc. |
| Content → Site Settings | Home page text, contact details, social links, **postage prices**. |
| Mentorship → Applications | Submissions from the form on /mentorship, with the suggested tier. |

## How checkout works

1. The basket is kept in the browser.
2. `POST /checkout/create-order` re-prices everything from the database, saves a *pending* order and creates the PayPal order.
3. `POST /checkout/capture-order` captures the payment, checks the amount, marks the order paid and emails the customer (and `SHOP_NOTIFY_EMAIL`).
4. The customer lands on `/order/<number>?t=<secret>`, which has their download links (`/download/<secret>/<productId>`).

## Re-importing from the old site

`../data` holds the WooCommerce export (`raw/`), the images and the cleaned pages. `../scripts/clean_html.py` and `../scripts/curate_pages.py` rebuild `data/pages.json` from `raw/pages.json`.
