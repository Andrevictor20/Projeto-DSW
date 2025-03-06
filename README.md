# Photo Battle 🎄📸

Um aplicativo web para competições de fotos de decorações de Natal, permitindo a criação de salas personalizadas, upload de fotos e votação. Desenvolvido como projeto acadêmico para a disciplina de Desenvolvimento de Sistemas Web.

---

## 📌 Visão Geral
**Objetivo:** Promover interação social em confraternizações de fim de ano através de competições de fotos temáticas.  
**Público-alvo:** Famílias e amigos que desejam tornar suas celebrações mais dinâmicas.  

---

## ✨ Funcionalidades
- **Autenticação:** Cadastro e login
- **Salas Personalizadas:**
  - Criação de salas com limite de participantes e privacidade (aberta/privada).
  - Controle de acesso por senha para salas privadas.
  - Papéis de administrador e membro nas salas
- **Competição de Fotos:**
  - Upload de fotos vinculadas a salas.
  - Votação única por usuário por sala.
- **Interação Social:**
  - Visualização de perfis de participantes.
  - Exploração de salas e fotos.
- **Integração Frontend-Backend:** API RESTful para comunicação dinâmica.

---

## 🛠️ Tecnologias
- **Frontend:** HTML, CSS, Bootstrap 5, JavaScript.
- **Backend:** TypeScript, Fastify, Zod (validação), Prisma ORM.
- **Banco de Dados:** PostgreSQL.
- **Infraestrutura:** Docker para containerização.
- **Outras Ferramentas:** Git, Docker Compose.

---

## 🚀 Instalação e Execução
**Pré-requisitos:** Docker e Docker Compose instalados.

```bash
# Clonar repositório
git clone https://github.com/Andrevictor20/Projeto-DSW

# Entrar no diretório
cd Projeto-DSW/

# Iniciar containers
docker compose up -d --build

# Acessar o sistema:
# Frontend: http://localhost:5600
# Backend: http://localhost:5700
