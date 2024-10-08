require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 5001;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 启用 CORS
app.use(cors({
  origin: 'http://localhost:3000', // 允许前端域名
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 允许的 HTTP 方法
  allowedHeaders: ['Content-Type', 'Authorization'], // 允许的头部
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
    const { email, name } = payload;

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
        .insert({ email, name })
        .single();

      if (insertError) throw insertError;
      user = newUser;
    }

    // 获取用户的 CTags
    const { data: cTags, error: cTagsError } = await supabase
      .from('ctags')
      .select('tag')  // 确保这里的列名是正确的
      .eq('user_id', user.id);

    if (cTagsError) {
      console.error('Error fetching CTags:', cTagsError);
      throw cTagsError;
    }

    // 如果 cTags 为 null 或 undefined，返回空数组
    const userCTags = cTags ? cTags.map(ct => ct.tag) : [];

    res.json({
      isRegistered: !!user,
      cTags: userCTags,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Error during Google authentication:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});