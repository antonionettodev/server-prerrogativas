const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');
const crypto = require('crypto');
const cors = require('cors');
const { body, validationResult } = require('express-validator');

const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 8800;
const secretKey = crypto.randomBytes(32).toString('hex');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'prerrogativas_admin',
  password: 'prerrogativasoab',
  database: 'oab_prerrogativas',
});

db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('Conectado ao banco de dados MySQL');
  }
});

app.post(
  '/login',
  [
    body('oab_card').notEmpty().isString(),
    body('security_number').notEmpty().isString(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { oab_card, security_number } = req.body;
    const sql =
      'SELECT name, oab_card FROM advogados WHERE oab_card = ? AND security_number = ?;';

    db.query(sql, [oab_card, security_number], (err, results) => {
      if (err) {
        console.error('Erro na consulta ao banco de dados:', err);
        return res.status(500).json({ message: 'Erro interno do servidor' });
      }

      if (results.length === 1) {
        const user = results[0];
        const token = jwt.sign({ oab_card }, secretKey, { expiresIn: '31d' });
        return res.json({ token, user });
      } else {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }
    });
  },
);

app.post('/emergency', (req, res) => {
  const { name, local, hour, date, oab_card } = req.body;

  // Inserir dados na tabela "emergency"
  const sql =
    'INSERT INTO emergency (name, local, hour, date, oab_card) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [name, local, hour, date, oab_card], (err, result) => {
    if (err) {
      console.error('Erro ao inserir dados:', err);
      return res
        .status(500)
        .json({ error: 'Erro ao inserir dados na tabela "emergency"' });
    }

    return res
      .status(200)
      .json({ message: 'Dados inseridos com sucesso na tabela "emergency"' });
  });
});

app.listen(port, () => {
  console.log(`Servidor está rodando na porta ${port}`);
});
