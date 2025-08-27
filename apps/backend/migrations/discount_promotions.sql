CREATE TABLE discount_promotions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value numeric NOT NULL,
    start_date timestamptz NOT NULL,
    end_date timestamptz NOT NULL
);

CREATE TABLE discount_promotions_products (
    discount_id uuid REFERENCES discount_promotions(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    PRIMARY KEY (discount_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_discount_promotions_dates
    ON discount_promotions(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_discount_promotions_products
    ON discount_promotions_products(product_id);
