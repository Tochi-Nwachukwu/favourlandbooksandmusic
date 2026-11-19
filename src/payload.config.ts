import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Categories } from './collections/Categories'
import { DigitalFiles } from './collections/DigitalFiles'
import { Media } from './collections/Media'
import { MentorshipApplications } from './collections/MentorshipApplications'
import { Orders } from './collections/Orders'
import { Pages } from './collections/Pages'
import { Products } from './collections/Products'
import { Users } from './collections/Users'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' – Favour Land Admin' },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Orders, Products, Categories, DigitalFiles, Pages, Media, MentorshipApplications, Users],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  // Without SMTP settings, emails are printed to the server console (fine for local development)
  email: process.env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromAddress: process.env.EMAIL_FROM || 'support@favourbooksandmusic.com',
        defaultFromName: 'Favour Land Books & Music',
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        },
      })
    : undefined,
  sharp,
  plugins: [
    // On Vercel the disk is temporary, so uploads go to Vercel Blob. Locally (no token) they stay on disk.
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      token: process.env.BLOB_READ_WRITE_TOKEN,
      // keep the database schema identical with and without Blob, so migrations match production
      alwaysInsertFields: true,
      // browser uploads straight to Blob, avoiding Vercel's 4.5 MB request limit (music files)
      clientUploads: true,
      collections: {
        // product images are public anyway: serve them straight from the Blob CDN
        media: { prefix: 'media', disablePayloadAccessControl: true },
        // Blob has no private files, so downloads sit under an unguessable folder name and are only
        // ever streamed to customers through /download, never linked directly
        'digital-files': { prefix: `downloads/${process.env.DOWNLOADS_SECRET_PREFIX || 'private'}` },
      },
    }),
  ],
})
