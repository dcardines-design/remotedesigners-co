-- Subscriptions table for job seekers
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Lemon Squeezy IDs
  lemon_squeezy_subscription_id VARCHAR(255),
  lemon_squeezy_customer_id VARCHAR(255),
  lemon_squeezy_order_id VARCHAR(255),
  lemon_squeezy_variant_id VARCHAR(255),

  -- Subscription details
  plan VARCHAR(50) NOT NULL, -- 'monthly', 'quarterly', 'annual'
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'paused', 'expired', 'past_due'

  -- Billing
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,

  -- Portal
  customer_portal_url TEXT,
  update_payment_url TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_lemon_id ON subscriptions(lemon_squeezy_subscription_id);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage subscriptions (for webhooks)
CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL USING (true);

-- Add subscription_status to profiles for quick lookup
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN DEFAULT FALSE;

-- Function to update subscription status on profiles
CREATE OR REPLACE FUNCTION update_profile_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE profiles
    SET is_subscribed = (NEW.status = 'active')
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles
    SET is_subscribed = FALSE
    WHERE id = OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE OR DELETE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_profile_subscription_status();
