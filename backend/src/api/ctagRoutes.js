const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// Register a new C-Tag
router.post('/register', async (req, res) => {
  try {
    const { tagId, web2Accounts, web3Wallets } = req.body;
    console.log('Received data:', { tagId, web2Accounts, web3Wallets });

    const { data, error } = await supabase
      .from('ctags')
      .insert([
        { 
          tag_id: tagId, 
          web2_accounts: web2Accounts, 
          web3_wallets: web3Wallets 
        }
      ]);

    if (error) throw error;

    res.status(201).json({ message: 'C-Tag registered successfully', cTag: data[0] });
  } catch (error) {
    console.error('Error in /register:', error);
    res.status(400).json({ message: 'Error registering C-Tag', error: error.message });
  }
});

// Get C-Tag by ID
router.get('/:tagId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ctags')
      .select('*')
      .eq('tag_id', req.params.tagId)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ message: 'C-Tag not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(400).json({ message: 'Error fetching C-Tag', error: error.message });
  }
});

// 检查用户是否已注册CTag
router.get('/check/:googleId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ctags')
      .select('tag_id')
      .eq('google_id', req.params.googleId);

    if (error) throw error;

    if (data && data.length > 0) {
      res.json({ registered: true, tags: data.map(item => item.tag_id) });
    } else {
      res.json({ registered: false });
    }
  } catch (error) {
    res.status(400).json({ message: 'Error checking CTag registration', error: error.message });
  }
});

// 自动注册新的CTag
router.post('/auto-register', async (req, res) => {
  try {
    const { googleId, email } = req.body;
    const tagId = `ctag_${Math.random().toString(36).substr(2, 9)}`;

    const { data, error } = await supabase
      .from('ctags')
      .insert([
        { 
          tag_id: tagId, 
          google_id: googleId,
          web2_accounts: [email],
          web3_wallets: []
        }
      ]);

    if (error) throw error;

    res.status(201).json({ message: 'CTag auto-registered successfully', cTag: data[0] });
  } catch (error) {
    res.status(400).json({ message: 'Error auto-registering CTag', error: error.message });
  }
});

// 添加新的路由来获取用户的 CTag 信息
router.get('/user-ctags/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const { data, error } = await supabase
      .from('user_ctags')
      .select('ctag')
      .eq('user_id', userId);

    if (error) throw error;

    const ctags = data.map(item => item.ctag);
    res.json({ ctags });
  } catch (error) {
    console.error('Error fetching user CTags:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;