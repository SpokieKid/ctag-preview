require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { OAuth2Client } = require('google-auth-library');
const ctagRoutes = require('./api/ctagRoutes');

const app = express();
const PORT = process.env.PORT || 5001;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 启用 CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

// 确保 /register-ctag 路由存在
app.post('/register-ctag', async (req, res) => {
  const { email, name } = req.body;
  
  try {
    // 在这里添加将用户信息保存到 Supabase 的逻辑
    const { data, error } = await supabase
      .from('users')
      .upsert({ email, name }, { onConflict: 'email' });

    if (error) throw error;

    res.json({ message: 'CTag registered successfully', data });
  } catch (error) {
    console.error('Error registering CTag:', error);
    res.status(500).json({ error: 'Failed to register CTag' });
  }
});

// 新增 /auth/google 路由
app.post('/auth/google', async (req, res) => {
  const { credential } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    // 检查用户是否已存在
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!user) {
      // 如果用户不存在，创建新用户
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({ email, name, google_id: googleId })
        .single();

      if (insertError) throw insertError;
      user = newUser;
    }

    // 获取用户的 CTags
    const { data: cTags, error: cTagsError } = await supabase
      .from('ctags')
      .select('tag_id')
      .eq('google_id', googleId);

    if (cTagsError) {
      console.error('Error fetching CTags:', cTagsError);
      throw cTagsError;
    }

    let userCTags = [];

    // 如果用户没有 CTag，自动创建一个
    if (!cTags || cTags.length === 0) {
      const newTagId = `ctag_${Math.random().toString(36).substr(2, 9)}`;
      const { data: newCTag, error: newCTagError } = await supabase
        .from('ctags')
        .insert([
          {
            tag_id: newTagId,
            google_id: googleId,
            web2_accounts: [email],
            web3_wallets: []
          }
        ])
        .single();

      if (newCTagError) throw newCTagError;
      userCTags = [newTagId];
    } else {
      userCTags = cTags.map(ct => ct.tag_id);
    }

    res.json({
      isRegistered: true,
      cTags: userCTags,
      user: { id: user.id, email: user.email, name: user.name, googleId }
    });
  } catch (error) {
    console.error('Error during Google authentication:', error);
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
});

app.use('/api/ctags', ctagRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});