const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// Register a new C-Tag
router.post('/register', async (req, res) => {
  try {
    const { googleId, email } = req.body;
    console.log('Received data:', { googleId, email });

    if (!googleId || !email) {
      return res.status(400).json({ message: 'Google ID and email are required' });
    }

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
    
    if (!googleId || !email) {
      return res.status(400).json({ message: 'Google ID and email are required' });
    }

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
    console.error('Error in /auto-register:', error);
    res.status(400).json({ message: 'Error auto-registering CTag', error: error.message });
  }
});

// 检查获取用户 cTags 的路由
router.get('/user-ctags/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { data, error } = await supabase
      .from('ctags')
      .select('tag_id')
      .eq('google_id', userId);

    if (error) throw error;

    if (!data) {
      return res.json([]);
    }

    res.json(data.map(item => item.tag_id));
  } catch (error) {
    console.error('Error fetching user cTags:', error);
    res.status(500).json({ error: 'Failed to fetch user cTags', details: error.message });
  }
});

// 自动创建名为 "ns" 的 CTag
router.post('/auto-create-ns', async (req, res) => {
  try {
    const { googleId, email } = req.body;
    
    if (!googleId || !email) {
      return res.status(400).json({ message: 'Google ID and email are required' });
    }

    const tagId = 'ns';

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

    res.status(201).json({ message: 'NS CTag created successfully', cTag: data[0] });
  } catch (error) {
    console.error('Error in /auto-create-ns:', error);
    res.status(400).json({ message: 'Error creating NS CTag', error: error.message });
  }
});

module.exports = router;