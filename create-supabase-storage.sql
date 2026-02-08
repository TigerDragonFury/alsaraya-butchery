-- Create Supabase Storage Bucket for Product Images
-- Run this in your Supabase SQL Editor

-- Create the bucket (public = true allows public read access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to all product images
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- Allow anyone to upload product images (for admin use)
CREATE POLICY "Anyone can upload product images"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'product-images' );

-- Allow anyone to update product images
CREATE POLICY "Anyone can update product images"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'product-images' );

-- Allow anyone to delete product images
CREATE POLICY "Anyone can delete product images"
ON storage.objects FOR DELETE
USING ( bucket_id = 'product-images' );
