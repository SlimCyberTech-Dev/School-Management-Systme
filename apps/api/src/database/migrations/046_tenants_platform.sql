-- Multi-tenant core: schools (tenants), subdomain mapping, per-tenant settings.

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(63) NOT NULL UNIQUE,
  display_name VARCHAR(140) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'provisioning')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants (status);

CREATE TABLE IF NOT EXISTS tenant_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subdomain VARCHAR(63) NOT NULL UNIQUE,
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_domains_tenant ON tenant_domains (tenant_id);

CREATE TABLE IF NOT EXISTS tenant_settings (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  school_name VARCHAR(140) NOT NULL,
  motto VARCHAR(180),
  vision TEXT,
  mission TEXT,
  logo_url TEXT,
  contact_email VARCHAR(160),
  contact_phone VARCHAR(40),
  website_url TEXT,
  postal_address TEXT,
  physical_address TEXT,
  primary_color CHAR(7),
  secondary_color CHAR(7),
  report_footer_text VARCHAR(280),
  report_layout JSONB,
  feature_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
