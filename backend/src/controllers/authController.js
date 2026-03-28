const supabase = require('../services/supabase');
const register = async (req, res) => {
  const { email, password, user_name } = req.body;

  if (!email || !password || !user_name) {
    return res.status(400).json({error: 'Email, password and username are required'});
  }

  const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  if (user_name.trim().length < 2) {
    return res.status(400).json({ error: 'Username must be at least 2 characters' });
  }
  
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { user_name }
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  const { error:profileError } = await supabase.from('profiles').insert({user_id: datasuser.id, user_name});

  if (profileError) {
    return res.status(400).json({error: profileError.message});
  }

  res.status(201).json({message: 'User created successfully', user_id: data.user.id });

};

const login = async (req, res) => {
  const {email, password} = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return res.status(401).json({ error: error.message });
  }

  res.status(200).json({
    message: 'Login successful',
    access_token: data.session.access_token,
    user_id: data.user.id
  });
};

module.exports = { register, login };


