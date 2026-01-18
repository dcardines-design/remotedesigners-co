/**
 * Script to create Stripe products and prices for job postings
 * Run with: npx tsx scripts/create-stripe-products.ts
 */

import Stripe from 'stripe'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const products = [
  {
    name: 'Job Posting (30 days)',
    description: 'Post your job listing to Remote Designers for 30 days',
    price: 9900, // $99.00 in cents
    metadata: { type: 'job_posting', key: 'BASE_POSTING' },
  },
  {
    name: 'Featured Listing',
    description: 'Highlight your job with a gold badge and background',
    price: 5000, // $50.00 in cents
    metadata: { type: 'job_addon', key: 'FEATURED' },
  },
  {
    name: 'Sticky Post (24 hours)',
    description: 'Pin your job to the top of the homepage for 24 hours',
    price: 7900, // $79.00 in cents
    metadata: { type: 'job_addon', key: 'STICKY_24H' },
  },
  {
    name: 'Sticky Post (7 days)',
    description: 'Pin your job to the top of the homepage for 7 days',
    price: 14900, // $149.00 in cents
    metadata: { type: 'job_addon', key: 'STICKY_7D' },
  },
  {
    name: 'Rainbow Border',
    description: 'Add an eye-catching animated rainbow border to your listing',
    price: 3900, // $39.00 in cents
    metadata: { type: 'job_addon', key: 'RAINBOW_BORDER' },
  },
  {
    name: 'Extended Duration (+30 days)',
    description: 'Extend your listing from 30 to 60 days',
    price: 4900, // $49.00 in cents
    metadata: { type: 'job_addon', key: 'EXTENDED_DURATION' },
  },
]

async function createProducts() {
  console.log('Creating Stripe products and prices for job postings...\n')

  const results: { key: string; productId: string; priceId: string }[] = []

  for (const item of products) {
    try {
      // Check if product already exists by searching
      const existingProducts = await stripe.products.search({
        query: `name:"${item.name}" AND active:"true"`,
      })

      let product: Stripe.Product

      if (existingProducts.data.length > 0) {
        product = existingProducts.data[0]
        console.log(`Product "${item.name}" already exists (${product.id})`)
      } else {
        // Create the product
        product = await stripe.products.create({
          name: item.name,
          description: item.description,
          metadata: item.metadata,
        })
        console.log(`Created product: ${item.name} (${product.id})`)
      }

      // Check for existing price
      const existingPrices = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 1,
      })

      let price: Stripe.Price

      if (existingPrices.data.length > 0 && existingPrices.data[0].unit_amount === item.price) {
        price = existingPrices.data[0]
        console.log(`  Price already exists: $${item.price / 100} (${price.id})`)
      } else {
        // Create the price
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: item.price,
          currency: 'usd',
          metadata: item.metadata,
        })
        console.log(`  Created price: $${item.price / 100} (${price.id})`)
      }

      results.push({
        key: item.metadata.key,
        productId: product.id,
        priceId: price.id,
      })

      console.log('')
    } catch (error) {
      console.error(`Error creating ${item.name}:`, error)
    }
  }

  // Output environment variables to add
  console.log('\n=== Add these to your .env.local file ===\n')
  console.log('# Job Posting Stripe Price IDs')
  for (const result of results) {
    console.log(`STRIPE_PRICE_${result.key}=${result.priceId}`)
  }

  console.log('\n=== TypeScript constants ===\n')
  console.log('export const JOB_POSTING_PRICES = {')
  for (const result of results) {
    console.log(`  ${result.key}: '${result.priceId}',`)
  }
  console.log('}')
}

createProducts().catch(console.error)
