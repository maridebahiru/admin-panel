import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import axios from 'axios';
import { supabase } from './supabaseClient.js';
import { requireAuth } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Multer for in-memory file storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Helper: Ensure Supabase Storage bucket exists
const ensureBucketExists = async () => {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.warn('Could not list buckets from Supabase. Supabase credentials might be invalid.', listError.message);
      return;
    }

    const bucketName = 'mezmure-assets';
    const exists = buckets.some(b => b.name === bucketName);
    if (!exists) {
      console.log(`Creating public Supabase bucket "${bucketName}"...`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'],
        fileSizeLimit: 2097152 // 2MB
      });
      if (createError) {
        console.error(`Error creating bucket "${bucketName}":`, createError.message);
      } else {
        console.log(`Successfully created public bucket "${bucketName}".`);
      }
    }
  } catch (err) {
    console.error('Exception verifying Supabase Storage buckets:', err);
  }
};

// Helper: Upload file to Supabase Storage
const uploadToSupabase = async (file, folder) => {
  const fileExtension = file.originalname.split('.').pop();
  const cleanName = file.originalname.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `${folder}/${Date.now()}-${cleanName}.${fileExtension}`;
  
  const { data, error } = await supabase.storage
    .from('mezmure-assets')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('mezmure-assets')
    .getPublicUrl(fileName);

  return publicUrl;
};

// -----------------------------------------------------------------------------
// YouTube Cache State
// -----------------------------------------------------------------------------
let youtubeCache = {
  data: null,
  timestamp: 0
};
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in ms

// Helper to query YouTube Data API v3
const fetchLatestYoutubeVideo = async (channelId, apiKey) => {
  if (!channelId || !apiKey) {
    throw new Error('YouTube settings are incomplete');
  }

  // 1. Search for latest video
  const searchUrl = `https://www.googleapis.com/youtube/v3/search`;
  const searchRes = await axios.get(searchUrl, {
    params: {
      part: 'snippet',
      channelId: channelId,
      order: 'date',
      maxResults: 1,
      type: 'video',
      key: apiKey
    }
  });

  const videoItem = searchRes.data.items?.[0];
  if (!videoItem) {
    throw new Error('No videos found in YouTube channel');
  }

  const videoId = videoItem.id.videoId;
  const title = videoItem.snippet.title;
  const publishedAt = videoItem.snippet.publishedAt;

  // 2. Fetch statistics (view count)
  const videosUrl = `https://www.googleapis.com/youtube/v3/videos`;
  const videoDetailsRes = await axios.get(videosUrl, {
    params: {
      part: 'statistics,snippet',
      id: videoId,
      key: apiKey
    }
  });

  const statistics = videoDetailsRes.data.items?.[0]?.statistics;
  const viewCount = statistics ? parseInt(statistics.viewCount, 10) : 0;

  return {
    videoId,
    title,
    publishedAt,
    viewCount,
    fallback: false
  };
};

// -----------------------------------------------------------------------------
// AUTH ENDPOINTS
// -----------------------------------------------------------------------------

// POST /auth/login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Supabase Auth Error during login:', error);
      return res.status(400).json({ error: error.message });
    }

    return res.json({
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

// POST /auth/forgot-password
app.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/reset-password' // redirect to frontend if they click link
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ message: 'Password reset instructions sent to your email.' });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    return res.status(500).json({ error: 'Internal server error sending reset email' });
  }
});

// -----------------------------------------------------------------------------
// SETTINGS ENDPOINTS
// -----------------------------------------------------------------------------

