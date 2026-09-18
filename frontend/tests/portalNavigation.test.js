import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (relativePath) => readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8')

test('public, customer, and admin navigation are rendered by separate shells', async () => {
  const app = await read('src/App.jsx')

  assert.match(app, /function PublicLayout\(\)[\s\S]*?<Header \/>/)
  assert.match(app, /function CustomerLayout\(\)[\s\S]*?<CustomerHeader \/>/)
  assert.doesNotMatch(app, /function CustomerLayout\(\)[\s\S]*?<Header \/>/)

  const adminRoute = app.match(/<Route path='\/admin'[\s\S]*?\/>/)?.[0] || ''
  assert.match(adminRoute, /<AdminEntry \/>/)
  assert.doesNotMatch(adminRoute, /Header|CustomerHeader/)
})

test('booking presentation keeps preview language neutral and confirmation on review step', async () => {
  const booking = await read('src/pages/Booking.jsx')
  const previewPanel = await read('src/features/booking/components/AiPreviewPanel.jsx')
  const stylePicker = await read('src/features/booking/components/StylePicker.jsx')

  const visibleCopy = `${booking}\n${previewPanel}\n${stylePicker}`
  assert.doesNotMatch(visibleCopy, /AI Cut Preview|AI Groomed|Top suggestion|Seasonal pick|Recommended for Wet|Recommended for Hot/i)
  assert.match(booking, /mobileStep === 4[\s\S]*?Confirm booking/)
  assert.match(stylePicker, /Groomer note:/)
  assert.match(previewPanel, /visual reference, not a guaranteed final result/i)
})
