-- Schema for Choir Mezmure Study App Admin Dashboard

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (clean setup)
DROP TABLE IF EXISTS mezmurs;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS settings;

-- 1. Categories Table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon_url TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 2. Mezmurs Table
CREATE TABLE mezmurs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    language TEXT NOT NULL CHECK (language IN ('Amharic', 'English', 'Both')),
    mezmur_number TEXT,
    author TEXT,
    tune TEXT,
    lyrics TEXT NOT NULL,
    last_edited_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 3. Announcements Table
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    image_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 4. Settings Table (Single row configuration)
CREATE TABLE settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    logo_url TEXT,
    welcome_text TEXT DEFAULT 'Welcome to Zion Choir',
    choir_name TEXT DEFAULT 'Zion Choir',
    youtube_channel_id TEXT,
    youtube_api_key TEXT,
    facebook_url TEXT,
    telegram_url TEXT,
    youtube_url TEXT,
    instagram_url TEXT,
    tiktok_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Seed Initial Default Settings Row
INSERT INTO settings (id, welcome_text, choir_name)
VALUES (1, 'Welcome to Zion Choir', 'Zion Choir')
ON CONFLICT (id) DO NOTHING;