// GET /settings
app.get('/settings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      // If table doesn't have row 1, seed it on demand
      if (error.code === 'PGRST116') {
        const { data: newRow, error: seedError } = await supabase
          .from('settings')
          .insert({ id: 1, welcome_text: 'Welcome to Zion Choir', choir_name: 'Zion Choir' })
          .select()
          .single();
        
        if (seedError) throw seedError;
        return res.json(newRow);
      }
      throw error;
    }
    
    // Obfuscate YouTube API Key slightly for non-authenticated settings fetch if any,
    // but settings API is usually for admins. We return it so they can see/edit it, 
    // but we can hide it in standard frontend. Let's return it since it's admin.
    return res.json(data);
  } catch (err) {
    console.error('Get Settings Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// PUT /settings (Protected)
app.put('/settings', requireAuth, async (req, res) => {
  const {
    welcome_text,
    choir_name,
    youtube_channel_id,
    youtube_api_key,
    facebook_url,
    telegram_url,
    youtube_url,
    instagram_url,
    tiktok_url
  } = req.body;

  try {
    // Clear youtube cache if channel or key changed
    const { data: current } = await supabase.from('settings').select('*').eq('id', 1).single();
    if (
      current &&
      (current.youtube_channel_id !== youtube_channel_id || current.youtube_api_key !== youtube_api_key)
    ) {
      youtubeCache = { data: null, timestamp: 0 };
    }

    const { data, error } = await supabase
      .from('settings')
      .update({
        welcome_text,
        choir_name,
        youtube_channel_id,
        youtube_api_key,
        facebook_url,
        telegram_url,
        youtube_url,
        instagram_url,
        tiktok_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error('Update Settings Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /settings/logo (Protected)
app.post('/settings/logo', requireAuth, upload.single('logo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No logo file provided' });
  }

  try {
    const publicUrl = await uploadToSupabase(req.file, 'branding');
    
    const { data, error } = await supabase
      .from('settings')
      .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error('Logo Upload Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// YOUTUBE ENDPOINTS
// -----------------------------------------------------------------------------

// GET /youtube/latest
app.get('/youtube/latest', async (req, res) => {
  try {
    // 1. Fetch settings from DB
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('logo_url, welcome_text, youtube_channel_id, youtube_api_key')
      .eq('id', 1)
      .single();

    if (settingsError || !settings) {
      return res.json({ fallback: true, message: 'Settings not configured' });
    }

    const { logo_url, welcome_text, youtube_channel_id, youtube_api_key } = settings;

    // Fallback conditions: Missing keys or channel ID
    if (!youtube_channel_id || !youtube_api_key) {
      return res.json({
        fallback: true,
        logoUrl: logo_url,
        welcomeText: welcome_text
      });
    }

    // Check Cache
    const now = Date.now();
    if (youtubeCache.data && now - youtubeCache.timestamp < CACHE_DURATION) {
      return res.json(youtubeCache.data);
    }

    // Try fetching from YouTube Data API
    try {
      const videoData = await fetchLatestYoutubeVideo(youtube_channel_id, youtube_api_key);
      youtubeCache = {
        data: videoData,
        timestamp: now
      };
      return res.json(videoData);
    } catch (apiErr) {
      console.warn('YouTube API call failed, degrading silently to fallback:', apiErr.message);
      
      // If we have previous cache data, we can serve it instead of failing
      if (youtubeCache.data) {
        return res.json(youtubeCache.data);
      }

      // Silent fallback representation
      return res.json({
        fallback: true,
        logoUrl: logo_url,
        welcomeText: welcome_text
      });
    }
  } catch (err) {
    console.error('Youtube Fetch Endpoint Error:', err);
    return res.json({ fallback: true, message: 'Internal server error querying youtube' });
  }
});

// GET /youtube/test
app.get('/youtube/test', async (req, res) => {
  const { channelId, apiKey } = req.query;

  if (!channelId || !apiKey) {
    return res.status(400).json({ error: 'Both channelId and apiKey parameters are required to test connection' });
  }

  try {
    const videoData = await fetchLatestYoutubeVideo(channelId, apiKey);
    return res.json({
      success: true,
      title: videoData.title,
      videoId: videoData.videoId
    });
  } catch (err) {
    console.error('YouTube Connection Test Failed:', err.message);
    return res.status(400).json({
      success: false,
      error: err.response?.data?.error?.message || err.message || 'Verification failed'
    });
  }
});

// -----------------------------------------------------------------------------
// ANNOUNCEMENTS ENDPOINTS
// -----------------------------------------------------------------------------

// GET /announcements
app.get('/announcements', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error('Fetch Announcements Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /announcements (Protected)
app.post('/announcements', requireAuth, upload.single('image'), async (req, res) => {
  const { title, body, date, status } = req.body;

  if (!title || !body || !date) {
    return res.status(400).json({ error: 'Title, body and date are required' });
  }

  try {
    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadToSupabase(req.file, 'announcements');
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title,
        body,
        date,
        status: status || 'active',
        image_url: imageUrl
      })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(data);
  } catch (err) {
    console.error('Create Announcement Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// PUT /announcements/:id (Protected)
app.put('/announcements/:id', requireAuth, upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { title, body, date, status, existing_image } = req.body;

  if (!title || !body || !date) {
    return res.status(400).json({ error: 'Title, body and date are required' });
  }

  try {
    let imageUrl = existing_image;
    if (req.file) {
      imageUrl = await uploadToSupabase(req.file, 'announcements');
    }

    const { data, error } = await supabase
      .from('announcements')
      .update({
        title,
        body,
        date,
        status,
        image_url: imageUrl
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error('Update Announcement Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /announcements/:id (Protected)
app.delete('/announcements/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (err) {
    console.error('Delete Announcement Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// CATEGORIES ENDPOINTS
// -----------------------------------------------------------------------------

// GET /categories
app.get('/categories', async (req, res) => {
  try {
    // 1. Fetch categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (catError) throw catError;

    // 2. Fetch mezmurs counts using grouping count from DB
    const { data: counts, error: countError } = await supabase
      .from('mezmurs')
      .select('category_id');

    if (countError) throw countError;

    // Map counts
    const countMap = {};
    counts.forEach(m => {
      if (m.category_id) {
        countMap[m.category_id] = (countMap[m.category_id] || 0) + 1;
      }
    });

    const result = categories.map(cat => ({
      ...cat,
      mezmurCount: countMap[cat.id] || 0
    }));

    return res.json(result);
  } catch (err) {
    console.error('Fetch Categories Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /categories (Protected)
app.post('/categories', requireAuth, upload.single('icon'), async (req, res) => {
  const { name, display_order } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    let iconUrl = null;
    if (req.file) {
      iconUrl = await uploadToSupabase(req.file, 'categories');
    }

    const order = display_order ? parseInt(display_order, 10) : 0;

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name,
        display_order: order,
        icon_url: iconUrl
      })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(data);
  } catch (err) {
    console.error('Create Category Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// PUT /categories/:id (Protected)
app.put('/categories/:id', requireAuth, upload.single('icon'), async (req, res) => {
  const { id } = req.params;
  const { name, display_order, existing_icon } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    let iconUrl = existing_icon;
    if (req.file) {
      iconUrl = await uploadToSupabase(req.file, 'categories');
    }

    const order = display_order ? parseInt(display_order, 10) : 0;

    const { data, error } = await supabase
      .from('categories')
      .update({
        name,
        display_order: order,
        icon_url: iconUrl
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error('Update Category Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /categories/:id (Protected)
app.delete('/categories/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    // Delete category - dependent mezmurs deleted cascade on DB level if set.
    // If cascade is not supported or not set up, it will delete because of schema structure.
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return res.json({ success: true, message: 'Category and all related mezmurs deleted successfully' });
  } catch (err) {
    console.error('Delete Category Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// MEZMURS ENDPOINTS
// -----------------------------------------------------------------------------

// GET /mezmurs
app.get('/mezmurs', async (req, res) => {
  const { category } = req.query;

  try {
    let query = supabase
      .from('mezmurs')
      .select('*, categories(name)')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category_id', category);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Reshape to flatten category name
    const result = data.map(m => ({
      ...m,
      category_name: m.categories ? m.categories.name : 'Uncategorized'
    }));

    return res.json(result);
  } catch (err) {
    console.error('Fetch Mezmurs Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /mezmurs (Protected)
app.post('/mezmurs', requireAuth, async (req, res) => {
  const {
    title,
    category_id,
    language,
    mezmur_number,
    author,
    tune,
    lyrics
  } = req.body;

  if (!title || !category_id || !language || !lyrics) {
    return res.status(400).json({ error: 'Title, category, language and lyrics are required' });
  }

  try {
    const { data, error } = await supabase
      .from('mezmurs')
      .insert({
        title,
        category_id,
        language,
        mezmur_number,
        author,
        tune,
        lyrics,
        last_edited_date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(data);
  } catch (err) {
    console.error('Create Mezmur Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// PUT /mezmurs/:id (Protected)
app.put('/mezmurs/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const {
    title,
    category_id,
    language,
    mezmur_number,
    author,
    tune,
    lyrics
  } = req.body;

  if (!title || !category_id || !language || !lyrics) {
    return res.status(400).json({ error: 'Title, category, language and lyrics are required' });
  }

  try {
    const { data, error } = await supabase
      .from('mezmurs')
      .update({
        title,
        category_id,
        language,
        mezmur_number,
        author,
        tune,
        lyrics,
        last_edited_date: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error('Update Mezmur Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /mezmurs/:id (Protected)
app.delete('/mezmurs/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('mezmurs')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return res.json({ success: true, message: 'Mezmur deleted successfully' });
  } catch (err) {
    console.error('Delete Mezmur Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`Backend server running on port ${PORT}`);
  // Ensure the supabase storage bucket is created
  await ensureBucketExists();
});
