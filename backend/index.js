const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/auth')
const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({status : 'ok'});
})

app.use('/auth', authRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
