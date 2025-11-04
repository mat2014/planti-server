const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000; // Porta principal

// Middlewares para aceitar JSON e permitir requisições de outras origens
app.use(express.json());
app.use(cors());

// =====================================================================
// 1. CONFIGURAÇÕES E FUNÇÕES PARA PLANTAS (PLANTS.JSON)
// =====================================================================

const PLANTS_DB_PATH = path.join(__dirname, 'plants.json');

// Função para ler os dados do arquivo plants.json
const readPlantsDB = () => {
    if (!fs.existsSync(PLANTS_DB_PATH)) {
        return [];
    }
    const data = fs.readFileSync(PLANTS_DB_PATH, 'utf8');
    if (!data) {
        return [];
    }
    return JSON.parse(data);
};

// Função para escrever os dados no arquivo plants.json
const writePlantsDB = (data) => {
    fs.writeFileSync(PLANTS_DB_PATH, JSON.stringify(data, null, 2));
};

// Rota GET /plants - Buscar todas as plantas (FUNCIONALIDADE EXISTENTE)
app.get('/plants', (req, res) => {
    try {
        const plants = readPlantsDB();
        res.status(200).json(plants);
    } catch (error) {
        res.status(500).json({ message: "Erro ao ler o banco de dados de plantas." });
    }
});

// Rota POST /plants - Adicionar uma nova planta (FUNCIONALIDADE EXISTENTE)
app.post('/plants', (req, res) => {
    const { nome, local } = req.body;

    if (!nome || !local) {
        return res.status(400).json({ message: 'Nome e local são obrigatórios.' });
    }

    try {
        const plants = readPlantsDB();
        const newPlant = {
            id: Date.now().toString(), // Gera um ID único
            nome,
            local,
        };

        plants.push(newPlant);
        writePlantsDB(plants);

        res.status(201).json(newPlant); 
    } catch (error) {
        res.status(500).json({ message: "Erro ao salvar a nova planta." });
    }
});

// =====================================================================
// 2. CONFIGURAÇÕES E FUNÇÕES PARA TAREFAS (TASKS.JSON)
// (NOVA FUNCIONALIDADE)
// =====================================================================

const TASKS_DB_PATH = path.join(__dirname, 'tasks.json');

// Função para ler os dados do arquivo tasks.json
const readTasksDB = () => {
    if (!fs.existsSync(TASKS_DB_PATH)) {
        return [];
    }
    const data = fs.readFileSync(TASKS_DB_PATH, 'utf8');
    if (!data) {
        return [];
    }
    return JSON.parse(data);
};

// Função para escrever os dados no arquivo tasks.json
const writeTasksDB = (data) => {
    fs.writeFileSync(TASKS_DB_PATH, JSON.stringify(data, null, 2));
};

// --- ROTAS DA LISTA DE TAREFAS (/tasks) ---

// Rota GET /tasks - Buscar todas as tarefas
app.get('/tasks', (req, res) => {
    try {
        const tasks = readTasksDB();
        // Ordena pela ID (baseada em Date.now()) para que as mais novas fiquem no topo
        const sortedTasks = tasks.sort((a, b) => b.id.localeCompare(a.id)); 
        res.status(200).json(sortedTasks);
    } catch (error) {
        res.status(500).json({ message: "Erro ao ler o banco de dados de tarefas." });
    }
});

// Rota POST /tasks - Criar nova tarefa
app.post('/tasks', (req, res) => {
    const { texto, concluido } = req.body;

    if (!texto) {
        return res.status(400).json({ message: 'O campo "texto" é obrigatório.' });
    }

    try {
        const tasks = readTasksDB();
        const newTask = {
            id: Date.now().toString(), 
            texto,
            concluido: concluido !== undefined ? concluido : false,
        };

        tasks.push(newTask);
        writeTasksDB(tasks);

        res.status(201).json(newTask); 
    } catch (error) {
        res.status(500).json({ message: "Erro ao salvar a nova tarefa." });
    }
});

// Rota PUT /tasks/:id - Atualizar (Editar ou Alternar Conclusão)
app.put('/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { texto, concluido } = req.body;

    try {
        let tasks = readTasksDB();
        const taskIndex = tasks.findIndex(t => t.id === id);

        if (taskIndex === -1) {
            return res.status(404).json({ message: 'Tarefa não encontrada.' });
        }

        // Atualiza a tarefa com os novos dados
        tasks[taskIndex] = { 
            ...tasks[taskIndex],
            texto: texto !== undefined ? texto : tasks[taskIndex].texto,
            concluido: concluido !== undefined ? concluido : tasks[taskIndex].concluido,
        };

        writeTasksDB(tasks);
        res.status(200).json(tasks[taskIndex]);
    } catch (error) {
        res.status(500).json({ message: "Erro ao atualizar a tarefa." });
    }
});

// Rota DELETE /tasks/:id - Deletar tarefa
app.delete('/tasks/:id', (req, res) => {
    const { id } = req.params;

    try {
        const tasks = readTasksDB();
        const initialLength = tasks.length;
        
        const updatedTasks = tasks.filter(t => t.id !== id);

        if (updatedTasks.length === initialLength) {
            return res.status(404).json({ message: 'Tarefa não encontrada para exclusão.' });
        }

        writeTasksDB(updatedTasks);
        // Status 204 indica sucesso na exclusão sem corpo de resposta
        res.status(204).send(); 
    } catch (error) {
        res.status(500).json({ message: "Erro ao excluir a tarefa." });
    }
});

// =====================================================================
// 3. INICIALIZAÇÃO DO SERVIDOR
// =====================================================================

// Rota principal para testar se o servidor está no ar
app.get('/', (req, res) => {
    res.status(200).json({ message: 'API de Plantas e Tarefas está funcionando!' });
});
// ... (mantenha os requires, consts e as funções para PLANTS e TASKS)
const USERS_DB_PATH = path.join(__dirname, 'users.json');

// =====================================================================
// 4. CONFIGURAÇÕES E FUNÇÕES PARA USUÁRIOS (USERS.JSON)
// =====================================================================

// Função para ler os dados do arquivo users.json
const readUsersDB = () => {
    if (!fs.existsSync(USERS_DB_PATH)) {
        return [];
    }
    const data = fs.readFileSync(USERS_DB_PATH, 'utf8');
    if (!data) {
        return [];
    }
    return JSON.parse(data);
};

// Função para escrever os dados no arquivo users.json
const writeUsersDB = (data) => {
    fs.writeFileSync(USERS_DB_PATH, JSON.stringify(data, null, 2));
};

// --- Rota POST /register - Cadastra um novo usuário ---
app.post('/register', (req, res) => {
    // Espera nome, email e password
    const { name, email, password } = req.body; 

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' });
    }

    try {
        const users = readUsersDB();
        
        // 1. Verificar se o e-mail já existe
        if (users.find(u => u.email === email)) {
            return res.status(409).json({ message: 'E-mail já cadastrado.' });
        }

        // 2. Criar novo usuário (NOTA: A senha deve ser HASHADA em uma aplicação real!)
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password, 
            createdAt: new Date().toISOString(),
        };

        users.push(newUser);
        writeUsersDB(users);

        console.log(`Usuário registrado: ${email}`);
        return res.status(201).json({ 
            message: 'Cadastro realizado com sucesso!',
            user: { name: newUser.name, email: newUser.email }
        });
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        return res.status(500).json({ message: 'Erro interno ao salvar o usuário.' });
    }
});

// ... (mantenha a rota POST /login e app.listen no final)
// Inicia o servidor para ouvir na porta definida
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});