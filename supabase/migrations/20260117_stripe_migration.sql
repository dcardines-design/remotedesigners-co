-- Migration: Add Stripe columns and remove Lemon Squeezy columns
-- This migration adds Stripe-specific columns to the subscriptions table

-- Add Stripe columns
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);

-- Create index for Stripe subscription lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

-- Make Lemon Squeezy columns nullable (keep for historical data)
-- The columns are already nullable, so no change needed

-- Note: We keep the Lemon Squeezy columns for historical data
-- They can be dropped in a future migration after confirming all data is migrated:
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS lemon_squeezy_subscription_id;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS lemon_squeezy_customer_id;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS lemon_squeezy_order_id;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS lemon_squeezy_variant_id;
-- DROP INDEX IF EXISTS idx_subscriptions_lemon_id;

-- Update external_id prefix comment in jobs table
-- Jobs now use stripe_ prefix instead of ls_ for external_id
COMMENT ON COLUMN jobs.external_id IS 'External payment ID: test_*, stripe_*, or ls_* (legacy)';
