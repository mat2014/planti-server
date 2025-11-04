const express = require('express');
const router = express.Router();

// Dados iniciais e ID Sequencial para simular o banco de dados
let tasks = [
    // O seu item de exemplo (sem o erro de digitação no ID)
    { id: '1', texto: 'Comprar novo substrato', concluido: true },
    { id: '2', texto: 'Verificar umidade da Hortelã', concluido: false },
    { id: '3', texto: 'Colher a Cebolinha', concluido: false },
    { id: '4', texto: 'Pesquisar sobre adubos orgânicos', concluido: false },
];
let nextId = 5; // Próximo ID a ser usado para novas tarefas

// Middleware para gerar um novo ID (simulando um DB)
const generateId = () => {
    const id = nextId.toString();
    nextId++;
    return id;
};

// =====================================================================
// Rota GET: /tasks
// Retorna todas as tarefas.
// =====================================================================
router.get('/', (req, res) => {
    console.log('GET /tasks: Lista de tarefas solicitada.');
    return res.json(tasks);
});

// =====================================================================
// Rota POST: /tasks
// Cria uma nova tarefa.
// Espera: { texto: string, concluido: boolean }
// =====================================================================
router.post('/', (req, res) => {
    const { texto, concluido } = req.body;
    
    if (!texto) {
        return res.status(400).json({ error: 'O campo "texto" é obrigatório.' });
    }

    const newTask = {
        id: generateId(),
        texto,
        concluido: concluido !== undefined ? concluido : false,
    };
    
    // Adiciona a nova tarefa no início da lista (para aparecer primeiro no app)
    tasks.unshift(newTask);

    console.log('POST /tasks: Tarefa adicionada.', newTask);
    return res.status(201).json(newTask);
});

// =====================================================================
// Rota PUT: /tasks/:id
// Atualiza uma tarefa existente (usado para edição e toggle de conclusão).
// Espera: { id: string, texto: string, concluido: boolean }
// =====================================================================
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { texto, concluido } = req.body;

    const taskIndex = tasks.findIndex(t => t.id === id);

    if (taskIndex === -1) {
        console.log(`PUT /tasks/${id}: Tarefa não encontrada.`);
        return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }

    // Atualiza a tarefa com os novos dados
    tasks[taskIndex] = { 
        ...tasks[taskIndex], // Mantém campos antigos que não foram enviados (Embora o React Native envie o objeto completo)
        texto: texto || tasks[taskIndex].texto,
        concluido: concluido !== undefined ? concluido : tasks[taskIndex].concluido,
    };

    console.log(`PUT /tasks/${id}: Tarefa atualizada.`, tasks[taskIndex]);
    return res.json(tasks[taskIndex]);
});


// =====================================================================
// Rota DELETE: /tasks/:id
// Deleta uma tarefa pelo ID.
// =====================================================================
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    const initialLength = tasks.length;
    // Filtra a lista, removendo a tarefa com o ID correspondente
    tasks = tasks.filter(t => t.id !== id);

    if (tasks.length === initialLength) {
        console.log(`DELETE /tasks/${id}: Tarefa não encontrada.`);
        return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }

    console.log(`DELETE /tasks/${id}: Tarefa excluída.`);
    // Retorna um status 204 (No Content) para deleção bem-sucedida
    return res.status(204).send(); 
});
// =====================================================================
// 3. ROTAS DE AUTENTICAÇÃO (LOGIN)
// =====================================================================

// Rota POST /login - Simula a autenticação
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // --- SIMULAÇÃO DE CREDENCIAIS VÁLIDAS ---
    const VALID_EMAIL = 'user@horta.com';
    const VALID_PASSWORD = '123';

    if (email === VALID_EMAIL && password === VALID_PASSWORD) {
        // Autenticação bem-sucedida
        console.log(`Login bem-sucedido para: ${email}`);
        return res.status(200).json({
            message: 'Login realizado com sucesso!',
            // Em um sistema real, aqui seria retornado um JWT (token de acesso)
            token: 'fake-jwt-token-12345',
            user: { email: email, name: 'Usuário Horta' }
        });
    } else {
        // Falha na autenticação
        console.log(`Tentativa de login falhou para: ${email}`);
        return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }
});
module.exports = router;