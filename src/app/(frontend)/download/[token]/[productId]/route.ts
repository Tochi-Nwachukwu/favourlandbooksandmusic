import fs from 'fs'
import path from 'path'
import { Readable } from 'stream'

import type { DigitalFile } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'

const PAID = ['paid', 'dispatched', 'completed']

/** Open the stored file: Vercel Blob in production, the local private-files folder in development. */
async function openFile(file: DigitalFile): Promise<ReadableStream | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (token) {
    const storeId = token.match(/^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i)?.[1]?.toLowerCase()
    const key = [file.prefix, encodeURIComponent(file.filename!)].filter(Boolean).join('/')
    const res = await fetch(`https://${storeId}.public.blob.vercel-storage.com/${key}`, { cache: 'no-store' })
    return res.ok ? res.body : null
  }
  const filePath = path.resolve(process.cwd(), 'private-files', path.basename(file.filename!))
  return fs.existsSync(filePath) ? (Readable.toWeb(fs.createReadStream(filePath)) as ReadableStream) : null
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string; productId: string }> },
) {
  const { token, productId } = await params
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'orders',
    where: { accessToken: { equals: token } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const order = docs[0]
  const owns = order?.items.some((i) => String(i.product) === productId)
  if (!order || !PAID.includes(order.status) || !owns) {
    return new Response('Download not available.', { status: 404 })
  }

  const product = await payload.findByID({
    collection: 'products',
    id: Number(productId),
    depth: 1,
    overrideAccess: true,
  })
  const file = product.digitalFile
  if (!file || typeof file !== 'object' || !file.filename) {
    return new Response(
      'This download is being prepared. We will email it to you shortly — please contact us if you need it sooner.',
      { status: 404 },
    )
  }

  const body = await openFile(file)
  if (!body) return new Response('File missing.', { status: 404 })

  return new Response(body, {
    headers: {
      'Content-Type': file.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.filename)}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
